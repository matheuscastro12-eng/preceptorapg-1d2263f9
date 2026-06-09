import Reveal from '@/components/landing/Reveal';
import SectionCTA from '@/components/landing/SectionCTA';
import {
  FlashcardMockup,
  ChatPubMedMockup,
  SimuladoMockup,
  EvolucaoMockup,
} from '@/components/landing/mockups/ProductMockups';

/**
 * Showcase visual da plataforma — mostra "a tela de verdade" via mockups SVG
 * on-brand (sem prints raster pesados). Cada célula = um produto + legenda
 * curta. data-section="plataforma" é auto-rastreado pelo useLandingFunnel.
 */

const ITEMS = [
  {
    Mockup: ChatPubMedMockup,
    title: 'Chat com PubMed citado',
    desc: 'Pergunta e resposta com referência verificada inline — evidência, não achismo.',
  },
  {
    Mockup: SimuladoMockup,
    title: 'Simulados ENAMED · REVALIDA',
    desc: 'Questões no padrão INEP, com gabarito e correção na hora.',
  },
  {
    Mockup: FlashcardMockup,
    title: 'Flashcards com SM-2',
    desc: 'Repetição espaçada real: o card volta na hora exata de não esquecer.',
  },
  {
    Mockup: EvolucaoMockup,
    title: 'Sua evolução, medida',
    desc: 'Acerto, XP, sequência e nível — progresso real, sem fake streak.',
  },
] as const;

export default function PlatformShowcase({ onSignup }: { onSignup: () => void }) {
  return (
    <section
      data-section="plataforma"
      className="relative py-16 sm:py-28 bg-[#fafbfa] border-t border-slate-100 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
      <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] rounded-full bg-brand-primary/[0.05] blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal as="div" className="mb-12 sm:mb-16 max-w-2xl">
          <p className="text-[11px] font-semibold text-brand-primary-dark uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-brand-gold" />
            A plataforma por dentro
          </p>
          <h2
            className="text-2xl sm:text-4xl font-bold leading-tight text-brand-ink"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Não é promessa — é a <span className="text-brand-primary">tela que você usa</span>.
          </h2>
          <p className="text-base text-slate-600 leading-relaxed mt-4">
            Quatro ferramentas, uma assinatura. Veja como cada uma aparece no seu dia a dia de estudo.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7">
          {ITEMS.map(({ Mockup, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              direction="up"
              distance={20}
              as="div"
              className="group rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_8px_32px_-16px_rgba(0,109,91,0.18),0_1px_3px_0_rgba(25,28,29,0.04)] hover:shadow-[0_18px_48px_-18px_rgba(0,109,91,0.28)] hover:border-brand-primary/30 transition-all duration-300"
            >
              <div className="rounded-xl bg-gradient-to-b from-slate-50/70 to-white p-2 sm:p-3 ring-1 ring-slate-100">
                <Mockup className="block transition-transform duration-500 group-hover:-translate-y-0.5" />
              </div>
              <div className="px-1 pt-4">
                <h3
                  className="text-base font-bold text-brand-ink mb-1"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {title}
                </h3>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <SectionCTA
          variant="light"
          ctaId="plataforma-signup"
          label="Explorar a plataforma — 3 dias grátis"
          sub="Sem cartão • acesso imediato a tudo"
          onClick={onSignup}
        />
      </div>
    </section>
  );
}
