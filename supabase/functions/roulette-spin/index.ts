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
  key: "chaveiro" | "desconto_30" | "desconto_50" | "mensal_gratis";
  label: string;
  weight: number;       // probabilidade em %
  coupon?: string;      // cupom fixo (cupons que o organizador combinou)
}

const PRIZES: PrizeConfig[] = [
  { key: "chaveiro",       label: "Chaveiro PreceptorMED", weight: 45 },
  { key: "desconto_30",    label: "30% off",                weight: 35, coupon: "ITAJUBA30" },
  { key: "desconto_50",    label: "50% off",                weight: 15, coupon: "ITAJUBA50" },
  { key: "mensal_gratis",  label: "1 mês grátis",           weight: 5  },
];

const EVENT_SLUG = "semana-itajuba";

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
      return new Response(
        JSON.stringify({
          alreadySpun: true,
          prize: existing.prize,
          prize_label: existing.prize_label,
          coupon_code: existing.coupon_code,
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
        coupon_code: prize.coupon || null,
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
        return new Response(
          JSON.stringify({
            alreadySpun: true,
            ...existingAfterRace,
            message: "Você já participou da roleta nesse evento.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("roulette-spin insert error:", insertErr);
      throw new Error("Falha ao registrar prêmio");
    }

    // ─── Mensal grátis: aplica free_access na conta ────────────
    if (prize.key === "mensal_gratis" && validatedUserId) {
      const accessExpiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
      const { error: subErr } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: validatedUserId,
          status: "active",
          plan_type: "free_access",
          access_expires_at: accessExpiresAt,
          source: "roulette_" + EVENT_SLUG,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (subErr) {
        console.warn("roulette-spin: failed to apply free_access:", subErr);
      } else {
        // Marca delivered_at imediatamente — entrega automática
        await supabase
          .from("roulette_spins")
          .update({ delivered_at: new Date().toISOString() })
          .eq("id", spin.id);
      }
    }

    return new Response(
      JSON.stringify({
        alreadySpun: false,
        prize: prize.key,
        prize_label: prize.label,
        coupon_code: prize.coupon || null,
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
