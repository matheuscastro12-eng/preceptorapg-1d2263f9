import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Brain, Shield, AlertTriangle, MessageSquare, ChevronRight, Lock, Crown, GraduationCap, Stethoscope, ClipboardList, Layers } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import logoPreceptor from '@/assets/logo-preceptor.png';
import logoIcon from '@/assets/logo-icon.png';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import { Button } from '@/components/ui/button';

const menuTourSteps: TourStep[] = [
  { target: '[data-tour="estudo"]', title: 'Estudo com IA', description: 'Gere resumos e seminários completos sobre qualquer tema médico.', placement: 'bottom' },
  { target: '[data-tour="preceptoria"]', title: 'PreceptorMED Chat', description: 'Converse livremente com a IA acadêmica para tirar dúvidas.', placement: 'bottom' },
  { target: '[data-tour="pratica"]', title: 'Prática', description: 'Simulados, casos clínicos, ENAMED e flashcards.', placement: 'bottom' },
  { target: '[data-tour="biblioteca"]', title: 'Sua Biblioteca', description: 'Todos os seus resumos e conteúdos ficam salvos aqui.', placement: 'top' },
];

const MainMenu = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({ title: '🎉 Assinatura ativada!', description: 'Seu acesso já está liberado. Bons estudos!' });
    }
  }, [searchParams, toast]);

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;
  const isFreeUser = !hasAccess && !isAdmin;

  const fade = (i: number) => ({
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  });

  const go = (route: string) => isFreeUser ? navigate('/pricing') : navigate(route);

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <OnboardingTour steps={menuTourSteps} tourKey="main-menu" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-xl safe-area-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <img src={logoPreceptor} alt="PreceptorMED" className="h-10 sm:h-12 lg:h-14 w-auto" />
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      {/* Upgrade Banner */}
      {isFreeUser && (
        <div className="bg-gradient-to-r from-primary/8 to-accent/8 border-b border-primary/15">
          <div className="container px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground">Demo</span> — Assine para acesso completo
              </p>
            </div>
            <Button size="sm" className="shrink-0 h-7 text-[11px] sm:text-xs gap-1" onClick={() => navigate('/pricing')}>
              Ver Planos <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 container relative py-6 sm:py-10 px-4 max-w-3xl mx-auto">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src={logoIcon} alt="" className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preceptor<span className="text-primary">MED</span>
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">
            O que deseja <span className="text-primary">estudar</span> hoje?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            {isFreeUser ? 'Experimente grátis ou assine para acesso completo' : 'Escolha uma opção para começar'}
          </p>
        </motion.div>

        {/* Two hero cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Estudo com IA */}
          <motion.button data-tour="estudo" variants={fade(0)} initial="hidden" animate="visible" whileTap={{ scale: 0.98 }}
            onClick={() => go('/dashboard')}
            className={`group relative rounded-2xl border border-primary/25 bg-card p-5 sm:p-6 text-left transition-colors hover:bg-primary/5 cursor-pointer overflow-hidden ${isFreeUser ? 'opacity-80' : ''}`}>
            {isFreeUser && <LockBadge />}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">Estudo com IA</h2>
                <p className="text-[11px] text-primary font-medium">Resumos & Seminários</p>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Gere resumos estruturados e seminários completos com IA acadêmica
            </p>
            <CardArrow label={isFreeUser ? 'Desbloquear' : 'Começar'} className="text-primary" />
          </motion.button>

          {/* PreceptorMED Chat */}
          <motion.button data-tour="preceptoria" variants={fade(1)} initial="hidden" animate="visible" whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/ai-chat')}
            className="group relative rounded-2xl border border-accent/25 bg-card p-5 sm:p-6 text-left transition-colors hover:bg-accent/5 cursor-pointer overflow-hidden">
            {isFreeUser && <FreeBadge />}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">PreceptorMED</h2>
                <p className="text-[11px] text-accent font-medium">Chat Livre com IA</p>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {isFreeUser ? 'Converse com IA acadêmica — 2 perguntas grátis/dia' : 'Tire dúvidas complexas com profundidade acadêmica'}
            </p>
            <CardArrow label={isFreeUser ? 'Experimentar' : 'Conversar'} className="text-accent" />
          </motion.button>
        </div>

        {/* Prática — horizontal row */}
        <motion.div data-tour="pratica" variants={fade(2)} initial="hidden" animate="visible"
          className={`rounded-2xl border border-border/40 bg-card p-4 sm:p-5 mb-3 sm:mb-4 ${isFreeUser ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-bold text-foreground">Prática</h2>
            {isFreeUser && <LockBadge inline />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <PracticeLink icon={<Stethoscope className="h-4 w-4" />} label="ENAMED" onClick={() => go('/enamed')} />
            <PracticeLink icon={<ClipboardList className="h-4 w-4" />} label="Simulados" onClick={() => go('/exam?mode=prova')} />
            <PracticeLink icon={<Brain className="h-4 w-4" />} label="Casos Clínicos" onClick={() => go('/exam?mode=caso_clinico')} />
            <PracticeLink icon={<Layers className="h-4 w-4" />} label="Flashcards" onClick={() => go('/flashcards')} />
          </div>
        </motion.div>

        {/* Biblioteca */}
        <motion.button data-tour="biblioteca" variants={fade(3)} initial="hidden" animate="visible" whileTap={{ scale: 0.98 }}
          onClick={() => go('/library')}
          className={`group w-full rounded-2xl border border-border/40 bg-card p-4 sm:p-5 text-left transition-colors hover:bg-muted/30 cursor-pointer ${isFreeUser ? 'opacity-75' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">Biblioteca</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Resumos, provas e casos salvos</p>
            </div>
            {isFreeUser && <LockBadge inline />}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.button>

        {/* Legal */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 sm:mt-14">
          <details className="group rounded-xl border border-border/20 bg-muted/10 overflow-hidden">
            <summary className="flex items-center gap-2 p-3 cursor-pointer select-none hover:bg-muted/20 transition-colors text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Avisos Legais
              <ChevronRight className="h-3 w-3 ml-auto transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Conteúdo gerado por IA para fins educacionais. <strong className="text-foreground/80">Não substitui orientação médica profissional</strong>. Dados tratados conforme LGPD.
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  IA pode conter imprecisões. Valide com fontes primárias (CFM 2.338/2023).
                </p>
              </div>
            </div>
          </details>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6 pb-4">
          PreceptorMED © {new Date().getFullYear()} — Uso acadêmico
        </p>
      </main>
    </PageTransition>
  );
};

/* ── Tiny sub-components ── */

const LockBadge = ({ inline }: { inline?: boolean }) => (
  <span className={`${inline ? '' : 'absolute top-3 right-3 z-10'} flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/60 border border-border/30 text-[10px] font-medium text-muted-foreground`}>
    <Lock className="h-2.5 w-2.5" /> PRO
  </span>
);

const FreeBadge = () => (
  <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
    GRÁTIS
  </span>
);

const CardArrow = ({ label, className }: { label: string; className?: string }) => (
  <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${className}`}>
    {label} <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
  </div>
);

const PracticeLink = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/20 bg-background/60 hover:bg-background hover:border-border/40 transition-all text-left active:scale-[0.97]">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-xs font-semibold text-foreground">{label}</span>
  </button>
);

export default MainMenu;
