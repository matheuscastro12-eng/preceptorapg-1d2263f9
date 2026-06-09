interface MobileStickyCTAProps {
  /** Mostra a barra (tipicamente quando o hero saiu da viewport). */
  show: boolean;
  onClick: () => void;
}

/**
 * Barra de cadastro FIXA no rodapé — só mobile.
 *
 * Por quê: 70% do tráfego é mobile e, pelos dados de funil, a maioria sai
 * tendo visto só o hero (~10% de scroll). O CTA do header é `hidden sm:` —
 * ou seja, quem rola além do hero fica sem NENHUM gatilho de cadastro até
 * voltar ao topo. Esta barra estende o gatilho de conversão (que hoje o hero
 * concentra: 72% dos cliques) para o resto da página.
 *
 * Aparece só depois que o hero sai da viewport (props.show) para não
 * competir com o `hero-signup`. `data-cta` é auto-rastreado pelo
 * event-delegation do useLandingFunnel; o onClick faz trackConversion+navigate.
 * z-40 fica abaixo do header (z-50) e da ScrollProgress (z-60).
 */
export default function MobileStickyCTA({ show, onClick }: MobileStickyCTAProps) {
  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-40 md:hidden px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ' +
        'bg-white/95 backdrop-blur border-t border-slate-200 ' +
        'shadow-[0_-6px_24px_-8px_rgba(0,109,91,0.25)] ' +
        'transition-transform duration-300 ease-out will-change-transform ' +
        (show ? 'translate-y-0' : 'translate-y-full')
      }
      aria-hidden={!show}
    >
      <button
        data-cta="mobile-sticky-signup"
        onClick={onClick}
        tabIndex={show ? 0 : -1}
        className="group w-full inline-flex items-center justify-center gap-2 py-3.5 bg-brand-primary-dark text-white text-[15px] font-bold rounded-xl active:scale-[0.98] transition-transform shadow-[0_8px_20px_-8px_rgba(0,109,91,0.6)]"
      >
        Gerar meu 1º resumo grátis
        <span className="text-brand-gold group-active:translate-x-0.5 transition-transform">→</span>
      </button>
    </div>
  );
}
