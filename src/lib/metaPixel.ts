// ============================================================
// Meta Pixel — eventos de conversão (client-side)
// ============================================================
// O Pixel base (fbq init + PageView) já é carregado no index.html.
// Aqui ficam os eventos de FUNIL que faltavam — sem eles o Meta só via
// PageView e otimizava para visita, nunca para cadastro/compra.
//
// Todos os disparos são best-effort e no-op se o fbq não existir
// (ad-block, consentimento negado, SSR). Nunca lançam.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type PixelParams = Record<string, unknown>;

/**
 * Dispara um evento padrão do Pixel. `eventID` permite deduplicar com o
 * mesmo evento enviado via CAPI (server-side) — o Meta casa os dois.
 */
export function trackPixel(event: string, params?: PixelParams, eventID?: string): void {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (eventID) window.fbq('track', event, params ?? {}, { eventID });
    else window.fbq('track', event, params ?? {});
  } catch { /* no-op */ }
}

/**
 * Evento CUSTOM do Pixel (`fbq('trackCustom', ...)`). Para sinais que não são
 * eventos padrão do Meta — ex.: navegação por seção da landing (ViewSection).
 * No Events Manager dá pra medir o funil da LP por `section_name` ou por URL
 * (cada seção atualiza a URL ?secao=...).
 */
export function trackPixelCustom(event: string, params?: PixelParams): void {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    window.fbq('trackCustom', event, params ?? {});
  } catch { /* no-op */ }
}

/** Cadastro concluído — sinal de topo de conversão (registro). */
export const trackCompleteRegistration = (params?: PixelParams, eventID?: string) =>
  trackPixel('CompleteRegistration', params, eventID);

/** Início de checkout — usuário clicou para pagar e foi ao EasyFlow. */
export const trackInitiateCheckout = (params?: PixelParams, eventID?: string) =>
  trackPixel('InitiateCheckout', params, eventID);

/** Lead — interesse qualificado (ex.: deixou contato). */
export const trackLead = (params?: PixelParams, eventID?: string) =>
  trackPixel('Lead', params, eventID);

// ── Cookies de matching (fbp/fbc) — melhoram a atribuição do CAPI ──

function getCookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}

/** _fbp — id do browser setado pelo Pixel. */
export function getFbp(): string | null {
  return getCookie('_fbp');
}

/**
 * _fbc — id do clique do anúncio. Se o cookie ainda não existir mas houver
 * `fbclid` na URL, monta o fbc no formato esperado pelo Meta.
 */
export function getFbc(): string | null {
  const c = getCookie('_fbc');
  if (c) return c;
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  } catch { /* ignore */ }
  return null;
}
