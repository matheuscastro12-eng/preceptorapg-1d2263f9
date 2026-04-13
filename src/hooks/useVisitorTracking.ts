import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeUtmSource } from "@/lib/utm";

const VISITOR_KEY = "preceptor_visitor_id";
const UTM_KEY = "preceptor_utm";
const TRACKED_KEY = "preceptor_tracked";

interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
}

/** Extrai e salva UTM params da URL atual */
export function captureUtmParams(): UtmParams {
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {
    utm_source: normalizeUtmSource(params.get("utm_source")),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    landing_page: window.location.pathname,
    referrer: document.referrer || null,
  };

  // Se veio com UTM, salva. Se nao, tenta inferir source do referrer
  if (!utm.utm_source && utm.referrer) {
    try {
      const ref = new URL(utm.referrer);
      // normalizeUtmSource ja mapeia hostnames conhecidos (l.facebook.com,
      // youtu.be, etc) para o canal canonico
      utm.utm_source = normalizeUtmSource(ref.hostname);
      if (!utm.utm_medium) utm.utm_medium = "referral";
    } catch {}
  }

  // Salvar no sessionStorage para uso no signup
  if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }

  return utm;
}

/** Recupera UTM params salvos */
export function getSavedUtm(): UtmParams | null {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Gera ou recupera visitor ID persistente */
function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

/** Verifica se ja trackeiou essa sessao */
function alreadyTracked(): boolean {
  return sessionStorage.getItem(TRACKED_KEY) === "1";
}

function markTracked() {
  sessionStorage.setItem(TRACKED_KEY, "1");
}

/**
 * Hook para tracking de visitantes na Landing page.
 * Cria um crm_lead com status "visitor" se ainda nao existe.
 * Deduplica por visitor_id (localStorage) e sessao.
 */
export function useVisitorTracking() {
  useEffect(() => {
    if (alreadyTracked()) return;

    const track = async () => {
      try {
        const visitorId = getVisitorId();
        const utm = captureUtmParams();

        // Verificar se ja existe lead para esse visitor
        const { data: existing } = await supabase
          .from("crm_leads")
          .select("id")
          .eq("referral_code", `visitor_${visitorId}`)
          .maybeSingle();

        if (existing) {
          // Atualizar total_sessions
          await supabase
            .from("crm_leads")
            .update({
              total_sessions: (existing as any).total_sessions ? (existing as any).total_sessions + 1 : 1,
              last_activity_at: new Date().toISOString(),
              ...(utm.utm_source && { utm_source: utm.utm_source }),
              ...(utm.utm_medium && { utm_medium: utm.utm_medium }),
              ...(utm.utm_campaign && { utm_campaign: utm.utm_campaign }),
            })
            .eq("id", existing.id);
        } else {
          // Criar novo visitor lead
          await supabase.from("crm_leads").insert({
            email: `visitor_${visitorId}@anonymous`,
            status: "visitor",
            produto_interesse: "preceptormed",
            referral_code: `visitor_${visitorId}`,
            landing_page: utm.landing_page,
            utm_source: utm.utm_source || "direct",
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign,
            utm_content: utm.utm_content,
            utm_term: utm.utm_term,
            total_sessions: 1,
            last_activity_at: new Date().toISOString(),
          });
        }

        markTracked();
      } catch (e) {
        // Silently fail — tracking should never break the app
        console.debug("[CRM Tracking]", e);
      }
    };

    track();
  }, []);
}

/**
 * Converte um visitor anonimo em lead com email real (chamado no signup).
 * Atualiza o lead existente ou cria novo com status "signup".
 */
export async function convertVisitorToSignup(params: {
  userId: string;
  email: string;
  fullName?: string;
}) {
  try {
    const visitorId = localStorage.getItem(VISITOR_KEY);
    const utm = getSavedUtm();

    if (visitorId) {
      // Tentar atualizar visitor existente para signup
      const { data: existing } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("referral_code", `visitor_${visitorId}`)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("crm_leads")
          .update({
            user_id: params.userId,
            email: params.email,
            nome: params.fullName || null,
            status: "signup",
            referral_code: null, // limpar o marker de visitor
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        // Criar funnel event
        await supabase.from("crm_funnel_events").insert({
          lead_id: existing.id,
          user_id: params.userId,
          from_stage: "visitor",
          to_stage: "signup",
          trigger_source: "auth_signup",
          metadata: { utm_source: utm?.utm_source },
        });

        return;
      }
    }

    // Se nao achou visitor, criar lead direto como signup
    const { data: newLead } = await supabase
      .from("crm_leads")
      .insert({
        user_id: params.userId,
        email: params.email,
        nome: params.fullName || null,
        status: "signup",
        produto_interesse: "preceptormed",
        utm_source: utm?.utm_source || "direct",
        utm_medium: utm?.utm_medium,
        utm_campaign: utm?.utm_campaign,
        utm_content: utm?.utm_content,
        utm_term: utm?.utm_term,
        landing_page: utm?.landing_page,
        total_sessions: 1,
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (newLead) {
      await supabase.from("crm_funnel_events").insert({
        lead_id: newLead.id,
        user_id: params.userId,
        from_stage: null,
        to_stage: "signup",
        trigger_source: "auth_signup",
        metadata: { utm_source: utm?.utm_source },
      });
    }
  } catch (e) {
    console.debug("[CRM Signup Tracking]", e);
  }
}
