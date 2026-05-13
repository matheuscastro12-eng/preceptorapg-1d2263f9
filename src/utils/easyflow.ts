import { supabase } from '@/integrations/supabase/client';

// EasyFlow checkout links — centralized
const LINKS: Record<string, string> = {
  monthly: 'https://pay.easyflow.digital/checkouts/offer/53711ff2-4e3f-4a3e-bf4f-b6297fb5d8e9',
  biannual: 'https://pay.easyflow.digital/checkouts/offer/5f3656be-83d5-4aa6-9e5e-4992a6d28864',
  annual: 'https://pay.easyflow.digital/checkouts/offer/694e4345-758b-4aaa-9187-407708447194',
};

function extractOfferId(url: string): string | null {
  const m = url.match(/\/offer\/([a-f0-9-]{36})/i);
  return m ? m[1] : null;
}

/**
 * Registra uma intencao de checkout no DB e devolve a URL do EasyFlow
 * ja decorada com `external_id` apontando pra essa intencao + email.
 *
 * Esse `external_id` viaja como query string no checkout. Quando o webhook
 * chegar (ate sem email no payload, ex: pagamento com cartao de terceiro),
 * o easyflow-webhook tenta resolver `external_id` -> pending_checkouts.user_id
 * antes de cair nos fallbacks por nome. Resolve o problema da aluna que
 * paga com cartao do pai e o CRM nao consegue ativar.
 *
 * Fallback: se a insercao da intencao falhar (rede off, RLS, etc.),
 * retorna a URL sem decoracao — comportamento antigo, sem regressao.
 */
export async function getEasyflowLink(
  plan: string,
  email?: string,
  userId?: string,
  source?: string,
): Promise<string | null> {
  const base = LINKS[plan];
  if (!base) return null;

  const params = new URLSearchParams();
  if (email) params.set('email', email);

  if (userId) {
    try {
      const offerId = extractOfferId(base);
      if (offerId) {
        const { data, error } = await supabase
          .from('pending_checkouts')
          .insert({ user_id: userId, offer_id: offerId, plan_hint: plan, source: source ?? null })
          .select('id')
          .single();
        if (!error && data?.id) {
          // Multiplas keys aumentam a chance da EasyFlow forwardar UMA delas
          // no webhook payload (sem doc oficial, hedge com varias variantes).
          params.set('external_id', data.id);
          params.set('externalId', data.id);
          params.set('metadata[external_id]', data.id);
          params.set('customField1', data.id);
        } else if (error) {
          console.warn('[easyflow] register intent falhou:', error.message);
        }
      }
    } catch (e) {
      console.warn('[easyflow] register intent erro:', e);
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function openEasyflowCheckout(
  plan: string,
  email?: string,
  userId?: string,
  source?: string,
) {
  const link = await getEasyflowLink(plan, email, userId, source);
  if (link) window.location.href = link;
}
