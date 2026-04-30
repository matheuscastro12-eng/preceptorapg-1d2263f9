import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Gate granular pra features que precisam de mais que `hasAccess` binario.
 *
 * - `core` → mantem comportamento `hasAccess` (qualquer assinatura ativa
 *   ou free_access). Equivale ao gate atual de Dashboard, Exam, etc.
 *
 * - `whitebook` → liberado pra qualquer user com `hasAccess`. Whitebook
 *   entra "incluído" nos planos atuais como diferencial competitivo.
 *
 * - `scribe` → exige `hasAccess` + linha em scribe_beta_invites pro
 *   user_id. Beta fechado controlado manualmente (admin INSERT).
 *
 * Admin (user_roles.role='admin') desbloqueia tudo automaticamente.
 *
 * Reason values:
 * - 'admin' → admin override
 * - 'ok' → user tem acesso normal
 * - 'no_subscription' → usuario sem hasAccess
 * - 'no_invite' → tem hasAccess mas falta convite (so pra scribe)
 * - 'loading' → ainda carregando dados
 */
export type FeatureName = "core" | "whitebook" | "scribe";

export type AccessReason =
  | "admin"
  | "ok"
  | "no_subscription"
  | "no_invite"
  | "loading";

export interface FeatureAccess {
  hasFeature: boolean;
  reason: AccessReason;
  loading: boolean;
}

export function useFeatureAccess(feature: FeatureName): FeatureAccess {
  const { user } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Estado especifico de scribe — checa convite no beta
  const [scribeInvited, setScribeInvited] = useState<boolean | null>(null);

  useEffect(() => {
    // So precisamos da query se a feature pedida eh scribe E o user esta logado
    if (feature !== "scribe" || !user) {
      setScribeInvited(null);
      return;
    }
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("scribe_beta_invites")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (alive) setScribeInvited(!!data);
    })();
    return () => {
      alive = false;
    };
  }, [feature, user]);

  // Loading agregado
  const baseLoading = subLoading || adminLoading;
  const scribeLoading =
    feature === "scribe" && !!user && scribeInvited === null;
  const loading = baseLoading || scribeLoading;

  // Admin desbloqueia tudo (sem aguardar o resto)
  if (isAdmin) {
    return { hasFeature: true, reason: "admin", loading: false };
  }

  if (loading) {
    return { hasFeature: false, reason: "loading", loading: true };
  }

  if (feature === "core") {
    return hasAccess
      ? { hasFeature: true, reason: "ok", loading: false }
      : { hasFeature: false, reason: "no_subscription", loading: false };
  }

  if (feature === "whitebook") {
    return hasAccess
      ? { hasFeature: true, reason: "ok", loading: false }
      : { hasFeature: false, reason: "no_subscription", loading: false };
  }

  if (feature === "scribe") {
    if (!hasAccess) {
      return { hasFeature: false, reason: "no_subscription", loading: false };
    }
    if (!scribeInvited) {
      return { hasFeature: false, reason: "no_invite", loading: false };
    }
    return { hasFeature: true, reason: "ok", loading: false };
  }

  // Fallback (defensivo, nunca cai aqui se TS bater)
  return { hasFeature: false, reason: "no_subscription", loading: false };
}
