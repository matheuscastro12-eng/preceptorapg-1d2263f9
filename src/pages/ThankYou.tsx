import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trackStartTrial } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import logoIcon from '@/assets/logo-icon.png';
import { CheckCircle, BookOpen, Brain, Zap, ArrowRight, Sparkles, Clock } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

export default function ThankYou() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Estudante';

  useEffect(() => {
    document.title = 'Teste de 3 dias iniciado — PreceptorMED';
    return () => { document.title = 'PreceptorMED'; };
  }, []);

  // Conversão do trial grátis (sem valor) — Meta Pixel + GA4.
  // Guard de sessão evita disparo duplo (StrictMode / revisita).
  useEffect(() => {
    if (!user?.id) return;
    const firedKey = `pmed_trial_fired_${user.id}`;
    try {
      if (sessionStorage.getItem(firedKey)) return;
      sessionStorage.setItem(firedKey, '1');
    } catch { /* ignora storage indisponível */ }

    trackStartTrial({ content_name: 'trial_3dias' }, `pmed_trial_${user.id}`);
    try {
      window.gtag?.('event', 'start_trial', { method: 'trial_3dias' });
    } catch { /* no-op */ }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] sticky top-0 z-50">
        <nav className="flex justify-between items-center w-full px-4 sm:px-6 md:px-12 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-lg sm:text-2xl font-extrabold text-[#006D5B] tracking-tighter" style={{ fontFamily: "'Manrope', sans-serif" }}>
              PreceptorMED
            </span>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#006D5B] text-white rounded-lg font-bold shadow-lg hover:bg-[#005344] active:scale-95 transition-all text-xs sm:text-sm"
          >
            Começar agora
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16 w-full">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
              className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#006D5B] to-[#005344] shadow-[0_14px_40px_rgba(0,109,91,0.35)]"
            >
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>

          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-xs font-bold text-[#8a6f26] tracking-wide uppercase">Teste grátis de 3 dias ativo</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#191C1D] mb-3 tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Bem-vindo, {userName}!
          </h1>
          <p className="text-base md:text-lg text-[#4a5568] max-w-2xl mx-auto leading-relaxed">
            Você tem <strong className="text-[#006D5B]">3 dias grátis</strong> pra explorar tudo. Sem cartão, sem compromisso — só você e a plataforma inteira na palma da mão.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
            <Clock className="w-4 h-4 text-[#006D5B]" />
            <span className="text-sm text-[#4a5568]">Seu teste termina em <strong className="text-[#191C1D]">72 horas</strong></span>
          </div>
        </motion.section>

        {/* Checklist — o que fazer nos proximos 3 dias */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-[#191C1D] text-center mb-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
            O que fazer nesses 3 dias
          </h2>
          <div className="space-y-3">
            {[
              {
                day: 'Hoje',
                title: 'Gere seu primeiro fechamento de PBL',
                desc: 'Cole um caso clínico ou tema e veja o PreceptorMED entregar um resumo denso em minutos. É o carro-chefe do app.',
                icon: BookOpen,
                action: () => navigate('/dashboard'),
                cta: 'Gerar agora',
              },
              {
                day: 'Amanhã',
                title: 'Teste o chat com PubMed e o banco ENAMED',
                desc: 'Pergunte qualquer dúvida clínica com evidência científica. Depois tente 10 questões do ENAMED pra calibrar onde você está.',
                icon: Brain,
                action: () => navigate('/ai-chat'),
                cta: 'Abrir chat',
              },
              {
                day: 'Dia 3',
                title: 'Configure flashcards e acompanhe seu progresso',
                desc: 'O sistema SM-2 organiza revisões pra você não esquecer o que estudou. Crie uns cards a partir dos fechamentos.',
                icon: Zap,
                action: () => navigate('/flashcards'),
                cta: 'Ver flashcards',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 hover:border-[#006D5B]/40 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-[#006D5B]/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 md:w-6 md:h-6 text-[#006D5B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#C9A84C] uppercase tracking-wider mb-0.5">{step.day}</p>
                    <h3 className="text-base md:text-lg font-bold text-[#191C1D] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#4a5568] leading-relaxed">{step.desc}</p>
                  </div>
                  <button
                    onClick={step.action}
                    className="shrink-0 hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#006D5B] hover:bg-[#006D5B]/5 transition-colors group-hover:bg-[#006D5B]/10"
                  >
                    {step.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={step.action}
                  className="sm:hidden w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#006D5B] bg-[#006D5B]/5"
                >
                  {step.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA final */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-2xl mx-auto text-center bg-gradient-to-br from-[#006D5B] to-[#005344] rounded-2xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,109,91,0.25)]"
        >
          <MI name="rocket_launch" fill className="text-white text-4xl md:text-5xl mb-2" />
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Pronto pra começar?
          </h2>
          <p className="text-sm md:text-base text-white/85 mb-5 max-w-md mx-auto">
            Cada dia do teste é uma chance de encurtar sua jornada pra residência. Não deixa passar.
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#006D5B] rounded-xl font-extrabold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Ir para o painel
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-white/60 mt-4">
            Após os 3 dias, você pode escolher um plano ou seguir com o acesso limitado.
          </p>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-5 text-center text-xs text-gray-500">
          <p>Teste grátis &middot; Sem cartão de crédito &middot; Cancele quando quiser</p>
          <p className="mt-1">Preceptor Group &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
