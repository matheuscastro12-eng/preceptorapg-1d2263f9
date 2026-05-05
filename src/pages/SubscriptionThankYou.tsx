import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import logoIcon from '@/assets/logo-icon.png';
import { CheckCircle, BookOpen, Brain, Zap, ArrowRight, Sparkles, Star } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

const PLAN_INFO: Record<string, { label: string; title: string }> = {
  mensal:  { label: 'Plano Mensal',   title: 'Assinatura Mensal Confirmada' },
  anual:   { label: 'Plano Anual',    title: 'Assinatura Anual Confirmada' },
  bianual: { label: 'Plano Bi-anual', title: 'Assinatura Bi-anual Confirmada' },
};

export default function SubscriptionThankYou() {
  const navigate = useNavigate();
  const { plano } = useParams<{ plano?: string }>();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Estudante';
  const plan = PLAN_INFO[plano ?? ''] ?? { label: 'Assinatura', title: 'Assinatura Confirmada' };

  useEffect(() => {
    document.title = `Bem-vindo ao PreceptorMED! — ${plan.label}`;
    return () => { document.title = 'PreceptorMED'; };
  }, [plan.label]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header — minimal */}
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
            Ir para o Painel
          </button>
        </nav>
      </header>

      <main className="flex-1">

        {/* Hero — Thank You */}
        <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#006D5B]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-8"
            >
              <div className="relative inline-flex">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#006D5B]/10 flex items-center justify-center">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#006D5B]/20 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-[#006D5B]" strokeWidth={1.5} />
                  </div>
                </div>
                {/* Sparkle accents */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-[#C9A84C]" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -bottom-1 -left-3"
                >
                  <Star className="w-5 h-5 text-[#C9A84C] fill-[#C9A84C]" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="inline-block px-4 py-1.5 mb-5 text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-[#c8eade] text-[#005344] rounded-full">
                {plan.title}
              </span>
              <h1
                className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tighter text-[#191c1d]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Bem-vindo ao time, <br className="hidden sm:block" />
                <span className="text-[#006D5B]">Dr. {userName}!</span>
              </h1>
              <p className="text-base sm:text-xl text-slate-500 font-light leading-relaxed mb-10 max-w-xl mx-auto">
                Sua jornada para a residência acaba de ganhar um aliado de elite. Agora você tem acesso completo a todas as ferramentas do PreceptorMED.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16"
            >
              <button
                onClick={() => navigate('/menu')}
                className="btn-shimmer relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#005344] text-white text-sm font-bold uppercase tracking-widest rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
              >
                Começar a Estudar
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-200 text-[#191c1d] text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 active:scale-95 transition-all duration-300"
              >
                Gerar Primeiro Resumo
              </button>
            </motion.div>
          </div>
        </section>

        {/* What you can do now */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-2xl sm:text-3xl font-extrabold text-[#191c1d] mb-4 tracking-tight"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              O que você pode fazer agora
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center text-sm sm:text-base text-slate-500 mb-12 max-w-lg mx-auto"
            >
              Todas as ferramentas estão desbloqueadas. Comece por onde preferir.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: 'auto_awesome',
                  title: 'Resumos com PreceptorMED',
                  desc: 'Gere resumos estruturados sobre qualquer tema médico em segundos.',
                  action: () => navigate('/dashboard'),
                  color: '#006D5B',
                  bg: '#c8eade',
                  delay: 1.0,
                },
                {
                  icon: 'chat_bubble',
                  title: 'Preceptor Chat',
                  desc: 'Tire dúvidas com PreceptorMED especializado em medicina baseada em evidências.',
                  action: () => navigate('/ai-chat'),
                  color: '#005344',
                  bg: '#d0ebe4',
                  delay: 1.1,
                },
                {
                  icon: 'history_edu',
                  title: 'ENAMED',
                  desc: 'Pratique com provas anteriores do ENAMED com correção e explicação.',
                  action: () => navigate('/enamed'),
                  color: '#4c6a62',
                  bg: '#dce8e4',
                  delay: 1.2,
                },
                {
                  icon: 'style',
                  title: 'Flashcards',
                  desc: 'Crie flashcards automáticos e revise com repetição espaçada.',
                  action: () => navigate('/flashcards'),
                  color: '#006D5B',
                  bg: '#e0f0eb',
                  delay: 1.3,
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: item.delay }}
                  onClick={item.action}
                  className="bg-white border border-slate-100 hover:border-[#006D5B]/20 hover:shadow-lg transition-all duration-300 p-6 sm:p-7 rounded-2xl cursor-pointer group hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    <MI name={item.icon} fill className="text-[24px]" />
                  </div>
                  <h3 className="font-bold text-[#191c1d] mb-2 text-sm sm:text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006D5B] uppercase tracking-wider group-hover:gap-2.5 transition-all duration-300">
                    Acessar
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Motivational quote */}
        <section className="px-4 sm:px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="bg-gradient-to-br from-[#005344] to-[#006d5b] rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <MI name="psychology" className="text-[180px] text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed font-light italic mb-6">
                  "Somente aqueles que consideram a cura como o objetivo final de seus esforços podem, portanto, ser designados como médicos."
                </p>
                <p className="text-[#C9A84C] font-bold text-sm tracking-wider uppercase">
                  — Rudolf Virchow
                </p>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    Bons estudos, Dr. {userName}. Estamos juntos nessa jornada.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-5 w-5" />
            <span className="text-sm font-bold text-[#006D5B]" style={{ fontFamily: "'Manrope', sans-serif" }}>PreceptorMED</span>
          </div>
          <span className="text-xs text-slate-400">© {new Date().getFullYear()} Preceptor Group. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
