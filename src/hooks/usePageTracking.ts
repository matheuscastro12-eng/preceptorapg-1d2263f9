import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { normalizeUtmSource } from "@/lib/utm";

const VISITOR_KEY = "preceptor_visitor_id";
const SESSION_KEY = "preceptor_session_id";
const UTM_KEY = "preceptor_utm";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Hook global de tracking — registra cada mudanca de rota como page view.
 * Colocar no App.tsx (dentro do BrowserRouter).
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Nao trackear paginas admin/CRM
    if (location.pathname.startsWith("/admin")) return;

    const track = async () => {
      try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();

        // Capturar UTM da URL se presente
        const params = new URLSearchParams(location.search);
        let utm_source = normalizeUtmSource(params.get("utm_source"));
        let utm_medium = params.get("utm_medium");
        let utm_campaign = params.get("utm_campaign");

        // Se nao tem UTM na URL, tentar do sessionStorage (capturado no landing)
        if (!utm_source) {
          try {
            const saved = sessionStorage.getItem(UTM_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              // utm salvo ja vem normalizado (captureUtmParams normaliza),
              // mas re-normalizamos por garantia
              utm_source = normalizeUtmSource(parsed.utm_source);
              utm_medium = parsed.utm_medium;
              utm_campaign = parsed.utm_campaign;
            }
          } catch {}
        }

        // Inferir source do referrer na primeira page view da sessao
        if (!utm_source && document.referrer) {
          try {
            const ref = new URL(document.referrer);
            // So inferir se o referrer e externo
            if (ref.hostname !== window.location.hostname) {
              utm_source = normalizeUtmSource(ref.hostname);
              if (!utm_medium) utm_medium = "referral";
            }
          } catch {}
        }

        await supabase.from("crm_page_views").insert({
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: location.pathname,
          referrer: document.referrer || null,
          utm_source: utm_source || "direct",
          utm_medium: utm_medium,
          utm_campaign: utm_campaign,
          screen_width: window.innerWidth,
          user_agent: navigator.userAgent,
        });
      } catch (e) {
        // Never break the app
        console.debug("[PageTracking]", e);
      }
    };

    track();
  }, [location.pathname]);
}
