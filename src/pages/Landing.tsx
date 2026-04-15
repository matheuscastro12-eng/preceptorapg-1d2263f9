import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { Menu, X as XIcon } from 'lucide-react';
import { getEasyflowLink } from '@/utils/easyflow';
import ProfileDropdown from '@/components/ProfileDropdown';
import PixPaymentModal from '@/components/PixPaymentModal';
import logoIcon from '@/assets/logo-icon.png';
import { Loader2 } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // CRM: Track visitor + capture UTM params
  useVisitorTracking();

  // Redirect logged-in users to menu
  if (!loading && user) {
    navigate('/menu', { replace: true });
    return null;
  }

  const handleSubscribe = (planType: 'monthly' | 'annual' | 'biannual') => {
    if (!user) {
      // Not logged in — send to signup first, then checkout opens after
      navigate(`/auth?tab=signup&plan=${planType}`);
      return;
    }
    const link = getEasyflowLink(planType, user.email ?? undefined);
    if (link) {
      window.open(link, '_blank');
    } else {
      toast({ title: 'Em breve', description: 'Plano bianual estará disponível em breve.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ─── Header ───────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] sticky top-0 z-50">
        <nav className="flex justify-between items-center w-full px-4 sm:px-6 md:px-12 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-lg sm:text-2xl font-extrabold text-[#006D5B] tracking-tighter" style={{ fontFamily: "'Manrope', sans-serif" }}>
              PreceptorMED
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-slate-600 font-medium hover:text-[#006D5B] transition-colors duration-300 text-sm">Como funciona</a>
            <a href="#recursos" className="text-slate-600 font-medium hover:text-[#006D5B] transition-colors duration-300 text-sm">Recursos</a>
            <a href="#depoimentos" className="text-slate-600 font-medium hover:text-[#006D5B] transition-colors duration-300 text-sm">Depoimentos</a>
            <a href="#precos" className="text-slate-600 font-medium hover:text-[#006D5B] transition-colors duration-300 text-sm">Planos</a>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => navigate('/menu')}
                className="px-3 sm:px-5 py-2 text-slate-600 font-semibold hover:text-[#006D5B] transition-colors text-xs sm:text-sm">
                Meu Painel
              </button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => navigate('/auth')}
                className="hidden sm:block px-5 py-2 text-slate-600 font-semibold hover:text-[#006D5B] transition-colors text-sm">
                Entrar
              </button>
              <button onClick={() => navigate('/auth?tab=signup')}
                className="hidden sm:block px-4 sm:px-6 py-2 sm:py-2.5 bg-[#006D5B] text-white rounded-lg font-bold shadow-lg hover:bg-[#005344] active:scale-95 transition-all text-xs sm:text-sm">
                Começar agora
              </button>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-slate-600 hover:text-[#006D5B]">
                {mobileMenu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </nav>

        {/* Mobile menu dropdown */}
        {mobileMenu && !user && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in">
            <a href="#como-funciona" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-medium text-slate-600 hover:text-[#006D5B]">Como funciona</a>
            <a href="#recursos" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-medium text-slate-600 hover:text-[#006D5B]">Recursos</a>
            <a href="#depoimentos" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-medium text-slate-600 hover:text-[#006D5B]">Depoimentos</a>
            <a href="#precos" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-medium text-slate-600 hover:text-[#006D5B]">Planos</a>
            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <button onClick={() => navigate('/auth')} className="flex-1 py-2.5 text-sm font-semibold text-[#006D5B] border border-[#006D5B]/20 rounded-lg hover:bg-[#006D5B]/5">Entrar</button>
              <button onClick={() => navigate('/auth?tab=signup')} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#006D5B] rounded-lg hover:bg-[#005344]">Criar conta</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ─── Hero ─────────────────────────────────────── */}
        <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-32 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
            <div className="lg:w-1/2 animate-fade-up">
              <span className="inline-block px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-[#c8eade] text-[#005344] rounded-full">
                Curadoria Médica de Elite
              </span>
              <h1
                className="text-3xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-5 sm:mb-8 tracking-tighter text-[#191c1d]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Apoio clínico de elite para sua jornada médica.
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-slate-500 font-light leading-relaxed mb-8 sm:mb-10 max-w-xl">
                Estude com resumos estruturados e casos reais gerados por IA acadêmica. Criado para quem não tem tempo a perder.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/auth?tab=signup')}
                  className="btn-shimmer relative overflow-hidden px-6 sm:px-8 py-3.5 sm:py-4 bg-[#005344] text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center"
                >
                  Começar agora
                </button>
                <button
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 border border-slate-200 text-[#191c1d] text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 active:scale-95 transition-all duration-300 text-center"
                >
                  Ver demonstração
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 relative animate-fade-up w-full" style={{ animationDelay: '0.2s' }}>
              <div className="relative z-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl rotate-1 sm:rotate-2 hover:rotate-0 transition-transform duration-500 bg-gradient-to-br from-[#e8f5f1] to-[#d0ebe4] p-1">
                {/* App mockup */}
                <div className="bg-white rounded-xl overflow-hidden">
                  {/* Mockup top bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-8">
                      <div className="bg-slate-200/60 rounded-full h-5 max-w-[200px] mx-auto" />
                    </div>
                  </div>
                  {/* Mockup sidebar + content */}
                  <div className="flex h-[300px] sm:h-[440px] lg:h-[540px]">
                    {/* Mini sidebar */}
                    <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-4" style={{ background: 'linear-gradient(180deg, #005344 0%, #006d5b 100%)' }}>
                      <img src={logoIcon} alt="" className="w-7 h-7 brightness-0 invert" />
                      <div className="mt-2 space-y-3">
                        {['dashboard', 'auto_awesome', 'shutter_speed', 'library_books'].map((icon, i) => (
                          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-white/20' : 'hover:bg-white/10'} transition-colors`}>
                            <span className="material-symbols-outlined text-white/80 text-[18px]">{icon}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Content area */}
                    <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-6 overflow-hidden">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 mb-3 sm:mb-6">
                          <div className="w-8 h-8 rounded-lg bg-[#006D5B]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#006D5B] text-[18px]">auto_awesome</span>
                          </div>
                          <div>
                            <div className="h-3 w-28 bg-slate-300 rounded-full" />
                            <div className="h-2 w-20 bg-slate-200 rounded-full mt-1" />
                          </div>
                        </div>
                        {/* Mockup cards */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#006D5B]">
                          <div className="h-3 w-32 bg-[#005344]/20 rounded-full mb-3" />
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                            <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
                            <div className="h-2 w-4/6 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="h-3 w-24 bg-slate-200 rounded-full mb-3" />
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                            <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="h-3 w-28 bg-slate-200 rounded-full mb-3" />
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                            <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative blurs */}
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#9df3dc]/30 rounded-full blur-3xl -z-10" />
              <div className="absolute top-10 -right-10 w-48 h-48 bg-[#c8eade]/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </section>

        {/* ─── Features Section ─────────────────────────── */}
        <section id="recursos" className="py-14 sm:py-24 bg-[#f3f4f5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-10 sm:mb-20 text-center md:text-left max-w-3xl">
              <h2
                className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Ferramentas que falam a língua do médico.
              </h2>
              <p className="text-sm sm:text-lg text-slate-500 leading-relaxed">
                Desenvolvemos uma interface que prioriza a cognição clínica. Sem ruído, apenas o que é essencial para o seu diagnóstico e aprendizado.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {[
                {
                  icon: 'description',
                  title: 'Resumos que vão ao ponto',
                  desc: 'Resumos estruturados por IA com definição, fisiopatologia, diagnóstico e tratamento — prontos em segundos.',
                },
                {
                  icon: 'clinical_notes',
                  title: 'Simule a vida real',
                  desc: 'Casos clínicos interativos e simulados estilo residência que testam seu raciocínio diagnóstico sob pressão.',
                },
                {
                  icon: 'auto_awesome',
                  title: 'Chat Acadêmico com IA',
                  desc: 'Tire dúvidas em tempo real com o preceptor virtual. Respostas contextualizadas baseadas no que você está estudando.',
                },
                {
                  icon: 'download',
                  title: 'Exporte e estude offline',
                  desc: 'Baixe seus resumos em PDF formatado, organize na sua biblioteca pessoal e acesse quando precisar.',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white p-5 sm:p-8 rounded-xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-[#006D5B]/10 flex items-center justify-center rounded-lg mb-6 group-hover:bg-[#006D5B] transition-colors duration-300">
                    <MI name={feature.icon} className="text-[#006D5B] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3
                    className="text-xl font-bold mb-4 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Editorial Content Block ─────────────────── */}
        <section id="como-funciona" className="py-16 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-12 lg:col-span-5 mb-8 lg:mb-0">
                <div className="rounded-xl sm:rounded-2xl shadow-lg w-full h-[350px] sm:h-[500px] bg-gradient-to-br from-[#e8f5f1] to-[#d0ebe4] p-1 overflow-hidden">
                  <div className="bg-white rounded-xl h-full overflow-hidden flex flex-col">
                    {/* Mockup header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                    </div>
                    {/* Simulados mockup */}
                    <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-6 overflow-hidden">
                      <div className="flex items-center gap-2 mb-3 sm:mb-5">
                        <span className="material-symbols-outlined text-[#006D5B]">shutter_speed</span>
                        <div className="h-3.5 w-32 bg-slate-300 rounded-full" />
                      </div>
                      {/* Practice type cards */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-white rounded-xl p-4 border-2 border-[#006D5B] shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-[#006D5B]/10 flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-[#006D5B] text-[16px]">quiz</span>
                          </div>
                          <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-slate-400 text-[16px]">clinical_notes</span>
                          </div>
                          <div className="h-2.5 w-20 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                      {/* Content grid */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className={`bg-white rounded-lg p-3 border ${i <= 2 ? 'border-[#006D5B]' : 'border-slate-200'} shadow-sm`}>
                            <div className="h-2 w-full bg-slate-100 rounded-full mb-1.5" />
                            <div className="h-1.5 w-2/3 bg-slate-50 rounded-full" />
                          </div>
                        ))}
                      </div>
                      {/* Generate button */}
                      <div className="flex justify-center">
                        <div className="h-10 w-40 rounded-lg" style={{ background: 'linear-gradient(135deg, #005344, #006d5b)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                <h2
                  className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 leading-tight text-[#191c1d]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Inteligência artificial aplicada ao ensino médico.
                </h2>

                <div className="space-y-6 sm:space-y-8">
                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#005344] text-white font-bold text-xs italic">01</div>
                    <div>
                      <h4
                        className="text-lg font-bold mb-2 text-[#191c1d]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Resumos Estruturados por IA
                      </h4>
                      <p className="text-slate-500 leading-relaxed">
                        Nossa IA acadêmica gera resumos completos com fisiopatologia, diagnóstico e tratamento em segundos — estruturados para retenção máxima.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#005344] text-white font-bold text-xs italic">02</div>
                    <div>
                      <h4
                        className="text-lg font-bold mb-2 text-[#191c1d]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Design Centrado na Retenção
                      </h4>
                      <p className="text-slate-500 leading-relaxed">
                        Layouts limpos e tipografia estudada para reduzir a fadiga mental durante longas sessões de estudo.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#005344] text-white font-bold text-xs italic">03</div>
                    <div>
                      <h4
                        className="text-lg font-bold mb-2 text-[#191c1d]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Estudo Personalizado
                      </h4>
                      <p className="text-slate-500 leading-relaxed">
                        Escolha o tema, o nível de profundidade e o formato. A plataforma se adapta ao seu estilo de estudo e às suas necessidades.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Social Proof / Depoimentos ──────────────── */}
        <section id="depoimentos" className="py-14 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-block px-3 sm:px-4 py-1.5 mb-4 sm:mb-5 text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-[#c8eade] text-[#005344] rounded-full">
                O que dizem os estudantes
              </span>
              <h2
                className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-tight text-[#191c1d]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Aprovado por quem estuda de verdade.
              </h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Depoimentos reais de estudantes de medicina que já usam o PreceptorMED no dia a dia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
              {/* Depoimento 1 — Alicia */}
              <article className="group relative bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(25,28,29,0.04)] hover:shadow-[0_10px_40px_rgba(0,109,91,0.12)] hover:-translate-y-1 hover:border-[#006D5B]/20 transition-all duration-500">
                {/* Quote icon decorativo */}
                <div className="absolute top-5 right-5 text-[#006D5B]/10 group-hover:text-[#006D5B]/20 transition-colors duration-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                  </svg>
                </div>

                {/* Estrelas */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#C9A84C" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6 font-light italic">
                  "A plataforma PreceptorMED é uma ferramenta fantástica para o auxílio nos estudos. Os resumos são bem estruturados e direcionados para os objetivos de aprendizagem do tema, além de que as fontes utilizadas são sempre relevantes. Particularmente, minha função preferida é a de geração de questões com base nos conteúdos, o que ajuda a reforçar os conhecimentos."
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <img
                    src="/alicia-cosendey.jpg"
                    alt="Alicia Cosendey"
                    onError={(e) => {
                      // Fallback pras iniciais caso a imagem nao exista ainda
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                    className="w-11 h-11 rounded-full object-cover shadow-md"
                  />
                  <div
                    style={{ display: "none" }}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-[#006D5B] to-[#005344] items-center justify-center text-white font-bold text-sm shadow-md"
                  >
                    AC
                  </div>
                  <div>
                    <p className="font-bold text-[#191c1d] text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Alicia Cosendey
                    </p>
                    <p className="text-xs text-slate-500">Estudante de Medicina</p>
                  </div>
                </div>
              </article>

              {/* Depoimento 2 — João */}
              <article className="group relative bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(25,28,29,0.04)] hover:shadow-[0_10px_40px_rgba(0,109,91,0.12)] hover:-translate-y-1 hover:border-[#006D5B]/20 transition-all duration-500">
                <div className="absolute top-5 right-5 text-[#006D5B]/10 group-hover:text-[#006D5B]/20 transition-colors duration-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                  </svg>
                </div>

                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#C9A84C" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6 font-light italic">
                  "Eu não tenho dúvidas que o PreceptorMED é o futuro da medicina! As respostas oferecidas pela IA são de longe as mais detalhadas. Não somente isso, a plataforma sempre utiliza referências nas quais eu confio. Me surpreende também a constante expansão das ferramentas da plataforma, que além de me ajudar nos meus estudos, também me auxilia na realização de trabalhos científicos.
                  <br /><br />
                  <span className="not-italic font-semibold text-[#005344]">Simplificando: se você tiver a oportunidade de assinar o PreceptorMED, assine.</span>"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#005344] to-[#C9A84C] flex items-center justify-center text-white font-bold text-sm shadow-md">
                    JM
                  </div>
                  <div>
                    <p className="font-bold text-[#191c1d] text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      João Miyake
                    </p>
                    <p className="text-xs text-slate-500">Estudante de Medicina</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── Pricing ──────────────────────────────────── */}
        <section id="precos" className="py-14 sm:py-24 bg-[#f3f4f5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h2
                className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-tight text-[#191c1d]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                O plano certo para cada etapa.
              </h2>
              <p className="text-sm sm:text-base text-slate-500">Invista na sua excelência clínica com transparência.</p>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 sm:gap-8 max-w-5xl mx-auto">
              {/* Mensal */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Mensal</h3>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 49,90</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Acesso completo à plataforma
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Resumos e simulados ilimitados
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Cancelamento a qualquer momento
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3 sm:py-4 border border-slate-300 text-[#191c1d] text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'monthly' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar mensal
                </button>
              </div>

              {/* Anual — highlighted */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-xl border-2 border-[#006D5B] relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 bg-[#005344] text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                  Mais Popular
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Anual</h3>
                <div className="mb-1">
                  <span className="text-sm text-slate-400 line-through">De R$ 598,80</span>
                </div>
                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 350,90</span>
                  <span className="text-slate-500">/ano</span>
                </div>
                <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 29,24/mês — Economia de 41%</p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3 font-semibold">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Tudo do plano mensal
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Faça parte do grupo VIP
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Receba atualizações em primeira mão
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Oportunidade de se tornar embaixador
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('annual')}
                  disabled={loadingPlan !== null}
                  className="btn-shimmer relative overflow-hidden w-full py-3 sm:py-4 bg-[#005344] text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:bg-[#003d32] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'annual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar anual
                </button>
              </div>

              {/* Bianual */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 bg-[#C9A84C] text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                  Maior Economia
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Bianual</h3>
                <div className="mb-1">
                  <span className="text-sm text-slate-400 line-through">De R$ 1.197,60</span>
                </div>
                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 599,90</span>
                  <span className="text-slate-500">/2 anos</span>
                </div>
                <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 24,99/mês — Economia de 50%</p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3 font-semibold">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Tudo do plano anual
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Maior economia possível
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Suporte prioritário VIP
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Acesso antecipado a novos recursos
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Seja embaixador PreceptorMED
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('biannual')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3 sm:py-4 border-2 border-[#005344] text-[#005344] text-xs sm:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#005344] hover:text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'biannual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar bianual
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────── */}
        <section className="py-14 sm:py-24" style={{ background: 'linear-gradient(135deg, #005344 0%, #006d5b 100%)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-5 sm:mb-8 tracking-tighter text-white"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Pronto para elevar seu padrão clínico?
            </h2>
            <p className="text-base sm:text-xl text-white/70 mb-8 sm:mb-12 font-light">
              Junte-se a milhares de médicos que já transformaram suas rotinas de estudo.
            </p>
            <button
              onClick={() => navigate('/auth?tab=signup')}
              className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-[#005344] rounded-lg text-sm sm:text-base font-bold uppercase tracking-widest shadow-2xl hover:scale-105 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-300 active:scale-95"
            >
              Criar minha conta agora
            </button>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200/50 py-8 sm:py-12 px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-start w-full max-w-7xl mx-auto gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logoIcon} alt="PreceptorMED" className="h-6 w-6" />
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Manrope', sans-serif" }}>PreceptorMED</span>
            </div>
            <p className="max-w-xs text-sm text-slate-500">
              © {new Date().getFullYear()} PreceptorMED. Plataforma de estudo médico com IA.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Legal</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="#">Termos de Uso</a></li>
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="#">Privacidade</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Empresa</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="mailto:preceptormed@gmail.com">Contato</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Ajuda</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="mailto:preceptormed@gmail.com">Suporte</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <PixPaymentModal
        open={pixModal}
        onClose={() => setPixModal(false)}
        planLabel="Plano Mensal"
        planPrice="R$ 49,90"
      />
    </div>
  );
};

export default Landing;
