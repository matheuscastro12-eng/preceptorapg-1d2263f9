// Edge Function: Send Custom Email
// Permite que admins do CRM enviem emails personalizados para usuarios

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const { to, subject, message, senderName } = body;

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatorios: to, subject, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build professional HTML email
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #1B5E3B; padding: 24px; text-align: center;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 22px;">PreceptorMED</h1>
        </div>
        <div style="padding: 32px 28px;">
          ${message.split("\n").map((line: string) =>
            line.trim() ? `<p style="color: #333; line-height: 1.7; margin: 0 0 12px;">${line}</p>` : `<br/>`
          ).join("")}
          ${senderName ? `<p style="color: #555; margin-top: 24px; font-size: 14px;">Atenciosamente,<br/><strong>${senderName}</strong><br/><span style="color: #888;">Equipe PreceptorMED</span></p>` : ""}
        </div>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 11px; color: #999;">
          Preceptor Group &copy; 2026 | Este email foi enviado pela equipe do PreceptorMED
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PreceptorMED <noreply@thepreceptor.com.br>",
        to,
        subject,
        html,
        tags: [{ name: "type", value: "custom_admin" }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "Erro ao enviar email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the email in crm_automations_log if supabase is available
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("webhook_events").insert({
        provider: "admin_email",
        event_type: "custom_email_sent",
        payload: { to, subject, sender: senderName, message_id: data.id },
      });
    } catch {}

    return new Response(
      JSON.stringify({ success: true, message_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
