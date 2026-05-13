// EasyFlow Webhook — handles Order, Subscription, Payment events
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const rawBody = await req.text();

    // Validate webhook signature (HMAC-SHA256)
    const WEBHOOK_SECRET = Deno.env.get("EASYFLOW_API_SECRET") ?? "";
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get("x-signature") || req.headers.get("x-webhook-signature") || "";
      if (signature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", encoder.encode(WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
        const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
        if (signature !== expected) {
          console.warn("[EasyFlow] Invalid webhook signature");
          // Log but don't block (EasyFlow may not send signatures for all event types)
        }
      }
    }

    let body: Record<string, any> = {};
    try { body = JSON.parse(rawBody); } catch {
      try { const p = new URLSearchParams(rawBody); p.forEach((v, k) => { try { body[k] = JSON.parse(v); } catch { body[k] = v; } }); }
      catch { body = { raw: rawBody }; }
    }

    const event = (body.event || "").toLowerCase();
    const payload = body.payload || body;

    console.log(`[EasyFlow] Event: ${event}`);

    // Save raw event for audit. CAPTURA O ID inserido pra atualizacoes
    // subsequentes — UPDATE com .order().limit() no PostgREST e SILENCIOSAMENTE
    // ignorado, o que fazia toda nova falha sobrescrever error_message de
    // TODAS as linhas anteriores com mesmo provider+event_type. Bug grave.
    const { data: auditRow, error: auditErr } = await supabase
      .from("webhook_events")
      .insert({ provider: "easyflow", event_type: event || "unknown", payload: body })
      .select("id")
      .single();
    if (auditErr) console.warn("[EasyFlow] webhook_events insert failed:", auditErr.message);
    const auditId: string | null = auditRow?.id ?? null;

    // Helpers — atualizam APENAS a linha deste webhook (por id), nunca por filtros
    const markFailed = async (msg: string) => {
      if (!auditId) return;
      await supabase.from("webhook_events")
        .update({ processed: false, error_message: msg })
        .eq("id", auditId);
    };
    const markProcessed = async () => {
      if (!auditId) return;
      await supabase.from("webhook_events")
        .update({ processed: true, error_message: null })
        .eq("id", auditId);
    };

    // ── Extract email (different locations for Order vs Subscription vs Payment) ──
    // Order events: payload.buyer.email
    // Subscription events: payload.customer.email
    // Payment events: may NOT have email — need fallback strategies
    let email = (
      payload.buyer?.email ||
      payload.customer?.email ||
      payload.email ||
      payload.buyer?.checkout_email ||
      body.buyer?.email ||
      body.customer?.email ||
      body.email ||
      ""
    ).toLowerCase().trim();

    // ── Fallbacks pra payment.paid sem email ──
    // Ordem por confiabilidade:
    //   1. ID do pagamento → subscription existente (exato, instantaneo)
    //   2. EasyFlow API /sales/filter pelo payment ID (autoritativo, traz email real)
    //   3. holderName → profiles.full_name (heuristica, exige match UNICO + signup recente)
    //   4. holderName → auth.users (heuristica, mesma protecao)
    let fallbackUserId: string | null = null;
    if (!email && (event === "payment.paid" || event === "subscriptionrecurrence.paid")) {
      console.log(`[EasyFlow] No email in ${event} payload, trying fallbacks...`);

      // ── Fallback 1: ID do pagamento -> subscription existente ──
      const paymentId = payload.id || "";
      if (paymentId) {
        const { data: subByCustomer } = await supabase
          .from("subscriptions")
          .select("user_id")
          .or(`stripe_customer_id.eq.${paymentId},stripe_subscription_id.eq.${paymentId}`)
          .maybeSingle();
        if (subByCustomer) {
          fallbackUserId = subByCustomer.user_id;
          console.log(`[EasyFlow] Fallback 1 (subscription by payment ID): found user ${fallbackUserId}`);
        }
      }

      // ── Fallback 2: EasyFlow API /sales/filter (autoritativo) ──
      if (!fallbackUserId && paymentId) {
        const EF_API = "https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com";
        const EF_SECRET = Deno.env.get("EASYFLOW_API_SECRET") ?? "";
        const EF_SECRET2 = Deno.env.get("EASYFLOW2_API_SECRET") ?? "";
        const secrets = [EF_SECRET, EF_SECRET2].filter(Boolean);

        for (const secret of secrets) {
          try {
            // Timeout de 5s — se EasyFlow API esta lenta, cai pro proximo fallback
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 5000);
            const salesRes = await fetch(`${EF_API}/sales/filter`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${secret}` },
              body: JSON.stringify({ paymentId, search: paymentId }),
              signal: ctrl.signal,
            });
            clearTimeout(t);
            if (salesRes.ok) {
              const salesData = await salesRes.json();
              const sales = salesData?.data || salesData?.items || salesData || [];
              const sale = Array.isArray(sales) ? sales[0] : sales;
              const saleEmail = (sale?.buyer?.email || sale?.customer?.email || sale?.email || "").toLowerCase().trim();
              if (saleEmail) {
                email = saleEmail;
                console.log(`[EasyFlow] Fallback 2 (API /sales/filter): found email ${email}`);
                const { data: p } = await supabase.from("profiles").select("user_id").ilike("email", email).maybeSingle();
                if (p) {
                  fallbackUserId = p.user_id;
                  break;
                }
              }
            }
          } catch (apiErr) {
            console.warn(`[EasyFlow] Fallback 2 API error: ${(apiErr as Error).message}`);
          }
        }
      }

      // ── Fallback 3: holderName -> profiles.full_name (PROTEGIDO contra homonimo) ──
      // Match so se houver EXATAMENTE 1 profile com esse nome (evita ativar conta errada)
      // E so considera signup recente (< 30 dias) — assinatura nova provavelmente vem de
      // signup recente, alem de reduzir o universo de candidatos.
      if (!fallbackUserId) {
        const holderName = (payload.creditCard?.holderName || "").trim();
        if (holderName) {
          const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
          const { data: matches } = await supabase
            .from("profiles")
            .select("user_id, email, created_at")
            .ilike("full_name", holderName)
            .gte("created_at", cutoff)
            .limit(2);

          if (matches && matches.length === 1) {
            fallbackUserId = matches[0].user_id;
            email = (matches[0].email || "").toLowerCase().trim();
            console.log(`[EasyFlow] Fallback 3 (holderName match unico, signup recente): ${holderName} -> ${email}`);
          } else if (matches && matches.length > 1) {
            console.warn(`[EasyFlow] Fallback 3 ABORTADO: ${matches.length} profiles homonimos para "${holderName}" — risco de ativar conta errada`);
          }
        }
      }

      // ── Fallback 4: holderName -> auth.users (mesma protecao) ──
      if (!fallbackUserId) {
        const holderName = (payload.creditCard?.holderName || "").trim().toLowerCase();
        if (holderName) {
          const { data: authList } = await supabase.auth.admin.listUsers();
          const cutoff = Date.now() - 30 * 86400000;
          const candidates = (authList?.users ?? []).filter((u: any) => {
            const meta = u.user_metadata || {};
            const nameMatch = (meta.full_name || "").toLowerCase().trim() === holderName;
            const recent = new Date(u.created_at).getTime() >= cutoff;
            return nameMatch && recent;
          });
          if (candidates.length === 1) {
            fallbackUserId = candidates[0].id;
            email = (candidates[0].email || "").toLowerCase().trim();
            console.log(`[EasyFlow] Fallback 4 (auth.users name match unico, signup recente): ${holderName} -> ${email}`);
          } else if (candidates.length > 1) {
            console.warn(`[EasyFlow] Fallback 4 ABORTADO: ${candidates.length} users homonimos para "${holderName}"`);
          }
        }
      }

      if (!fallbackUserId) {
        const holderName = payload.creditCard?.holderName || "desconhecido";
        const paymentMethod = payload.paymentMethod || "desconhecido";
        console.error(`[EasyFlow] ${event} sem email e fallbacks falharam. method=${paymentMethod} holderName=${holderName}`);
        await markFailed(`no_email_all_fallbacks_failed: method=${paymentMethod} holderName=${holderName} paymentId=${payload.id}`);
        return json({ received: true, action: "skipped_no_email_fallbacks_failed", holderName, paymentMethod });
      }
    }

    if (!email && !fallbackUserId) {
      console.log("[EasyFlow] No email found, skipping");
      await markFailed("no_email_in_payload");
      return json({ received: true, action: "skipped_no_email" });
    }

    // ── Ofertas/checkouts especificos que sabemos serem ANUAIS (forca deteccao
    // determinante, sem depender de como o painel EasyFlow nomeou o produto).
    // Atualmente: 3 ofertas da roleta da Semana Medica de Itajuba (50/30/20% off).
    // Manter sincronizado com supabase/functions/roulette-spin/index.ts
    const ROLETA_ANNUAL_OFFER_IDS = new Set([
      "6385c0a1-b988-4ddd-9607-ee2ec15b3846", // 20% off anual
      "5d0dbbfd-d06c-4252-8a29-3c51665c77c2", // 30% off anual
      "fc67ad17-4b71-4067-b25b-52370c6de476", // 50% off anual
    ]);

    // ── Detect plan from subscription periodicity / product name / description ──
    const detectPlan = (): string => {
      // 0. Match deterministico por offer/checkout id — busca o UUID em qualquer
      // campo do payload pra cobrir variacoes de schema da EasyFlow
      // (offer.id, checkout.id, offerId, items[].offer.id, etc.)
      try {
        const payloadStr = JSON.stringify(payload);
        for (const id of ROLETA_ANNUAL_OFFER_IDS) {
          if (payloadStr.includes(id)) {
            console.log(`[EasyFlow] detectPlan: roleta annual offer detected (${id}) -> annual`);
            return "annual";
          }
        }
      } catch { /* ignore */ }

      // 1. Subscription events have periodicity
      const period = (payload.periodicity || "").toLowerCase();
      if (period === "annualy" || period === "annually" || period === "yearly") return "annual";
      if (period === "biannualy" || period === "biannually") return "biannual";
      if (period === "monthly") return "monthly";
      if (period === "quarterly") return "quarterly";

      // 2. Order events — combina nome + descricao + offer.name pra pegar "Cobranca comum / Assinatura anual"
      const haystack = [
        payload.items?.[0]?.product?.name,
        payload.items?.[0]?.product?.description,
        payload.items?.[0]?.offer?.name,
        payload.items?.[0]?.offer?.description,
        payload.offer?.name,
        payload.offer?.description,
        payload.product?.name,
        payload.product?.description,
        payload.name,
        payload.description,
      ].filter(Boolean).join(" ").toLowerCase();

      if (haystack.includes("bianual") || haystack.includes("2 ano") || haystack.includes("24 mes")) return "biannual";
      if (haystack.includes("anual") || haystack.includes("annual") || haystack.includes("1 ano") || haystack.includes("12 mes")) return "annual";
      return "monthly";
    };

    // ── Find user by email (case-insensitive, com fallback via auth.users e fallbackUserId) ──
    const findUser = async () => {
      // 0. Se ja temos o user_id via fallback (payment.paid sem email)
      if (fallbackUserId) {
        console.log(`[EasyFlow] findUser: usando fallbackUserId ${fallbackUserId}`);
        return { user_id: fallbackUserId };
      }

      // 1. profiles por email case-insensitive
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", email)
        .maybeSingle();
      if (p) return p;

      // 2. fallback: auth.users direto (caso profile esteja com email dessincronizado)
      const { data: authList } = await supabase.auth.admin.listUsers();
      const found = authList?.users?.find((u: any) => (u.email || "").toLowerCase().trim() === email);
      if (found) {
        console.log(`[EasyFlow] findUser: encontrou via auth.users (profile dessincronizado): ${email}`);
        return { user_id: found.id };
      }
      return null;
    };

    // ══════════════════════════════════════════════
    // ACTIVATION EVENTS (payment/subscription confirmed)
    // ══════════════════════════════════════════════
    if (
      event === "order.paid" ||
      event === "payment.paid" ||
      event === "subscription.activated" ||
      event === "subscription.created" ||
      event === "subscriptionrecurrence.paid"
    ) {
      const profile = await findUser();
      if (!profile) {
        console.error(`[EasyFlow] User NOT FOUND: ${email} — criar conta antes ou revisar payload`);
        await markFailed(`user_not_found: ${email}`);
        return json({ received: true, action: "user_not_found", email }, 200);
      }

      let plan = detectPlan();

      // Se payment.paid nao tem info de plano, manter o plano existente da subscription
      if (plan === "monthly" && (event === "payment.paid" || event === "subscriptionrecurrence.paid")) {
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("plan_type")
          .eq("user_id", profile.user_id)
          .maybeSingle();
        if (existingSub?.plan_type && existingSub.plan_type !== "none" && existingSub.plan_type !== "free_access") {
          plan = existingSub.plan_type;
          console.log(`[EasyFlow] detectPlan fallback: mantendo plano existente '${plan}' para ${event}`);
        }
      }

      // Upsert subscription (AGORA com checagem de erro)
      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", profile.user_id).maybeSingle();

      const now = new Date().toISOString();
      const subData = {
        status: "active" as const,
        plan_type: plan,
        stripe_customer_id: payload.id || payload.buyer?.id || payload.customer?.id || null,
        stripe_subscription_id: payload.payments?.[0]?.id || payload.id || null,
        access_expires_at: null as string | null,
        cancel_at_period_end: false,
        canceled_at: null as string | null,
        updated_at: now,
      };

      let subErr: { message: string } | null = null;
      if (existing) {
        const r = await supabase.from("subscriptions").update(subData).eq("user_id", profile.user_id);
        subErr = r.error;
      } else {
        const r = await supabase.from("subscriptions").insert({ user_id: profile.user_id, ...subData });
        subErr = r.error;
      }
      if (subErr) {
        console.error(`[EasyFlow] FAILED to upsert subscription for ${email}:`, subErr.message);
        await markFailed(`subscription_upsert_failed: ${subErr.message}`);
        return json({ received: true, action: "error", error: subErr.message }, 500);
      }

      // Update or create CRM lead. UPDATE sozinho fica silencioso (0 rows)
      // se o user nunca virou lead — checa existencia antes e insere se faltar.
      const { data: existingLead } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existingLead) {
        const { error: leadErr } = await supabase.from("crm_leads")
          .update({ status: "subscriber", converted_at: now, updated_at: now })
          .eq("user_id", profile.user_id);
        if (leadErr) console.warn(`[EasyFlow] crm_leads update falhou: ${leadErr.message}`);
      } else {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", profile.user_id)
          .maybeSingle();
        const { error: insErr } = await supabase.from("crm_leads").insert({
          user_id: profile.user_id,
          email,
          nome: prof?.full_name ?? email,
          status: "subscriber",
          converted_at: now,
        });
        if (insErr) console.warn(`[EasyFlow] crm_leads insert falhou: ${insErr.message}`);
        else console.log(`[EasyFlow] crm_leads CRIADO pro novo subscriber: ${email}`);
      }

      // Resolve any open inadimplencia
      await supabase.from("admin_inadimplencias")
        .update({ status: "resolvido", updated_at: now })
        .eq("user_id", profile.user_id)
        .eq("status", "em_cobranca");

      console.log(`[EasyFlow] ✅ Activated: ${email} -> ${plan}`);
      await markProcessed();
      return json({ received: true, action: "activated", email, plan });
    }

    // ══════════════════════════════════════════════
    // CANCELLATION / EXPIRATION EVENTS
    // ══════════════════════════════════════════════
    if (
      event === "order.canceled" ||
      event === "order.refunded" ||
      event === "payment.canceled" ||
      event === "payment.refunded" ||
      event === "payment.chargeback" ||
      event === "subscription.canceled" ||
      event === "subscription.expired" ||
      event === "subscription.inactivated" ||
      event === "subscriptionrecurrence.canceled"
    ) {
      const profile = await findUser();
      if (profile) {
        await supabase.from("subscriptions")
          .update({ status: "inactive", plan_type: "none" })
          .eq("user_id", profile.user_id);

        await supabase.from("crm_leads")
          .update({ status: "churned", churned_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);

        console.log(`[EasyFlow] ❌ Cancelled/Expired: ${email}`);
      }
      return json({ received: true, action: "cancelled", email });
    }

    // ══════════════════════════════════════════════
    // PAYMENT ISSUES (delayed/failed — mark as inadimplente)
    // ══════════════════════════════════════════════
    if (
      event === "subscriptionrecurrence.delayed" ||
      event === "subscriptionrecurrence.failed"
    ) {
      const profile = await findUser();
      if (profile) {
        // Mark subscription as inadimplente but keep plan_type
        await supabase.from("subscriptions")
          .update({ status: "inadimplente" })
          .eq("user_id", profile.user_id);

        // Get subscription details for inadimplencia record
        const { data: sub } = await supabase.from("subscriptions")
          .select("plan_type").eq("user_id", profile.user_id).maybeSingle();

        const { data: prof } = await supabase.from("profiles")
          .select("full_name").eq("user_id", profile.user_id).maybeSingle();

        // Upsert inadimplencia record
        const { data: existing } = await supabase.from("admin_inadimplencias")
          .select("id, tentativas").eq("user_id", profile.user_id).eq("status", "em_cobranca").maybeSingle();

        if (existing) {
          await supabase.from("admin_inadimplencias")
            .update({
              tentativas: (existing.tentativas ?? 0) + 1,
              ultimo_evento: event,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          const PLAN_VALORES: Record<string, number> = {
            monthly: 49.90, annual: 350.90 / 12, biannual: 599.90 / 6,
          };
          await supabase.from("admin_inadimplencias").insert({
            user_id: profile.user_id,
            email,
            nome: prof?.full_name ?? email,
            plano: sub?.plan_type ?? "unknown",
            valor_devido: PLAN_VALORES[sub?.plan_type ?? ""] ?? 0,
            status: "em_cobranca",
            tentativas: 1,
            ultimo_evento: event,
            data_ocorrencia: new Date().toISOString(),
          });
        }

        console.log(`[EasyFlow] Payment issue: ${email} (${event})`);
      }
      return json({ received: true, action: "payment_issue_tracked", email, event });
    }

    // ══════════════════════════════════════════════
    // UPDATES / OTHER EVENTS
    // ══════════════════════════════════════════════
    if (event === "order.updated" || event === "subscription.updated") {
      console.log(`[EasyFlow] Update event: ${event} for ${email}`);
      return json({ received: true, action: "updated", email, event });
    }

    console.log(`[EasyFlow] Unhandled: ${event}`);
    return json({ received: true, action: "unhandled", event });

  } catch (err) {
    console.error("[EasyFlow Error]", (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}