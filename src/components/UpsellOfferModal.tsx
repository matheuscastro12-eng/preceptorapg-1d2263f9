import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * UpsellOfferModal — exibido para usuarios em modo free apos o login.
 *
 * - Aparece automaticamente quando `enabled` for true (uma vez por janela de 24h)
 * - Espera o OnboardingTour terminar antes de aparecer (evita conflito visual)
 * - Persiste a dispensa em localStorage com TTL
 */

const DISMISS_KEY = 'pmed_upsell_dismissed_until';
const DISMISS_HOURS = 24;
const TOUR_KEY = 'tour_main-menu';
const SHOW_DELAY_MS = 1400;

interface UpsellOfferModalProps {
  /** Se true, agenda a exibição do modal (com regras de dispensa) */
  enabled: boolean;
}

const benefits = [
  'Resumos e simulados ilimitados',
  'Chat acadêmico sem limite diário',
  'Banco completo ENAMED/Revalida + flashcards',
  'Suporte prioritário e grupo VIP',
];

export default function UpsellOfferModal({ enabled }: UpsellOfferModalProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    // Se o onboarding ainda não terminou, espera silenciosamente
    if (typeof window !== 'undefined') {
      const tourDone = localStorage.getItem(TOUR_KEY) === 'true';
      if (!tourDone) return;
      const dismissedUntilRaw = localStorage.getItem(DISMISS_KEY);
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
      if (dismissedUntil && dismissedUntil > Date.now()) return;
    }
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [enabled]);

  const persistDismiss = () => {
    const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
    try { localStorage.setItem(DISMISS_KEY, String(until)); } catch { /* storage indisponivel */ }
  };

  const dismiss = () => {
    persistDismiss();
    setOpen(false);
  };

  const goToPricing = () => {
    setOpen(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl bg-white">
        {/* Header — gradiente brand com selo de desconto */}
        <div
          className="relative p-7 text-white"
          style={{ background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' }}
        >
          <div className="absolute top-0 right-0 bg-[#C9A84C] text-[#003D32] px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-bl-lg shadow-md">
            41% OFF
          </div>
          <p className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-[0.18em] mb-3">
            Oferta para você
          </p>
          <h3
            className="text-2xl font-bold leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Acesso completo por{' '}
            <span className="text-[#C9A84C]">R$ 29,24/mês</span>
          </h3>
          <p className="text-sm text-white/80 leading-relaxed">
            No plano anual: tudo o que você precisa para PBL, ENAMED e Revalida, com economia de 41%.
          </p>
        </div>

        {/* Body — lista de benefícios + CTAs */}
        <div className="p-6">
          <ul className="space-y-2.5 text-sm text-brand-ink mb-5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-brand-primary text-[18px] mt-0.5 shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                >
                  check_circle
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Button
              onClick={goToPricing}
              className="w-full h-11 bg-brand-primary-dark hover:bg-brand-primary-darker text-white font-semibold shadow-md"
            >
              Quero garantir 41% OFF
            </Button>
            <button
              onClick={dismiss}
              className="text-xs text-slate-500 hover:text-brand-ink-2 py-2 font-medium transition-colors"
            >
              Lembrar mais tarde
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
            Cancele a qualquer momento · Pagamento seguro EasyFlow
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
