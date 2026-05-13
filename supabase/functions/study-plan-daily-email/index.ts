// Cron diário (7h BRT): envia email "Hoje você tem N atividades" para
// todos os planos ativos com pelo menos 1 atividade não concluída no dia.
// Também roda fn_streak_daily_check() pra zerar/perdoar streaks.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://thepreceptor.com.br";

interface Activity {
  tipo: string;
  tema: string;
  descricao: string;
  estimativa_min: number;
  concluida: boolean;
}

const TIPO_EMOJI: Record<string, string> = {
  fechamento: "📝",
  flashcards: "🧠",
  questoes: "✨",
  revisao_flash: "🔁",
  leitura: "📖",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const svc = createClient(SUPA_URL, SERVICE_KEY);

    // 1. Roda manutenção de streaks (zera/perdoa/recarrega freezes/marca completed)
    const { error: cronErr } = await svc.rpc("fn_streak_daily_check");
    if (cronErr) console.warn("[study-plan-daily] streak check falhou:", cronErr.message);

    // 2. Pega todos os dias de HOJE de planos ativos com atividades pendentes
    const todayISO = new Date().toISOString().slice(0, 10);

    const { data: dias, error: diasErr } = await svc
      .from("study_plan_days")
      .select(`
        id, plan_id, user_id, data, topico_principal, fase, atividades, concluido_pct,
        study_plans!inner(prova_nome, prova_data, streak_dias, freezes_disponiveis, status)
      `)
      .eq("data", todayISO)
      .lt("concluido_pct", 100)
      .eq("study_plans.status", "active");

    if (diasErr) {
      console.error("[study-plan-daily] fetch dias:", diasErr);
      return jsonErr(500, diasErr.message);
    }

    if (!dias || dias.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, msg: "Nenhum dia pendente hoje" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 3. Pega emails dos users
    const userIds = [...new Set(dias.map((d) => d.user_id))];
    const { data: profiles } = await svc
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    let sent = 0;
    let failed = 0;

    for (const dia of dias) {
      const profile = profileMap.get(dia.user_id);
      if (!profile?.email) continue;

      const plano = dia.study_plans as unknown as { prova_nome: string; prova_data: string; streak_dias: number; freezes_disponiveis: number };
      const ativs: Activity[] = (dia.atividades ?? []) as Activity[];
      const pendentes = ativs.filter((a) => !a.concluida);
      if (pendentes.length === 0) continue;

      const totalMin = pendentes.reduce((s, a) => s + (a.estimativa_min ?? 0), 0);
      const diasFalt = Math.max(0, Math.round(
        (new Date(plano.prova_data).getTime() - new Date(todayISO).getTime()) / (1000 * 60 * 60 * 24)
      ));

      const html = renderEmail({
        nome: profile.full_name || profile.email.split("@")[0],
        prova: plano.prova_nome,
        topicoPrincipal: dia.topico_principal ?? "",
        atividades: pendentes,
        totalMin,
        streak: plano.streak_dias,
        freezes: plano.freezes_disponiveis,
        diasFalt,
        appUrl: APP_URL,
        diaData: todayISO,
      });

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PreceptorMED <noreply@thepreceptor.com.br>",
            to: [profile.email],
            subject: `${TIPO_EMOJI[pendentes[0].tipo] ?? "📚"} Hoje no seu plano: ${dia.topico_principal ?? plano.prova_nome}`,
            html,
          }),
        });
        if (r.ok) sent++;
        else {
          failed++;
          console.warn(`[study-plan-daily] resend falhou pra ${profile.email}:`, await r.text());
        }
      } catch (e) {
        failed++;
        console.error(`[study-plan-daily] erro envio pra ${profile.email}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: dias.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[study-plan-daily] fatal:", e);
    return jsonErr(500, String((e as Error).message ?? e));
  }
});

function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function renderEmail(p: {
  nome: string;
  prova: string;
  topicoPrincipal: string;
  atividades: Activity[];
  totalMin: number;
  streak: number;
  freezes: number;
  diasFalt: number;
  appUrl: string;
  diaData: string;
}): string {
  const dayLink = `${p.appUrl}/cronograma/dia/${p.diaData}`;
  const ativsList = p.atividades
    .map((a) => `
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #eef2f0;">
          <div style="font-size:11px;font-weight:700;color:#8a6f26;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">
            ${TIPO_EMOJI[a.tipo] ?? "📚"} ${TIPO_LABEL[a.tipo] ?? a.tipo} · ${a.estimativa_min} min
          </div>
          <div style="font-size:16px;font-weight:700;color:#191c1d;line-height:1.3;margin-bottom:4px">${escape(a.tema)}</div>
          <div style="font-size:13px;color:#4a5568;line-height:1.5">${escape(a.descricao)}</div>
        </td>
      </tr>
    `)
    .join("");

  const streakBlock = p.streak > 0
    ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#fff3e0;color:#c2410c;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700">🔥 ${p.streak} ${p.streak === 1 ? "dia seguido" : "dias seguidos"}</span>`
    : "";

  const urgencia = p.diasFalt <= 3
    ? `<div style="background:#fff5e6;border-left:3px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:6px"><strong style="color:#c2410c">⏰ Reta final: prova em ${p.diasFalt} ${p.diasFalt === 1 ? "dia" : "dias"}</strong></div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Seu plano de hoje</title></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#191c1d">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#003D32 0%,#005344 50%,#006D5B 100%);padding:32px 24px;text-align:center">
    <h1 style="color:#C9A84C;margin:0;font-size:13px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase">PreceptorMED</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Seu cronograma de hoje</p>
  </div>

  <div style="padding:32px 28px">
    <p style="margin:0 0 6px;font-size:14px;color:#4a5568">Bom dia, <strong>${escape(p.nome)}</strong> 👋</p>
    <h2 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:#191c1d">${escape(p.topicoPrincipal || p.prova)}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4a5568">
      ${p.atividades.length} ${p.atividades.length === 1 ? "atividade" : "atividades"} · ~${p.totalMin} min · prova em ${p.diasFalt} ${p.diasFalt === 1 ? "dia" : "dias"}
    </p>
    <div style="margin-bottom:24px">${streakBlock}</div>

    ${urgencia}

    <div style="border:1px solid #e6ebe9;border-radius:12px;overflow:hidden;margin-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${ativsList}</table>
    </div>

    <div style="text-align:center">
      <a href="${dayLink}" style="display:inline-block;background:linear-gradient(135deg,#003D32 0%,#005344 50%,#006D5B 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px">Começar agora →</a>
    </div>

    <p style="margin:32px 0 0;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6">
      Você está recebendo isso porque criou um plano de estudo no PreceptorMED.<br>
      ${p.freezes > 0 ? `Tem ${p.freezes} freeze${p.freezes > 1 ? "s" : ""} no banco — perdoa 1 dia se você pular.` : "Mantenha o ritmo pra não perder o streak!"}
    </p>
  </div>

  <div style="background:#f5f7f6;padding:18px;text-align:center;font-size:11px;color:#94a3b8">
    PreceptorMED · Plataforma de estudo médico com IA · <a href="${p.appUrl}/profile" style="color:#005344;text-decoration:none">desativar emails</a>
  </div>
</div>
</body></html>`;
}

const TIPO_LABEL: Record<string, string> = {
  fechamento: "Fechamento de PBL",
  flashcards: "Criar flashcards",
  questoes: "Simulado ENAMED",
  revisao_flash: "Revisar flashcards",
  leitura: "Leitura dirigida",
};

function escape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
