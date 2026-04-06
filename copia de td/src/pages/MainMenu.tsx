import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import PageSkeleton from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const menuTourSteps: TourStep[] = [
  { target: '[data-tour="estudo"]',      title: 'Estudo com IA',       description: 'Gere seu primeiro resumo! Escolha um tema e a IA cria conteudo completo para voce estudar.', placement: 'bottom' },
  { target: '[data-tour="preceptoria"]', title: 'Preceptor Chat',      description: 'Tire duvidas com a IA. Pergunte qualquer coisa sobre medicina — e como ter um preceptor 24h.', placement: 'bottom' },
  { target: '[data-tour="pratica"]',     title: 'ENAMED & Simulados',  description: 'Pratique com questoes reais do ENAMED e simulados para testar seu conhecimento.', placement: 'bottom' },
  { target: '[data-tour="flashcards"]',  title: 'Flashcards',          description: 'Crie flashcards automaticos. Revise com repeticao espacada para fixar conteudo.', placement: 'bottom' },
  { target: '[data-tour="biblioteca"]',  title: 'Sua Biblioteca',      description: 'Todos seus resumos ficam aqui. Acesse, favorite e exporte seus materiais.', placement: 'top' },
];

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

interface RecentItem {
  id: string;
  tema: string;
  tipo: string;
  created_at: string;
}

const practiceItems = [
  { icon: 'history_edu',    label: 'ENAMED',          desc: 'Provas anteriores',     path: '/enamed',                  bg: 'bg-[#c8eade]', color: 'text-[#4c6a62]' },
  { icon: 'stethoscope',    label: 'Simulados',       desc: 'Casos práticos',        path: '/exam?mode=prova',         bg: 'bg-[#9df3dc]', color: 'text-[#00201a]' },
  { icon: 'clinical_notes', label: 'Casos Clínicos',  desc: 'Revisão aprofundada',   path: '/exam?mode=caso_clinico',  bg: 'bg-[#ffdad3]', color: 'text-[#743425]' },
  { icon: 'style',          label: 'Flashcards',      desc: 'Repetição espaçada',    path: '/flashcards',              bg: 'bg-[#c8eade]', color: 'text-[#2e4c44]' },
];

const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'prova':        return { label: 'Simulado', bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'caso_clinico': return { label: 'Caso Clínico', bg: 'bg-amber-100', text: 'text-amber-700' };
    default:             return { label: 'Resumo', bg: 'bg-[#c8eade]', text: 'text-[#4c6a62]' };
  }
};

const getPlaceholderGradient = (tipo: string) => {
  switch (tipo) {
    case 'prova':        return 'from-blue-100 to-blue-200';
    case 'caso_clinico': return 'from-amber-100 to-amber-200';
    default:             return 'from-emerald-100 to-emerald-200';
  }
};

const MainMenu = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const phaseAlreadyChecked = user ? sessionStorage.getItem('preceptor_phase_ok') === user.id : false;
  const [checkingPhase, setCheckingPhase] = useState(!phaseAlreadyChecked);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({ title: 'Assinatura ativada!', description: 'Seu acesso já está liberado. Bons estudos!' });
    }
  }, [searchParams, toast]);

  // Check if user needs onboarding (no fase_medica set)
  useEffect(() => {
    if (!user || phaseAlreadyChecked) { setCheckingPhase(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('fase_medica')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data && !data.fase_medica) {
        navigate('/welcome', { replace: true });
        return;
      }
      sessionStorage.setItem('preceptor_phase_ok', user.id);
      setCheckingPhase(false);
    };
    check();
  }, [user, navigate, phaseAlreadyChecked]);

  useEffect(() => {
    if (!user) return;
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('fechamentos')
        .select('id, tema, tipo, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentItems(data as RecentItem[]);
    };
    fetchRecent();
  }, [user]);

  if (authLoading || subLoading || adminLoading || checkingPhase) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const isFreeUser = !hasAccess && !isAdmin;

  // Free users: allow AI Chat (has demo limit) and flashcards (has demo limit), block the rest
  const FREE_ALLOWED = ['/ai-chat', '/flashcards'];
  const go = (route: string) => {
    if (!isFreeUser) return navigate(route);
    if (FREE_ALLOWED.some(r => route.startsWith(r))) return navigate(route);
    navigate('/pricing');
  };
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Estudante';

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return format(date, "dd MMM yyyy", { locale: ptBR });
  };

  return (
    <DashboardLayout>
      <OnboardingTour steps={menuTourSteps} tourKey="main-menu" />

      <div className="space-y-8">
        {/* Greeting — compact */}
        <section className="animate-fade-up">
          <h2 className="font-['Manrope'] text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#191c1d] mb-1 tracking-tight">
            Olá, Dr. {userName}!
          </h2>
          <p className="text-sm text-[#3e4945]">
            {isFreeUser
              ? 'Modo demo ativo — experimente grátis ou assine para acesso completo.'
              : 'Pronto para continuar seus estudos?'}
          </p>
          {isFreeUser && (
            <button onClick={() => navigate('/pricing')} className="mt-2 px-4 py-1.5 text-xs font-bold text-[#006D5B] bg-[#006D5B]/10 rounded-lg hover:bg-[#006D5B]/15 transition-colors">
              Assinar agora &rarr;
            </button>
          )}
        </section>

        {/* Primary Feature Cards */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-up"
          style={{ animationDelay: '0.06s' }}
          data-tour="estudo"
        >
          {/* Study with AI */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:scale-[1.015] hover:-translate-y-1 active:scale-[0.99] transition-all duration-500"
            style={{ background: 'linear-gradient(135deg, #005344 0%, #006d5b 100%)' }}
            onClick={() => go('/dashboard')}
          >
            <div className="absolute -right-10 -bottom-10 opacity-10 scale-150 group-hover:scale-[2] group-hover:opacity-[0.18] group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
              <MI name="psychology" className="text-[160px]" />
            </div>
            <div className="absolute -left-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                <MI name="auto_awesome" fill className="text-white text-[24px]" />
              </div>
              <h3 className="font-['Manrope'] text-xl sm:text-2xl font-bold mb-3">Estudo com IA</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-8 max-w-xs">
                Gere resumos estruturados e roteiros de seminário sobre qualquer tema médico, potencializados por IA.
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-[#005344] px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest group-hover:shadow-lg group-hover:gap-3 transition-all duration-300">
                Começar
                <MI name="arrow_forward" className="text-[16px] group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </div>

          {/* Preceptor Chat */}
          <div
            className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(25,28,29,0.06)] relative overflow-hidden group cursor-pointer hover:shadow-xl hover:scale-[1.015] hover:-translate-y-1 active:scale-[0.99] transition-all duration-500"
            onClick={() => navigate('/ai-chat')}
            data-tour="preceptoria"
          >
            <div className="absolute -right-10 -bottom-10 text-[#006D5B] opacity-5 scale-150 group-hover:scale-[2] group-hover:opacity-[0.12] group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
              <MI name="forum" className="text-[160px]" />
            </div>
            <div className="absolute -left-6 -top-6 w-24 h-24 bg-[#006D5B]/3 rounded-full blur-2xl group-hover:bg-[#006D5B]/6 transition-all duration-700" />
            <div className="relative z-10">
              <div className="bg-[#006D5B]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#006D5B]/15 group-hover:scale-110 transition-all duration-300">
                <MI name="chat_bubble" fill className="text-[#006D5B] text-[24px]" />
              </div>
              <h3 className="font-['Manrope'] text-xl sm:text-2xl font-bold text-[#191c1d] mb-3">Preceptor Chat</h3>
              <p className="text-[#3e4945] text-sm leading-relaxed mb-8 max-w-xs">
                Acesso direto ao suporte acadêmico e orientação especializada para a sua preparação.
              </p>
              <span className="inline-flex items-center gap-2 bg-[#005344] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest group-hover:shadow-lg group-hover:gap-3 transition-all duration-300">
                Abrir Chat
                <MI name="arrow_forward" className="text-[16px] group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </div>
        </section>

        {/* Practice & Assessment */}
        <section
          className="space-y-6 animate-fade-up relative z-10"
          style={{ animationDelay: '0.14s' }}
          data-tour="pratica"
        >
          <h3 className="font-['Manrope'] text-xl font-bold text-[#191c1d]">Prática & Avaliação</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {practiceItems.map((item, i) => (
              <div
                key={item.path}
                onClick={() => go(item.path)}
                style={{ animationDelay: `${0.14 + i * 0.06}s` }}
                className="animate-fade-up bg-white border border-slate-100 hover:border-[#006D5B]/20 hover:shadow-lg transition-all duration-300 p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                {...(item.label === 'Flashcards' ? { 'data-tour': 'flashcards' } : {})}
              >
                <div className={`${item.bg} ${item.color} w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md relative`}>
                  <MI name={item.icon} className="text-[22px] sm:text-[24px]" />
                  {isFreeUser && !FREE_ALLOWED.some(r => item.path.startsWith(r)) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 rounded-full flex items-center justify-center shadow-sm">
                      <Lock className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-sm text-[#191c1d] mb-0.5 group-hover:text-[#006D5B] transition-colors duration-200">{item.label}</span>
                <span className="text-[10px] text-[#6e7975] uppercase tracking-widest hidden sm:block">{item.desc}</span>
                {isFreeUser && !FREE_ALLOWED.some(r => item.path.startsWith(r)) && (
                  <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">PRO</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Library Activity */}
        <section
          className="space-y-6 animate-fade-up relative z-10"
          style={{ animationDelay: '0.2s' }}
          data-tour="biblioteca"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-['Manrope'] text-xl font-bold text-[#191c1d]">Atividade Recente</h3>
            <button
              onClick={() => go('/library')}
              className="text-[#006D5B] font-bold text-sm hover:underline underline-offset-4 transition-all flex items-center gap-1 group"
            >
              Ver tudo
              <MI name="arrow_forward" className="text-[16px] group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {recentItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {recentItems.map((item) => {
                const typeConfig = getTypeConfig(item.tipo);
                const gradient = getPlaceholderGradient(item.tipo);
                return (
                  <div
                    key={item.id}
                    onClick={() => go('/library')}
                    className="bg-white p-4 sm:p-5 rounded-2xl flex items-start gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group border border-slate-100 hover:border-[#006D5B]/20"
                  >
                    <div className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center relative overflow-hidden`}>
                      <MI name="description" className="text-[28px] text-[#006D5B]/20" />
                      <div className="absolute inset-0 bg-[#006D5B]/5" />
                    </div>
                    <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                      <div>
                        <h4 className="text-sm font-bold text-[#191c1d] line-clamp-1 group-hover:text-[#006D5B] transition-colors duration-200">
                          {item.tema}
                        </h4>
                        <p className="text-[10px] text-[#6e7975] mt-1">{formatRelativeDate(item.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full ${typeConfig.bg} text-[10px] font-bold ${typeConfig.text}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <MI name="auto_awesome" fill className="text-[40px] text-[#006D5B]/20 mb-3" />
              <p className="text-sm font-semibold text-[#191c1d]">Comece sua jornada!</p>
              <p className="text-xs text-[#6e7975] mt-1 mb-4">Gere seu primeiro resumo com IA para começar a estudar.</p>
              <button onClick={() => go('/dashboard')} className="px-5 py-2 bg-[#006D5B] text-white text-xs font-bold rounded-lg hover:bg-[#005344] transition-colors">
                <span className="flex items-center gap-1.5"><MI name="bolt" fill className="text-[14px]" />Gerar primeiro resumo</span>
              </button>
            </div>
          )}
        </section>

        {/* Legal disclaimer */}
        <section className="border-t border-slate-200/40 pt-8">
          <div className="p-5 rounded-xl bg-[#f3f4f5]">
            <p className="text-xs text-[#6e7975] leading-relaxed text-justify">
              O conteúdo disponibilizado pela PreceptorMED tem caráter estritamente educacional e informativo. As informações e ferramentas de IA não substituem o julgamento clínico do profissional médico. (CFM 2.338/2023)
            </p>
          </div>
        </section>
      </div>

      {/* FAB — only show when scrolled past cards */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => go('/dashboard')}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #005344, #006d5b)' }}
          title="Novo estudo"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </DashboardLayout>
  );
};

export default MainMenu;
