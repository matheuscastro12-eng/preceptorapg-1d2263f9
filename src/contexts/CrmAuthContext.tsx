import React, { createContext, useContext, useState, useEffect } from "react";
import { supabaseCrm } from "@/integrations/supabase/crm-client";

export interface CrmUser {
  id: string;
  username: string;
  nome: string;
  role: "super_admin" | "admin" | "editor" | "viewer";
  email?: string;
  acesso_marketing: boolean;
  acesso_admin: boolean;
}

interface CrmAuthContextType {
  crmUser: CrmUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  updateUsername: (newUsername: string) => Promise<{ error?: string }>;
  /** Garante que a sessão Supabase CRM está válida. Re-autentica silenciosamente se expirada. */
  ensureSupabaseSession: () => Promise<boolean>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  hasMarketingAccess: boolean;
  hasAdminAccess: boolean;
}

const CrmAuthContext = createContext<CrmAuthContextType | undefined>(undefined);
const SESSION_KEY = "crm_session";
const TOKEN_KEY = "crm_token";

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-auth`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function crmApi(body: Record<string, unknown>) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": API_KEY,
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ ...body, token }),
  });
  return res.json();
}

export function useCrmAuth() {
  const ctx = useContext(CrmAuthContext);
  if (!ctx) throw new Error("useCrmAuth must be inside CrmAuthProvider");
  return ctx;
}

/** Verifica se a sessão Supabase CRM está válida com margem de 60s. */
async function isCrmSupabaseSessionFresh(): Promise<boolean> {
  try {
    const { data } = await supabaseCrm.auth.getSession();
    const session = data?.session;
    if (!session) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return !!(session.expires_at && session.expires_at > nowSec + 60);
  } catch {
    return false;
  }
}

/** Pega credenciais do service account via crm-auth e re-autentica supabaseCrm. */
async function reAuthSupabaseCrm(): Promise<boolean> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const data = await crmApi({ action: "verify", token });
    if (data?.svc?.e && data?.svc?.p) {
      const { error } = await supabaseCrm.auth.signInWithPassword({
        email: data.svc.e,
        password: data.svc.p,
      });
      if (error) {
        console.warn("CRM service re-auth failed:", error.message);
        return false;
      }
      return true;
    }
    return false;
  } catch (e) {
    console.warn("CRM re-auth request failed:", e);
    return false;
  }
}

export function CrmAuthProvider({ children }: { children: React.ReactNode }) {
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** Exportada via context. Verifica e re-autentica se necessário. Retorna true se session está válida. */
  const ensureSupabaseSession = React.useCallback(async (): Promise<boolean> => {
    if (await isCrmSupabaseSessionFresh()) return true;
    return await reAuthSupabaseCrm();
  }, []);

  // Restore + verify session from server
  useEffect(() => {
    const restore = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { setLoading(false); return; }

        const data = await crmApi({ action: "verify", token });
        if (data.user) {
          const user: CrmUser = {
            ...data.user,
            acesso_marketing: data.user.acesso_marketing ?? false,
            acesso_admin: data.user.acesso_admin ?? false,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));

          // Ensure supabaseCrm is authenticated BEFORE setting user (which triggers children to render)
          try {
            const fresh = await isCrmSupabaseSessionFresh();
            if (!fresh && data.svc?.e && data.svc?.p) {
              const { error } = await supabaseCrm.auth.signInWithPassword({
                email: data.svc.e,
                password: data.svc.p,
              });
              if (error) console.warn("CRM service re-auth failed:", error.message);
            }
          } catch (authErr) {
            console.warn("CRM supabase auth failed (non-fatal):", authErr);
          }

          setCrmUser(user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(SESSION_KEY);
          try { await supabaseCrm.auth.signOut(); } catch {}
        }
      } catch (err) {
        console.warn("CRM session restore failed:", err);
        // Offline — use cached session as fallback
        try {
          const cached = localStorage.getItem(SESSION_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.id && parsed.username) {
              // Garante ambos os flags (sessões antigas podiam não ter
              // acesso_admin → admin caía em "Acesso Negado" offline).
              setCrmUser({
                ...parsed,
                acesso_marketing: parsed.acesso_marketing ?? false,
                acesso_admin: parsed.acesso_admin ?? false,
              } as CrmUser);
            }
          }
        } catch {}
      }
      setLoading(false);
    };
    restore();
  }, []);

  // Auto-refresh periódico da session Supabase CRM (Supabase JWT dura 1h).
  // Roda a cada 25min para sempre ter margem antes do vencimento.
  useEffect(() => {
    if (!crmUser) return;
    const interval = setInterval(() => {
      ensureSupabaseSession().catch(() => {});
    }, 25 * 60 * 1000); // 25 min
    return () => clearInterval(interval);
  }, [crmUser, ensureSupabaseSession]);

  // Revalida session quando a aba volta a ficar visível (user veio de outra aba ou despertou PC)
  useEffect(() => {
    if (!crmUser) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ensureSupabaseSession().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [crmUser, ensureSupabaseSession]);

  const login = async (username: string, password: string) => {
    try {
      // Clear old session before login attempt
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      const data = await crmApi({ action: "login", username, password });
      if (data.error) return { error: data.error };
      if (!data.user || !data.token) return { error: data.message || "Resposta invalida — verifique suas credenciais" };

      const user: CrmUser = {
        ...data.user,
        acesso_marketing: data.user.acesso_marketing ?? false,
        acesso_admin: data.user.acesso_admin ?? false,
      };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));

      // Authenticate Supabase CRM client for RLS access
      if (data.svc) {
        const { error: svcError } = await supabaseCrm.auth.signInWithPassword({ email: data.svc.e, password: data.svc.p });
        if (svcError) console.error("CRM service auth failed:", svcError.message);
      }

      setCrmUser(user);
      return {};
    } catch (err) {
      console.error("CRM login error:", err);
      return { error: "Erro ao conectar" };
    }
  };

  const logout = () => {
    setCrmUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    supabaseCrm.auth.signOut();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const data = await crmApi({ action: "change_password", current_password: currentPassword, new_password: newPassword });
      if (data.error) return { error: data.error };
      return {};
    } catch {
      return { error: "Erro ao conectar" };
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      const data = await crmApi({ action: "update_profile", username: newUsername });
      if (data.error) return { error: data.error };
      if (data.user) {
        const updated = { ...crmUser!, username: data.user.username };
        setCrmUser(updated);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }
      return {};
    } catch {
      return { error: "Erro ao conectar" };
    }
  };

  const role = crmUser?.role ?? "viewer";

  return (
    <CrmAuthContext.Provider value={{
      crmUser, loading, login, logout, changePassword, updateUsername,
      ensureSupabaseSession,
      isSuperAdmin: role === "super_admin",
      isAdmin: role === "super_admin" || role === "admin",
      isEditor: role === "super_admin" || role === "admin" || role === "editor",
      hasMarketingAccess: crmUser?.acesso_marketing ?? false,
      hasAdminAccess: crmUser?.acesso_admin ?? false,
    }}>
      {children}
    </CrmAuthContext.Provider>
  );
}
