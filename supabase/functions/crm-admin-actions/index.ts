// Edge Function: CRM Admin Actions
// Handles admin operations that need service_role_key to bypass RLS
// Actions: grant_access, revoke_access, update_plan, get_dashboard_data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRM_TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "";

// Valida HMAC-SHA256 do token gerado pela crm-auth. Sem isso, um token
// forjado com payload manualmente construido passava — so checava exp.
async function verifyCrmToken(token: string): Promise<Record<string, unknown> | null> {
  if (!token || !CRM_TOKEN_SECRET) return null;
  try {
    const [dataB64, sigB64] = token.split(".");
    if (!dataB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(CRM_TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const dataBytes = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(dataBytes));
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, token } = body;

    // Verify CRM admin token (agora com HMAC, nao so exp)
    const payload = await verifyCrmToken(token);
    if (!payload) {
      return json({ error: "Token CRM invalido ou expirado" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── GRANT ACCESS ──
    if (action === "grant_access") {
      const { user_id, plan_type, access_expires_at, granted_by } = body;
      if (!user_id) return json({ error: "user_id obrigatorio" }, 400);

      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();

      const subData = {
        status: "active",
        plan_type: plan_type || "free_access",
        granted_by: granted_by || null,
        access_expires_at: access_expires_at || null,
      };

      if (existing) {
        const { error } = await supabase.from("subscriptions").update(subData).eq("user_id", user_id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supabase.from("subscriptions").insert({ user_id, ...subData });
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true, action: "granted" });
    }

    // ── REVOKE ACCESS ──
    if (action === "revoke_access") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id obrigatorio" }, 400);

      const { error } = await supabase.from("subscriptions")
        .update({ status: "inactive", plan_type: "none", access_expires_at: null })
        .eq("user_id", user_id);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true, action: "revoked" });
    }

    // ── UPDATE PLAN ──
    if (action === "update_plan") {
      const { user_id, plan_type } = body;
      if (!user_id || !plan_type) return json({ error: "user_id e plan_type obrigatorios" }, 400);

      const status = plan_type === "none" ? "inactive" : "active";
      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();

      const subData = { status, plan_type, access_expires_at: null };
      if (existing) {
        const { error } = await supabase.from("subscriptions").update(subData).eq("user_id", user_id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supabase.from("subscriptions").insert({ user_id, ...subData });
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true, action: "plan_updated" });
    }

    // ── GET ALL SUBSCRIPTIONS (for dashboard) ──
    if (action === "get_subscriptions") {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("user_id, status, plan_type, access_expires_at, created_at, updated_at");
      if (error) return json({ error: error.message }, 500);
      return json({ subscriptions: data });
    }

    // ─────────────────────────────────────────────────────────
    // landing_banners — CMS de banners da home (pedido do MKT)
    // ─────────────────────────────────────────────────────────

    // Lista todos (inclui inativos/agendados) — visao admin
    if (action === "banner_list_all") {
      const { data, error } = await supabase
        .from("landing_banners")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ banners: data ?? [] });
    }

    // Cria banner
    if (action === "banner_create") {
      const { banner } = body as { banner: Record<string, unknown> };
      if (!banner || !banner.image_url || !banner.cta_link) {
        return json({ error: "banner.image_url e banner.cta_link sao obrigatorios" }, 400);
      }
      const { data, error } = await supabase
        .from("landing_banners")
        .insert({
          title: banner.title ?? null,
          subtitle: banner.subtitle ?? null,
          image_url: banner.image_url,
          cta_label: banner.cta_label ?? "Saiba mais",
          cta_link: banner.cta_link,
          link_target: banner.link_target ?? "same",
          ordem: banner.ordem ?? 0,
          ativo: banner.ativo ?? true,
          starts_at: banner.starts_at ?? null,
          ends_at: banner.ends_at ?? null,
          audience: banner.audience ?? "all",
          created_by: (payload as { user_id?: string }).user_id ?? null,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ banner: data });
    }

    // Atualiza banner por id
    if (action === "banner_update") {
      const { id, banner } = body as { id: string; banner: Record<string, unknown> };
      if (!id) return json({ error: "id obrigatorio" }, 400);
      const allowed = [
        "title", "subtitle", "image_url", "cta_label", "cta_link",
        "link_target", "ordem", "ativo", "starts_at", "ends_at", "audience",
      ];
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (k in (banner ?? {})) patch[k] = banner[k];
      const { data, error } = await supabase
        .from("landing_banners")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ banner: data });
    }

    // Remove banner
    if (action === "banner_delete") {
      const { id } = body as { id: string };
      if (!id) return json({ error: "id obrigatorio" }, 400);
      // Tenta apagar a imagem associada do bucket se for nosso storage
      const { data: row } = await supabase
        .from("landing_banners").select("image_url").eq("id", id).maybeSingle();
      if (row?.image_url && typeof row.image_url === "string") {
        const m = row.image_url.match(/\/landing-banners\/(.+)$/);
        if (m) await supabase.storage.from("landing-banners").remove([m[1]]);
      }
      const { error } = await supabase.from("landing_banners").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // Reordena em lote — recebe [{id, ordem}, ...]
    if (action === "banner_reorder") {
      const { items } = body as { items: Array<{ id: string; ordem: number }> };
      if (!Array.isArray(items)) return json({ error: "items deve ser array" }, 400);
      for (const it of items) {
        const { error } = await supabase
          .from("landing_banners")
          .update({ ordem: it.ordem })
          .eq("id", it.id);
        if (error) return json({ error: `falha em ${it.id}: ${error.message}` }, 500);
      }
      return json({ success: true, count: items.length });
    }

    // Gera URL assinada pra upload direto ao bucket (client faz PUT)
    if (action === "banner_get_upload_url") {
      const { filename } = body as { filename: string };
      if (!filename) return json({ error: "filename obrigatorio" }, 400);
      const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `${Date.now()}_${safe}`;
      const { data, error } = await supabase.storage
        .from("landing-banners")
        .createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);
      const { data: pub } = supabase.storage.from("landing-banners").getPublicUrl(path);
      return json({
        uploadUrl: data.signedUrl,
        token: data.token,
        path,
        publicUrl: pub.publicUrl,
      });
    }

    return json({ error: `Acao desconhecida: ${action}` }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
