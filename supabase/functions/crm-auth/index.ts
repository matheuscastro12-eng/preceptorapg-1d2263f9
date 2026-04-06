import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-crm-token",
};

// HMAC-based token signing (no hardcoded credentials on the client)
async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const data = JSON.stringify(payload);
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = base64Encode(new Uint8Array(sig));
  const dataB64 = base64Encode(new TextEncoder().encode(data));
  return `${dataB64}.${sigB64}`;
}

async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [dataB64, sigB64] = token.split(".");
    if (!dataB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );

    // Decode base64
    const dataBytes = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(dataBytes));

    // Check expiration (24h)
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "fallback-insecure";

  try {
    const body = await req.json();
    const { action } = body;

    // ── LOGIN ────────────────────────────────────────────
    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) return json({ error: "Username e senha obrigatorios" }, 400);

      const { data, error } = await supabase.rpc("verify_crm_login", {
        p_username: username,
        p_password: password,
      });

      if (error) return json({ error: error.message }, 500);
      if (!data || data.length === 0) return json({ error: "Usuario ou senha incorretos" }, 401);

      const user = data[0];

      await supabase.from("admin_crm_users").update({ ultimo_login: new Date().toISOString() }).eq("id", user.id);

      // Generate signed token (24h expiration)
      const tokenPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        acesso_marketing: user.acesso_marketing,
        acesso_admin: user.acesso_admin,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      };
      const token = await signToken(tokenPayload, TOKEN_SECRET);

      // Return service auth credentials for Supabase RLS access (only after successful auth)
      const svcEmail = Deno.env.get("CRM_SERVICE_EMAIL") ?? "";
      const svcPassword = Deno.env.get("CRM_SERVICE_PASSWORD") ?? "";

      return json({
        success: true,
        user: {
          id: user.id, username: user.username, nome: user.nome, role: user.role,
          email: user.email, acesso_marketing: user.acesso_marketing, acesso_admin: user.acesso_admin,
        },
        token,
        svc: svcEmail && svcPassword ? { e: svcEmail, p: svcPassword } : undefined,
      });
    }

    // ── VERIFY TOKEN ─────────────────────────────────────
    if (action === "verify") {
      const { token } = body;
      if (!token) return json({ error: "Token obrigatorio" }, 400);

      const payload = await verifyToken(token, TOKEN_SECRET);
      if (!payload) return json({ error: "Token invalido ou expirado" }, 401);

      // Fetch fresh user data
      const { data: user } = await supabase
        .from("admin_crm_users")
        .select("id, username, nome, role, email, acesso_marketing, acesso_admin, ativo")
        .eq("id", payload.sub)
        .single();

      if (!user || !user.ativo) return json({ error: "Conta desativada" }, 401);

      const svcEmail = Deno.env.get("CRM_SERVICE_EMAIL") ?? "";
      const svcPassword = Deno.env.get("CRM_SERVICE_PASSWORD") ?? "";

      return json({
        success: true,
        user,
        svc: svcEmail && svcPassword ? { e: svcEmail, p: svcPassword } : undefined,
      });
    }

    // ── LIST USERS (requires valid CRM token) ──
    if (action === "list_users") {
      const { token } = body;
      if (!token) return json({ error: "Token obrigatorio" }, 400);
      const payload = await verifyToken(token, TOKEN_SECRET);
      if (!payload) return json({ error: "Token invalido" }, 401);

      const { data: profiles } = await supabase.from("profiles").select("user_id, email, created_at, full_name, phone");
      const { data: subscriptions } = await supabase.from("subscriptions").select("user_id, status, plan_type, access_expires_at");
      return json({ profiles: profiles ?? [], subscriptions: subscriptions ?? [] });
    }

    // ── CHANGE PASSWORD (requires valid token + current password) ──
    if (action === "change_password") {
      const { token, current_password, new_password } = body;
      if (!token || !current_password || !new_password) return json({ error: "Campos obrigatorios" }, 400);

      const payload = await verifyToken(token, TOKEN_SECRET);
      if (!payload) return json({ error: "Token invalido" }, 401);

      // Verify current password
      const { data: userData } = await supabase
        .from("admin_crm_users").select("username").eq("id", payload.sub).single();
      if (!userData) return json({ error: "Usuario nao encontrado" }, 404);

      const { data: verify } = await supabase.rpc("verify_crm_login", {
        p_username: userData.username, p_password: current_password,
      });
      if (!verify || verify.length === 0) return json({ error: "Senha atual incorreta" }, 401);

      const { error: updateErr } = await supabase.rpc("update_crm_password", {
        p_user_id: payload.sub as string, p_new_password: new_password,
      });
      if (updateErr) return json({ error: updateErr.message }, 500);

      return json({ success: true });
    }

    // ── UPDATE PROFILE (requires valid token, only own profile) ──
    if (action === "update_profile") {
      const { token, username: newUsername } = body;
      if (!token) return json({ error: "Token obrigatorio" }, 400);

      const payload = await verifyToken(token, TOKEN_SECRET);
      if (!payload) return json({ error: "Token invalido" }, 401);

      const updates: Record<string, string> = {};
      if (newUsername) updates.username = newUsername.toLowerCase().trim();

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase.from("admin_crm_users").update(updates).eq("id", payload.sub);
        if (upErr) return json({ error: upErr.message }, 500);
      }

      const { data: updated } = await supabase
        .from("admin_crm_users")
        .select("id, username, nome, role, email, acesso_marketing, acesso_admin")
        .eq("id", payload.sub).single();

      return json({ success: true, user: updated });
    }

    return json({ error: "Acao invalida" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
