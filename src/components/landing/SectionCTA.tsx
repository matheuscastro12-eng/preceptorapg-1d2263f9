/**
 * CTA reutilizável por seção da landing.
 *
 * `variant`:
 *  - 'light' (default): seção de fundo claro → botão verde escuro.
 *  - 'dark': seção de fundo verde escuro → botão branco.
 *
 * Mantém `data-cta` (alimenta o funil do useLandingFunnel + eventos) e recebe
 * o onClick do pai (que faz trackConversion + navigate — flush imediato).
 */

interface SectionCTAProps {
  label: string;
  ctaId: string;
  onClick: () => void;
  variant?: 'light' | 'dark';
  sub?: string;
}

export default function SectionCTA({ label, ctaId, onClick, variant = 'light', sub }: SectionCTAProps) {
  const isDark = variant === 'dark';
  return (
    <div className="mt-10 sm:mt-14 flex flex-col items-center gap-2">
      <button
        data-cta={ctaId}
        onClick={onClick}
        className={
          'group inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-4 rounded-xl text-[15px] font-bold active:scale-[0.98] transition-all ' +
          (isDark
            ? 'bg-white text-brand-primary-dark hover:bg-slate-50 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.35)]'
            : 'bg-brand-primary-dark text-white hover:bg-brand-primary-darker shadow-[0_12px_32px_-10px_rgba(0,109,91,0.5)]')
        }
      >
        {label}
        <span className="text-brand-gold group-hover:translate-x-0.5 transition-transform">→</span>
      </button>
      {sub && (
        <p className={'text-[12px] ' + (isDark ? 'text-white/55' : 'text-slate-500')}>{sub}</p>
      )}
    </div>
  );
}
