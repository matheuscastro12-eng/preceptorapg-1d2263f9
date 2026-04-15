import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import PageSkeleton from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrialBanner from '@/components/TrialBanner';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';
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
  { icon: 'history_edu',    label: 'ENAMED',          desc: 'Provas anteriores',     path: '/enamed',                  accent: 'primary' as const },
  { icon: 'stethoscope',    label: 'Simulados',       desc: 'Casos práticos',        path: '/exam?mode=prova',         accent: 'gold' as const },
  { icon: 'clinical_notes', label: 'Casos Clínicos',  desc: 'Revisão aprofundada',   path: '/exam?mode=caso_clinico',  accent: 'primary' as const },
  { icon: 'style',          label: 'Flashcards',      desc: 'Repetição espaçada',    path: '/flashcards',              accent: 'gold' as const },
];

const accentStyles = {
  primary: 'bg-brand-primary/10 text-brand-primary',
  gold: 'bg-brand-gold/15 text-brand-gold',
};

const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'prova':        return { label: 'Simulado', bg: 'bg-slate-100', text: 'text-slate-700' };
    case 'caso_clinico': return { label: 'Caso Clínico', bg: 'bg-slate-100', text: 'text-slate-700' };
    default:             return { label: 'Resumo', bg: 'bg-brand-primary/10', text: 'text-brand-primary-dark' };
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

  // Nota: checkagem de fase_medica foi removida — a pagina /welcome
  // nao existe mais, fase_medica e opcional. User pode configurar depois
  // no /profile. Antes isso causava loop infinito /menu -> /welcome ->
  // /inscricao -> /menu.
  useEffect(() => {
    setCheckingPhase(false);
  }, [user]);

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

      <div className="space-y-10">
        {/* Greeting */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1.5">
            Olá, Dr. {userName}
          </h2>
          <p className="text-sm text-brand-ink-2">
            {isFreeUser
              ? 'Modo demo — experimente grátis ou assine para acesso completo.'
              : 'Pronto para continuar seus estudos?'}
          </p>
          {isFreeUser && (
            <button onClick={() => navigate('/pricing')} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-primary bg-brand-primary/5 border border-brand-primary/20 rounded-lg hover:bg-brand-primary/10 transition-colors">
              Assinar agora →
            </button>
          )}
        </section>

        {/* Trial banner */}
        <section><TrialBanner /></section>

        {/* Primary Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Study with AI — primary CTA */}
          <button
            data-tour="estudo"
            type="button"
            onClick={() => go('/dashboard')}
            className="relative overflow-hidden text-left rounded-2xl p-6 sm:p-8 text-white transition-shadow shadow-[0_8px_24px_-6px_rgba(0,83,68,0.25)] hover:shadow-[0_12px_32px_-6px_rgba(0,83,68,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' }}
          >
            {/* decoração sutil — círculo verde claro desfocado */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="bg-white/15 backdrop-blur-sm border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                <MI name="auto_awesome" fill className="text-white text-[22px]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">Estudo com IA</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-sm">
                Gere resumos estruturados e roteiros de seminário sobre qualquer tema médico.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold">
                Começar
                <MI name="arrow_forward" className="text-[16px]" />
              </span>
            </div>
          </button>

          {/* Preceptor Chat — secondary */}
          <button
            type="button"
            data-tour="preceptoria"
            onClick={() => navigate('/ai-chat')}
            className="relative overflow-hidden text-left bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-brand-primary/40 hover:shadow-[0_8px_24px_-8px_rgba(0,109,91,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            {/* Decoração sutil */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brand-primary/5 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-primary/15 to-brand-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                <MI name="chat_bubble" fill className="text-brand-primary text-[22px]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-brand-ink mb-2 tracking-tight">Preceptor Chat</h3>
              <p className="text-brand-ink-2 text-sm leading-relaxed mb-6 max-w-sm">
                Tire dúvidas com IA em tempo real. Respostas com referências do PubMed.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                Abrir chat
                <MI name="arrow_forward" className="text-[16px]" />
              </span>
            </div>
          </button>
        </section>

        {/* Practice & Assessment */}
        <section className="space-y-5">
          <h3 className="text-lg font-bold text-brand-ink">Prática & Avaliação</h3>

          <div data-tour="pratica" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {practiceItems.map((item) => {
              const locked = isFreeUser && !FREE_ALLOWED.some(r => item.path.startsWith(r));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className="group bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col items-start text-left hover:border-brand-primary/40 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  {...(item.label === 'Flashcards' ? { 'data-tour': 'flashcards' } : {})}
                >
                  <div className={`${accentStyles[item.accent]} w-10 h-10 rounded-lg flex items-center justify-center mb-3 relative`}>
                    <MI name={item.icon} fill className="text-[20px]" />
                    {locked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-700 rounded-full flex items-center justify-center">
                        <Lock className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm text-brand-ink group-hover:text-brand-primary transition-colors">{item.label}</span>
                  <span className="text-xs text-brand-ink-2 mt-0.5">{item.desc}</span>
                  {locked && (
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">PRO</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Library Activity */}
        <section className="space-y-5" data-tour="biblioteca">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-ink">Atividade Recente</h3>
            <button
              onClick={() => go('/library')}
              className="text-brand-primary font-semibold text-sm hover:underline underline-offset-4 inline-flex items-center gap-1"
            >
              Ver tudo
              <MI name="arrow_forward" className="text-[14px]" />
            </button>
          </div>

          {recentItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentItems.map((item) => {
                const typeConfig = getTypeConfig(item.tipo);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go('/library')}
                    className="text-left bg-white p-4 rounded-xl flex items-start gap-3 hover:border-brand-primary/40 hover:shadow-sm transition-all border border-slate-200 group"
                  >
                    <div className="w-12 h-14 rounded-md bg-slate-100 flex-shrink-0 flex items-center justify-center">
                      <MI name="description" className="text-[20px] text-slate-400" />
                    </div>
                    <div className="flex flex-col justify-between min-w-0 flex-1">
                      <div>
                        <h4 className="text-sm font-semibold text-brand-ink line-clamp-2 group-hover:text-brand-primary transition-colors">
                          {item.tema}
                        </h4>
                        <p className="text-xs text-brand-ink-2 mt-1">{formatRelativeDate(item.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full ${typeConfig.bg} text-[10px] font-semibold ${typeConfig.text}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300">
              <div className="w-12 h-12 mx-auto bg-brand-primary/10 rounded-lg flex items-center justify-center mb-3">
                <MI name="auto_awesome" fill className="text-[22px] text-brand-primary" />
              </div>
              <p className="text-sm font-semibold text-brand-ink">Sua biblioteca está vazia</p>
              <p className="text-xs text-brand-ink-2 mt-1 mb-4">Gere seu primeiro resumo com IA para começar a estudar.</p>
              <button onClick={() => go('/dashboard')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary-dark text-white text-sm font-semibold rounded-lg hover:bg-brand-primary-darker transition-colors">
                <MI name="bolt" fill className="text-[14px]" />Gerar primeiro resumo
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

    </DashboardLayout>
  );
};

export default MainMenu;
