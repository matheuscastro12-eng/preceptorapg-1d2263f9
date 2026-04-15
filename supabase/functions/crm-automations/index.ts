// Edge Function: Automation Engine
// Processa fila de automações pendentes — email, push, WhatsApp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Templates de automação (em produção, vem do banco ou Resend)
const AUTOMATION_TEMPLATES: Record<string, { subject: string; preview: string }> = {
  boas_vindas: {
    subject: "Bem-vindo ao PreceptorMED! Veja como começar 🩺",
    preview: "Sua jornada para a residência começa agora",
  },
  ativacao_d1: {
    subject: "Você já respondeu sua primeira questão? ⚡",
    preview: "1 questão por dia já faz diferença. Veja como",
  },
  engajamento_d3: {
    subject: "3 recursos que poucos estudantes conhecem no PreceptorMED",
    preview: "Você está usando apenas 20% da plataforma",
  },
  social_proof_d5: {
    subject: "Como João passou em Clínica Médica com 92% usando o Preceptor",
    preview: "Depoimento real de quem passou na residência",
  },
  oferta_d6: {
    subject: "Oferta especial: 20% OFF só para você — expira amanhã",
    preview: "Você tem 24h para garantir seu desconto",
  },
  ultimo_dia_d7: {
    subject: "Último dia do seu trial — não perca o acesso 🚨",
    preview: "Seu trial expira hoje. Continue de onde parou",
  },
  win_back_d14: {
    subject: "Saudades? Temos novidades esperando por você",
    preview: "Voltamos com atualizações e um presente especial",
  },
  health_alert: {
    subject: "Seu progresso está em risco — vamos recuperar juntos?",
    preview: "Detectamos uma queda no seu ritmo de estudos",
  },
  churn_prevention: {
    subject: "Ei, sentimos sua falta 😟 — temos algo para você",
    preview: "Uma oferta especial para te manter no caminho",
  },
  referral_nudge: {
    subject: "Indique um amigo e ganhe 1 mês grátis 🎁",
    preview: "Seu link exclusivo de indicação está esperando",
  },
  upsell_cross: {
    subject: "Você sabia que tem o PreceptorENEM? Perfeito para quem está na faculdade",
    preview: "Expanda seus estudos para além da residência",
  },
  reativacao: {
    subject: "Volta! 50% OFF no plano anual — so este mes",
    preview: "Ultima chance antes do proximo ENAMED",
  },
  inadimplencia_d1: {
    subject: "Ops! Seu pagamento nao foi processado",
    preview: "Regularize para continuar seus estudos sem interrupcao",
  },
  inadimplencia_d5: {
    subject: "Aviso importante: seu acesso sera suspenso em 48h",
    preview: "Atualize seus dados de pagamento para evitar a suspensao",
  },
  inadimplencia_d10: {
    subject: "Ultima chance: 20% OFF para regularizar sua assinatura",
    preview: "Oferta exclusiva por tempo limitado para manter seu acesso",
  },
};

interface BrandSettings {
  logo_url?: string;
  logo_text?: string;
  header_bg?: string;
  header_text_color?: string;
  footer_text?: string;
}

function buildEmailHtml(
  template: string,
  tmpl: { subject: string; preview: string; body_html?: string },
  metadata: Record<string, unknown>,
  brand?: BrandSettings
): string {
  const nome = (metadata.nome as string) || "estudante";
  const b = brand ?? {};
  const headerInner = b.logo_url
    ? `<img src="${b.logo_url}" alt="${b.logo_text ?? ''}" style="max-height:48px;max-width:240px;display:block;margin:0 auto" />`
    : `<h1 style="color:${b.header_text_color ?? '#C9A84C'};margin:0;font-size:22px">${b.logo_text ?? 'PreceptorMED'}</h1>`;

  const wrap = (body: string) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: ${b.header_bg ?? '#1B5E3B'}; padding: 24px; text-align: center;">
        ${headerInner}
      </div>
      <div style="padding: 32px 28px;">${body}</div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 11px; color: #999;">
        ${b.footer_text ?? 'Preceptor Group &copy; 2026 | Voce recebeu este email por ser assinante do PreceptorMED'}
      </div>
    </div>
  `;

  // Se vem do banco (editado pelo time), usa o body_html substituindo variaveis
  if (tmpl.body_html) {
    const body = tmpl.body_html.replace(/\{\{nome\}\}/g, nome);
    return wrap(body);
  }

  // Inadimplencia templates
  if (template === "inadimplencia_d1") {
    return wrap(`
      <p style="font-size: 16px; color: #333;">Ola, <strong>${nome}</strong>!</p>
      <p style="color: #555; line-height: 1.6;">Identificamos que seu ultimo pagamento <strong>nao foi processado</strong>. Isso pode acontecer por cartao expirado, limite insuficiente ou dados desatualizados.</p>
      <p style="color: #555; line-height: 1.6;">Para continuar seus estudos sem interrupcao, atualize seus dados de pagamento:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://thepreceptor.com.br/subscription" style="background: #1B5E3B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Atualizar pagamento</a>
      </div>
      <p style="color: #888; font-size: 13px;">Se o pagamento ja foi regularizado, desconsidere este email.</p>
    `);
  }

  if (template === "inadimplencia_d5") {
    return wrap(`
      <p style="font-size: 16px; color: #333;">Ola, <strong>${nome}</strong>,</p>
      <p style="color: #555; line-height: 1.6;">Seu pagamento continua pendente ha <strong>5 dias</strong>. Se nao for regularizado nas proximas <strong>48 horas</strong>, seu acesso ao PreceptorMED sera <span style="color: #dc2626; font-weight: bold;">suspenso temporariamente</span>.</p>
      <p style="color: #555; line-height: 1.6;">Nao queremos que voce perca seu progresso! Atualize agora:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://thepreceptor.com.br/subscription" style="background: #dc2626; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Regularizar agora</a>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #991b1b; font-size: 13px; margin: 0;"><strong>O que acontece se nao regularizar:</strong></p>
        <ul style="color: #991b1b; font-size: 13px; margin: 8px 0 0; padding-left: 20px;">
          <li>Acesso suspenso temporariamente</li>
          <li>Historico e progresso preservados por 30 dias</li>
        </ul>
      </div>
    `);
  }

  if (template === "inadimplencia_d10") {
    return wrap(`
      <p style="font-size: 16px; color: #333;">Ola, <strong>${nome}</strong>,</p>
      <p style="color: #555; line-height: 1.6;">Esta e nossa <strong>ultima tentativa</strong> de manter sua assinatura ativa. Seu pagamento esta pendente ha <strong>10 dias</strong>.</p>
      <p style="color: #555; line-height: 1.6;">Preparamos uma <strong>oferta exclusiva</strong> para te ajudar a regularizar:</p>
      <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #16a34a; font-size: 28px; font-weight: bold; margin: 0;">20% OFF</p>
        <p style="color: #555; font-size: 14px; margin: 8px 0 0;">na renovacao da sua assinatura</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://thepreceptor.com.br/subscription" style="background: #1B5E3B; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Regularizar com 20% OFF</a>
      </div>
      <p style="color: #dc2626; font-size: 13px; text-align: center;"><strong>Atencao:</strong> Apos 15 dias, sua assinatura sera cancelada automaticamente.</p>
    `);
  }

  // Default template for other automations
  return wrap(`
    <p style="font-size: 16px; color: #333;">Ola, <strong>${nome}</strong>!</p>
    <p style="color: #555; line-height: 1.6;">${tmpl.preview}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://thepreceptor.com.br" style="background: #1B5E3B; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar PreceptorMED</a>
    </div>
  `);
}

async function sendEmail(
  to: string,
  template: string,
  metadata: Record<string, unknown>,
  resendApiKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  // Primeiro tenta ler do banco (templates editaveis pelo time de mkt)
  const { data: dbTpl } = await supabase
    .from("crm_email_templates")
    .select("subject, preview, body_html")
    .eq("trigger_name", template)
    .maybeSingle();

  const tmpl = dbTpl ?? AUTOMATION_TEMPLATES[template];
  if (!tmpl) return { success: false, error: "Template nao encontrado" };

  // Carrega config de branding (header + footer)
  const { data: brand } = await supabase
    .from("crm_email_settings")
    .select("logo_url, logo_text, header_bg, header_text_color, footer_text")
    .limit(1)
    .maybeSingle();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PreceptorMED <noreply@thepreceptor.com.br>",
        to,
        subject: tmpl.subject,
        html: buildEmailHtml(template, tmpl, metadata, brand ?? undefined),
        tags: [{ name: "trigger", value: template }],
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message };
    return { success: true, message_id: data.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const body = await req.json().catch(() => ({}));
    const specificTrigger: string | undefined = body.trigger;
    const automationId: string | undefined = body.automation_id;
    const action: string | undefined = body.action;
    const flushAuto = action === "flush_auto";

    // Envio ad-hoc: admin escolhe template + user e envia sem precisar de row pendente
    if (action === "send_adhoc") {
      const { template, user_email, nome } = body;
      if (!template || !user_email) {
        return json({ error: "template e user_email sao obrigatorios" }, 400);
      }

      const emailNorm = user_email.toLowerCase().trim();

      // Busca profile antes pra pegar full_name se nome nao foi passado
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .ilike("email", emailNorm)
        .maybeSingle();

      // Fallback de nome: form > profile.full_name > primeira parte do email
      const nomeFinal = (nome && nome.trim()) || profile?.full_name || emailNorm.split("@")[0];

      const send = await sendEmail(
        emailNorm,
        template,
        { nome: nomeFinal },
        RESEND_API_KEY,
        supabase,
      );
      if (!send.success) return json({ error: send.error, success: false }, 500);

      await supabase.from("crm_automations_log").insert({
        user_id: profile?.user_id ?? null,
        automation_type: "email",
        trigger_name: template,
        trigger_reason: `Envio manual ad-hoc pra ${emailNorm}`,
        channel: "email",
        status: "delivered",
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        metadata: { email: emailNorm, nome: nomeFinal, message_id: send.message_id, ad_hoc: true },
        produto: "preceptormed",
      });

      return json({ success: true, message_id: send.message_id, nome_used: nomeFinal });
    }

    // Envio manual: admin aperta "Enviar" em uma linha especifica.
    // flush_auto: processa todos os pendentes cujo template esta marcado auto_send=true
    if (!automationId && !specificTrigger && !flushAuto) {
      return json({
        success: false,
        error: "Envie automation_id (linha especifica), trigger (batch por tipo), ou action=flush_auto (processar todos auto_send=true).",
      }, 400);
    }

    // Pra flush_auto: busca os nomes de triggers que tem auto_send=true
    let autoSendTriggers: string[] = [];
    if (flushAuto) {
      const { data: autoTpls } = await supabase
        .from("crm_email_templates")
        .select("trigger_name")
        .eq("auto_send", true);
      autoSendTriggers = (autoTpls ?? []).map((t: any) => t.trigger_name);
      if (autoSendTriggers.length === 0) {
        return json({ success: true, total_pending: 0, sent: 0, failed: 0, skipped: 0, message: "Nenhum template marcado como auto_send" });
      }
    }

    let query = supabase
      .from("crm_automations_log")
      .select(`
        id, user_id, lead_id, automation_type, trigger_name,
        trigger_reason, channel, status, metadata, produto,
        crm_leads!lead_id ( email, nome )
      `)
      .eq("status", "pending")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(200);

    if (automationId) {
      query = query.eq("id", automationId);
    } else if (specificTrigger) {
      query = query.eq("trigger_name", specificTrigger);
    } else if (flushAuto) {
      query = query.in("trigger_name", autoSendTriggers);
    }

    const { data: pending, error: pendingError } = await query;
    if (pendingError) throw pendingError;

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const automation of pending ?? []) {
      const leadData = Array.isArray(automation.crm_leads)
        ? automation.crm_leads[0]
        : automation.crm_leads;

      // Email from lead or from metadata (for inadimplencia where lead may not exist)
      const meta = (automation.metadata ?? {}) as Record<string, unknown>;
      const email = leadData?.email || (meta.email as string);
      if (!email) {
        results.skipped++;
        continue;
      }

      // Enviar por canal
      if (automation.channel === "email") {
        // Marcar como 'sent' antes de chamar Resend (evita duplicados se der timeout)
        await supabase
          .from("crm_automations_log")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", automation.id);
        const sendResult = await sendEmail(
          email,
          automation.trigger_name,
          {
            ...(automation.metadata as Record<string, unknown>),
            nome: leadData?.nome,
            trigger_reason: automation.trigger_reason,
          },
          RESEND_API_KEY,
          supabase
        );

        if (sendResult.success) {
          await supabase
            .from("crm_automations_log")
            .update({
              status: "delivered",
              delivered_at: new Date().toISOString(),
              metadata: {
                ...(automation.metadata as Record<string, unknown>),
                message_id: sendResult.message_id,
              },
            })
            .eq("id", automation.id);
          results.sent++;
        } else {
          await supabase
            .from("crm_automations_log")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              error_message: sendResult.error,
            })
            .eq("id", automation.id);
          results.failed++;
        }
      }
      // TODO: implementar push e WhatsApp. Por enquanto nao mandam nada —
      // marcamos como FAILED (nao skipped) pra admin nao achar que enviou.
      else if (automation.channel === "push") {
        console.warn(`[crm-automations] Push nao implementado. Automacao ${automation.id} marcada como failed.`);
        await supabase.from("crm_automations_log").update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message: "Canal push nao implementado",
        }).eq("id", automation.id);
        results.failed++;
      } else if (automation.channel === "whatsapp") {
        console.warn(`[crm-automations] WhatsApp nao implementado. Automacao ${automation.id} marcada como failed.`);
        await supabase.from("crm_automations_log").update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message: "Canal WhatsApp nao implementado",
        }).eq("id", automation.id);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_pending: (pending ?? []).length,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
