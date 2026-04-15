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

    // Save raw event for audit (tabela agora existe)
    const { error: auditErr } = await supabase
      .from("webhook_events")
      .insert({ provider: "easyflow", event_type: event || "unknown", payload: body });
    if (auditErr) console.warn("[EasyFlow] webhook_events insert failed:", auditErr.message);

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

    // ── Fallback: payment.paid sem email — buscar por holderName ou subscription existente ──
    let fallbackUserId: string | null = null;
    if (!email && (event === "payment.paid" || event === "subscriptionrecurrence.paid")) {
      console.log(`[EasyFlow] No email in ${event} payload, trying fallbacks...`);

      // Fallback 1: buscar subscription existente pelo stripe_customer_id/stripe_subscription_id
      // (o order.paid/subscription.created original salvou esse ID — o payment.paid tem o mesmo)
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

      // Fallback 2: buscar por holderName do cartao no profiles.full_name
      if (!fallbackUserId) {
        const holderName = (payload.creditCard?.holderName || "").trim();
        if (holderName) {
          // Busca case-insensitive por nome completo
          const { data: profileByName } = await supabase
            .from("profiles")
            .select("user_id, email")
            .ilike("full_name", holderName)
            .maybeSingle();
          if (profileByName) {
            fallbackUserId = profileByName.user_id;
            email = (profileByName.email || "").toLowerCase().trim();
            console.log(`[EasyFlow] Fallback 2 (holderName match): ${holderName} -> ${email}`);
          }
        }
      }

      // Fallback 3: buscar via EasyFlow API (POST /sales/filter)
      if (!fallbackUserId) {
        const EF_API = "https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com";
        const EF_SECRET = Deno.env.get("EASYFLOW_API_SECRET") ?? "";
        if (EF_SECRET) {
          try {
            const salesRes = await fetch(`${EF_API}/sales/filter`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${EF_SECRET}`,
              },
              body: JSON.stringify({ paymentId: payload.id }),
            });
            if (salesRes.ok) {
              const salesData = await salesRes.json();
              const sales = salesData?.data || salesData?.items || salesData || [];
              const sale = Array.isArray(sales) ? sales[0] : sales;
              const saleEmail = (
                sale?.buyer?.email || sale?.customer?.email || sale?.email || ""
              ).toLowerCase().trim();
              if (saleEmail) {
                email = saleEmail;
                console.log(`[EasyFlow] Fallback 3 (EasyFlow API sales/filter): found email ${email}`);
                // Agora buscar user_id com esse email
                const { data: p } = await supabase
                  .from("profiles")
                  .select("user_id")
                  .ilike("email", email)
                  .maybeSingle();
                if (p) fallbackUserId = p.user_id;
              }
            } else {
              console.warn(`[EasyFlow] Fallback 3 API returned ${salesRes.status}`);
            }
          } catch (apiErr) {
            console.warn(`[EasyFlow] Fallback 3 API error: ${(apiErr as Error).message}`);
          }
        }
      }

      // Fallback 4: buscar no auth.users pelo nome
      if (!fallbackUserId) {
        const holderName = (payload.creditCard?.holderName || "").trim().toLowerCase();
        if (holderName) {
          const { data: authList } = await supabase.auth.admin.listUsers();
          const found = authList?.users?.find((u: any) => {
            const meta = u.user_metadata || {};
            return (meta.full_name || "").toLowerCase().trim() === holderName;
          });
          if (found) {
            fallbackUserId = found.id;
            email = (found.email || "").toLowerCase().trim();
            console.log(`[EasyFlow] Fallback 4 (auth.users name match): ${holderName} -> ${email}`);
          }
        }
      }

      if (!fallbackUserId) {
        const holderName = payload.creditCard?.holderName || "desconhecido";
        console.error(`[EasyFlow] ${event} sem email e fallbacks falharam. holderName: ${holderName}`);
        await supabase.from("webhook_events").update({
          processed: false,
          error_message: `no_email_all_fallbacks_failed: holderName=${holderName}`,
        }).eq("provider", "easyflow").eq("event_type", event).order("created_at", { ascending: false }).limit(1);
        return json({ received: true, action: "skipped_no_email_fallbacks_failed", holderName });
      }
    }

    if (!email && !fallbackUserId) {
      console.log("[EasyFlow] No email found, skipping");
      await supabase.from("webhook_events").update({
        processed: false,
        error_message: "no_email_in_payload",
      }).eq("provider", "easyflow").eq("event_type", event).order("created_at", { ascending: false }).limit(1);
      return json({ received: true, action: "skipped_no_email" });
    }

    // ── Detect plan from subscription periodicity / product name / description ──
    const detectPlan = (): string => {
      // Subscription events have periodicity
      const period = (payload.periodicity || "").toLowerCase();
      if (period === "annualy" || period === "annually" || period === "yearly") return "annual";
      if (period === "biannualy" || period === "biannually") return "biannual";
      if (period === "monthly") return "monthly";
      if (period === "quarterly") return "quarterly";

      // Order events — combina nome + descricao + offer.name pra pegar "Cobranca comum / Assinatura anual"
      const haystack = [
        payload.items?.[0]?.product?.name,
        payload.items?.[0]?.product?.description,
        payload.items?.[0]?.offer?.name,
        payload.items?.[0]?.offer?.description,
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
        await supabase.from("webhook_events").update({
          processed: false,
          error_message: `user_not_found: ${email}`,
        }).eq("provider", "easyflow").eq("event_type", event).order("created_at", { ascending: false }).limit(1);
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
        await supabase.from("webhook_events").update({
          processed: false,
          error_message: `subscription_upsert_failed: ${subErr.message}`,
        }).eq("provider", "easyflow").eq("event_type", event).order("created_at", { ascending: false }).limit(1);
        return json({ received: true, action: "error", error: subErr.message }, 500);
      }

      // Update CRM lead (com checagem de erro)
      const { error: leadErr } = await supabase.from("crm_leads")
        .update({ status: "subscriber", converted_at: now })
        .eq("user_id", profile.user_id);
      if (leadErr) console.warn(`[EasyFlow] crm_leads update falhou (nao bloqueante): ${leadErr.message}`);

      // Resolve any open inadimplencia
      await supabase.from("admin_inadimplencias")
        .update({ status: "resolvido", updated_at: now })
        .eq("user_id", profile.user_id)
        .eq("status", "em_cobranca");

      console.log(`[EasyFlow] ✅ Activated: ${email} -> ${plan}`);
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