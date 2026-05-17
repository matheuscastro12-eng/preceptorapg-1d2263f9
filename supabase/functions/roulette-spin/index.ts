import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Configuração da Roleta ──────────────────────────────────────
// Probabilidades somam 100. Mudanças aqui são server-side — usuário
// não consegue manipular do client.
interface PrizeConfig {
  key: "desconto_20" | "desconto_30" | "desconto_50" | "mensal_gratis";
  label: string;
  weight: number;       // probabilidade em %
  checkout_url?: string; // link EasyFlow de checkout do plano anual
}

const PRIZES: PrizeConfig[] = [
  { key: "desconto_20",    label: "20% off no plano anual", weight: 40,
    checkout_url: "https://pay.easyflow.digital/checkouts/offer/6385c0a1-b988-4ddd-9607-ee2ec15b3846" },
  { key: "desconto_30",    label: "30% off no plano anual", weight: 30,
    checkout_url: "https://pay.easyflow.digital/checkouts/offer/5d0dbbfd-d06c-4252-8a29-3c51665c77c2" },
  { key: "desconto_50",    label: "50% off no plano anual", weight: 20,
    checkout_url: "https://pay.easyflow.digital/checkouts/offer/fc67ad17-4b71-4067-b25b-52370c6de476" },
  { key: "mensal_gratis",  label: "1 mês grátis",           weight: 10 },
];

const EVENT_SLUG = "semana-itajuba";

/**
 * Decora a URL do checkout EasyFlow com email + external_id apontando
 * pra uma linha em pending_checkouts. Resolve o caso "estudante paga
 * com cartao do pai": o webhook ve o external_id no payload e identifica
 * o estudante mesmo sem email/holderName batendo.
 *
 * Se a insercao da intencao falhar, retorna a URL original sem decoracao
 * (degradacao gradativa — sem regressao do comportamento anterior).
 */
async function decorateCheckoutUrl(
  supabase: ReturnType<typeof createClient>,
  checkoutUrl: string | null,
  userId: string | null | undefined,
  email: string | null,
): Promise<string | null> {
  if (!checkoutUrl) return null;
  try {
    const url = new URL(checkoutUrl);
    if (email) url.searchParams.set("email", email);
    if (userId) {
      const offerMatch = checkoutUrl.match(/\/offer\/([a-f0-9-]{36})/i);
      const offerId = offerMatch ? offerMatch[1] : "";
      const { data, error } = await supabase
        .from("pending_checkouts")
        .insert({
          user_id: userId,
          offer_id: offerId || "unknown",
          plan_hint: "roulette",
          source: "roulette-spin",
        })
        .select("id")
        .single();
      if (!error && data?.id) {
        url.searchParams.set("external_id", data.id);
        url.searchParams.set("externalId", data.id);
        url.searchParams.set("metadata[external_id]", data.id);
        url.searchParams.set("customField1", data.id);
      } else if (error) {
        console.warn("decorateCheckoutUrl pending_checkouts insert falhou:", error.message);
      }
    }
    return url.toString();
  } catch (e) {
    console.warn("decorateCheckoutUrl error:", e);
    return checkoutUrl;
  }
}

/** Sorteia um prêmio com base nos pesos. */
function drawPrize(): PrizeConfig {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of PRIZES) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return PRIZES[0]; // fallback (não deve acontecer)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, full_name, faculdade, phone, user_id } = body;

    // ─── Validações ────────────────────────────────────────────
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Nome obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ─── Checa se já girou ─────────────────────────────────────
    const emailLower = email.trim().toLowerCase();
    const { data: existing } = await supabase
      .from("roulette_spins")
      .select("id, prize, prize_label, coupon_code, redemption_code, created_at")
      .eq("event_slug", EVENT_SLUG)
      .ilike("email", emailLower)
      .maybeSingle();

    if (existing) {
      const decoratedUrl = await decorateCheckoutUrl(
        supabase,
        existing.coupon_code,
        body.user_id,
        emailLower,
      );
      return new Response(
        JSON.stringify({
          alreadySpun: true,
          prize: existing.prize,
          prize_label: existing.prize_label,
          checkout_url: decoratedUrl,
          redemption_code: existing.redemption_code,
          spun_at: existing.created_at,
          message: "Você já participou da roleta nesse evento.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Valida user_id (pode estar pendente de confirmação) ──
    // Se o user_id passado nao existir em auth.users (ex: signup ainda
    // pendente de confirmacao por email), salvamos sem user_id pra evitar
    // FK violation. O premio ainda fica vinculado ao email.
    let validatedUserId: string | null = null;
    if (user_id && typeof user_id === "string") {
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      if (authUser?.user) {
        validatedUserId = user_id;
      } else {
        console.warn("roulette-spin: user_id passed but not found in auth.users:", user_id);
      }
    }

    // ─── Sorteia ───────────────────────────────────────────────
    const prize = drawPrize();

    // ─── Captura IP + UA ───────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || null;
    const userAgent = req.headers.get("user-agent") || null;

    // ─── Insere (UNIQUE constraint previne race condition) ─────
    // coupon_code agora guarda a URL do checkout (reaproveita a coluna pra
    // nao precisar de outra migration). Renderizacao no frontend trata.
    const { data: spin, error: insertErr } = await supabase
      .from("roulette_spins")
      .insert({
        email: emailLower,
        full_name: full_name.trim(),
        faculdade: faculdade?.trim() || null,
        phone: phone?.trim() || null,
        user_id: validatedUserId,
        event_slug: EVENT_SLUG,
        prize: prize.key,
        prize_label: prize.label,
        coupon_code: prize.checkout_url || null,
        ip,
        user_agent: userAgent,
      })
      .select("id, redemption_code")
      .single();

    if (insertErr) {
      // Provavelmente race: outro request rápido com mesmo email entrou primeiro
      if (insertErr.code === "23505") {
        const { data: existingAfterRace } = await supabase
          .from("roulette_spins")
          .select("prize, prize_label, coupon_code, redemption_code, created_at")
          .eq("event_slug", EVENT_SLUG)
          .ilike("email", emailLower)
          .maybeSingle();
        const decoratedRace = await decorateCheckoutUrl(
          supabase,
          existingAfterRace?.coupon_code ?? null,
          body.user_id,
          emailLower,
        );
        return new Response(
          JSON.stringify({
            alreadySpun: true,
            prize: existingAfterRace?.prize,
            prize_label: existingAfterRace?.prize_label,
            checkout_url: decoratedRace,
            redemption_code: existingAfterRace?.redemption_code,
            spun_at: existingAfterRace?.created_at,
            message: "Você já participou da roleta nesse evento.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("roulette-spin insert error:", insertErr);
      throw new Error("Falha ao registrar prêmio");
    }

    // NOTA: 1 mês grátis agora é ativado MANUALMENTE pelo CRM. A equipe
    // consulta roulette_spins WHERE prize='mensal_gratis' AND delivered_at
    // IS NULL e aplica o free_access via /admin/users.

    const decorated = await decorateCheckoutUrl(
      supabase,
      prize.checkout_url || null,
      validatedUserId,
      emailLower,
    );
    return new Response(
      JSON.stringify({
        alreadySpun: false,
        prize: prize.key,
        prize_label: prize.label,
        checkout_url: decorated,
        redemption_code: spin.redemption_code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("roulette-spin error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
