import { useEffect, useRef, useCallback } from 'react';
import { trackPixelCustom } from '@/lib/metaPixel';

/**
 * Landing funnel analytics.
 * Rastreia:
 * - page_view (1x por sessão)
 * - section_view / section_exit com duration_ms (IntersectionObserver)
 * - scroll_depth (25/50/75/100%)
 * - cta_click (qualquer elemento com data-cta)
 * - page_exit (beforeunload, captura scroll max)
 *
 * Usa visitor_id persistente (localStorage) + session_id por tab (sessionStorage).
 * Eventos são enviados em batch via fetch keepalive pra não bloquear navegação.
 */

interface LandingEvent {
  visitor_id: string;
  session_id: string;
  event_type: 'page_view' | 'section_view' | 'section_exit' | 'cta_click' | 'scroll_depth' | 'conversion' | 'page_exit';
  section?: string;
  cta_id?: string;
  duration_ms?: number;
  scroll_pct?: number;
  viewport_w?: number;
  viewport_h?: number;
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  user_agent?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getVisitorId(): string {
  try {
    let id = localStorage.getItem('pmed_vid');
    if (!id) {
      id = uuid();
      localStorage.setItem('pmed_vid', id);
    }
    return id;
  } catch {
    return uuid();
  }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('pmed_sid');
    if (!id) {
      id = uuid();
      sessionStorage.setItem('pmed_sid', id);
    }
    return id;
  } catch {
    return uuid();
  }
}

function getUTM(): Pick<LandingEvent, 'utm_source' | 'utm_medium' | 'utm_campaign'> {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || undefined,
      utm_medium: p.get('utm_medium') || undefined,
      utm_campaign: p.get('utm_campaign') || undefined,
    };
  } catch {
    return {};
  }
}

// Buffer + flush batching
let buffer: LandingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function enrich(event: LandingEvent): LandingEvent {
  return {
    ...event,
    viewport_w: event.viewport_w ?? window.innerWidth,
    viewport_h: event.viewport_h ?? window.innerHeight,
    path: event.path ?? window.location.pathname,
    referrer: event.referrer ?? (document.referrer || undefined),
    user_agent: event.user_agent ?? navigator.userAgent,
    ...getUTM(),
  };
}

async function flush(useBeacon = false) {
  if (!buffer.length) return;
  const events = buffer;
  buffer = [];
  const payload = JSON.stringify(events);
  const url = `${SUPABASE_URL}/rest/v1/landing_events`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Prefer: 'return=minimal',
  };

  if (useBeacon && 'sendBeacon' in navigator) {
    // sendBeacon não permite custom headers além de Content-Type — usar URL com apikey
    const blob = new Blob([payload], { type: 'application/json' });
    // Fallback pra fetch keepalive porque sendBeacon ignora auth headers
    try {
      fetch(url, { method: 'POST', headers, body: payload, keepalive: true });
    } catch {
      navigator.sendBeacon(url, blob);
    }
    return;
  }

  try {
    await fetch(url, { method: 'POST', headers, body: payload, keepalive: true });
  } catch (e) {
    // Re-enqueue em caso de erro
    buffer.unshift(...events);
  }
}

function track(event: LandingEvent) {
  buffer.push(enrich(event));
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 2000); // batch de 2s
}

/**
 * Hook principal. Chama no componente da Landing.
 * Retorna função `trackConversion(ctaId)` pra disparar quando user clica
 * em CTA que leva a /auth.
 */
export function useLandingFunnel() {
  const visitorId = useRef(getVisitorId());
  const sessionId = useRef(getSessionId());
  const sectionEnterTimes = useRef<Record<string, number>>({});
  const maxScrollPct = useRef(0);
  const scrollMilestones = useRef<Set<number>>(new Set());
  const pageViewSent = useRef(false);

  const base = useCallback(() => ({
    visitor_id: visitorId.current,
    session_id: sessionId.current,
  }), []);

  const trackConversion = useCallback((ctaId: string) => {
    track({ ...base(), event_type: 'conversion', cta_id: ctaId });
    flush(); // flush imediato em conversão (não perde se user for redirecionado)
  }, [base]);

  // page_view (1x por sessão) + page_exit ao sair
  useEffect(() => {
    if (!pageViewSent.current) {
      track({ ...base(), event_type: 'page_view' });
      pageViewSent.current = true;
    }

    const onExit = () => {
      // Fecha dwells abertos
      Object.entries(sectionEnterTimes.current).forEach(([section, enteredAt]) => {
        const duration_ms = Math.max(0, Date.now() - enteredAt);
        if (duration_ms < 200) return;
        track({ ...base(), event_type: 'section_exit', section, duration_ms });
      });
      track({ ...base(), event_type: 'page_exit', scroll_pct: maxScrollPct.current });
      flush(true);
    };

    window.addEventListener('pagehide', onExit);
    window.addEventListener('beforeunload', onExit);
    return () => {
      window.removeEventListener('pagehide', onExit);
      window.removeEventListener('beforeunload', onExit);
      onExit();
    };
  }, [base]);

  // Scroll depth: marcos 25/50/75/100
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const h = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      const total = h.scrollHeight || 1;
      const pct = Math.min(100, Math.round((scrolled / total) * 100));
      if (pct > maxScrollPct.current) {
        maxScrollPct.current = pct;
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m && !scrollMilestones.current.has(m)) {
            scrollMilestones.current.add(m);
            track({ ...base(), event_type: 'scroll_depth', scroll_pct: m });
          }
        }
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [base]);

  // Section tracking via IntersectionObserver em elementos [data-section]
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.getAttribute('data-section');
          if (!section) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            if (!sectionEnterTimes.current[section]) {
              sectionEnterTimes.current[section] = Date.now();
              track({ ...base(), event_type: 'section_view', section });
              // Meta: atualiza a URL (?secao=...) — refresh-safe, preserva
              // utm/fbclid — e dispara um evento custom por seção. Permite
              // montar no Meta um funil da LP (Custom Conversion por
              // `section_name` OU por URL contendo "secao=precos", etc.).
              try {
                const u = new URL(window.location.href);
                u.searchParams.set('secao', section);
                window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
              } catch { /* ignore */ }
              trackPixelCustom('ViewSection', { section_name: section });
            }
          } else {
            const enteredAt = sectionEnterTimes.current[section];
            if (enteredAt) {
              const duration_ms = Math.max(0, Date.now() - enteredAt);
              delete sectionEnterTimes.current[section];
              if (duration_ms >= 200) {
                track({ ...base(), event_type: 'section_exit', section, duration_ms });
              }
            }
          }
        });
      },
      { threshold: [0.3, 0.7] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [base]);

  // CTA clicks via event delegation em [data-cta]
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const cta = target.closest('[data-cta]') as HTMLElement | null;
      if (!cta) return;
      const cta_id = cta.getAttribute('data-cta') ?? 'unknown';
      track({ ...base(), event_type: 'cta_click', cta_id });
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [base]);

  return { trackConversion };
}
