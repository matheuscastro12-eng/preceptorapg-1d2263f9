// ============================================================
// Atribuição first-touch
// ============================================================
// Captura a 1ª origem do visitante (UTM da URL ou referrer) e guarda no
// localStorage. No cadastro, grava no profile (first_utm_*). Antes disso,
// todo signup aparecia como "Direto" — quebrando a medição de ROI de mídia.
//
// Regra: a 1ª origem COM campanha (utm_source) é preservada. Se o 1º toque
// foi direto/orgânico e depois vem um clique com utm, fazemos o "upgrade"
// para esse primeiro toque de campanha (melhor sinal pra atribuir mídia).

import { supabase } from "@/integrations/supabase/client";
import { normalizeUtmSource } from "@/lib/utm";

const KEY = "pmed_first_touch";

export interface FirstTouch {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  ts: string;
}

function save(v: FirstTouch) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage off */ }
}

export function getFirstTouch(): FirstTouch | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as FirstTouch : null; }
  catch { return null; }
}

function deriveFromReferrer(ref: string): { source: string | null; medium: string } {
  if (!ref) return { source: "direct", medium: "none" };
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes("thepreceptor")) return { source: "direct", medium: "none" }; // navegação interna
    return { source: normalizeUtmSource(host) ?? host, medium: "referral" };
  } catch { return { source: "direct", medium: "none" }; }
}

/**
 * Captura/atualiza o first-touch. Chame no carregamento da app (main.tsx).
 * Idempotente: uma vez gravada uma origem de campanha, não sobrescreve.
 */
export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const urlSrc = normalizeUtmSource(p.get("utm_source"));
    const fromRef = deriveFromReferrer(document.referrer || "");

    const cur: FirstTouch = {
      utm_source: urlSrc ?? fromRef.source,
      utm_medium: (p.get("utm_medium")?.toLowerCase().trim()) || (urlSrc ? null : fromRef.medium),
      utm_campaign: p.get("utm_campaign")?.trim() || null,
      landing_page: window.location.pathname + window.location.search,
      ts: new Date().toISOString(),
    };

    const prev = getFirstTouch();
    const isCampaign = (m: string | null | undefined) =>
      !!m && m !== "none" && m !== "referral";
    const prevHasCampaign = !!(prev && prev.utm_source && isCampaign(prev.utm_medium));
    const curHasCampaign = !!urlSrc;

    if (!prev) { save(cur); return; }                      // 1º toque
    if (!prevHasCampaign && curHasCampaign) { save(cur); }  // upgrade direto/orgânico → campanha
    // senão: preserva o 1º toque de campanha
  } catch { /* noop */ }
}

/**
 * Grava o first-touch no profile do usuário recém-cadastrado (best-effort,
 * não bloqueia o fluxo de signup). Usado no AuthContext.signUp.
 */
export async function applyFirstTouchToProfile(userId: string): Promise<void> {
  try {
    const ft = getFirstTouch();
    if (!ft || !userId) return;
    await supabase.from("profiles").update({
      first_utm_source: ft.utm_source,
      first_utm_medium: ft.utm_medium,
      first_utm_campaign: ft.utm_campaign,
      first_landing_page: ft.landing_page,
      first_touch_at: ft.ts,
    }).eq("user_id", userId);
  } catch { /* não bloqueia o cadastro */ }
}
