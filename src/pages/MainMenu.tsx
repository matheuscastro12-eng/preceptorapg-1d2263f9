import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Brain, GraduationCap, Library, Shield, AlertTriangle, MessageSquare, ChevronRight, Zap, Lock, Crown, Layers } from 'lucide-react';
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
  {
    target: '[data-tour="estudo"]',
    title: 'Estudo com IA',
    description: 'Gere resumos e seminários completos sobre qualquer tema médico.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="preceptoria"]',
    title: 'PreceptorMED Chat',
    description: 'Converse livremente com a IA acadêmica para tirar dúvidas.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="pratica"]',
    title: 'Prática',
    description: 'Simulados, casos clínicos, ENAMED e flashcards em um só lugar.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="biblioteca"]',
    title: 'Sua Biblioteca',
    description: 'Todos os seus resumos e conteúdos ficam salvos aqui.',
    placement: 'top',
  },
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const practiceItems = [
    { label: 'ENAMED', route: '/enamed', color: 'text-amber-600' },
    { label: 'Simulados', route: '/exam?mode=prova', color: 'text-destructive' },
    { label: 'Casos Clínicos', route: '/exam?mode=caso_clinico', color: 'text-accent' },
    { label: 'Flashcards', route: '/flashcards', color: 'text-primary' },
  ];

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <OnboardingTour steps={menuTourSteps} tourKey="main-menu" />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full opacity-50 will-change-transform" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full opacity-50 will-change-transform" />
      </div>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-xl safe-area-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <img src={logoPreceptor} alt="PreceptorMED" className="h-10 sm:h-12 lg:h-14 w-auto" />
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </motion.header>

      {/* Upgrade Banner */}
      {isFreeUser && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
          <div className="container px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground">Demo</span> — Assine para desbloquear tudo
              </p>
            </div>
            <Button size="sm" className="shrink-0 h-7 text-[11px] sm:text-xs gap-1" onClick={() => navigate('/pricing')}>
              Ver Planos <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 container relative py-5 sm:py-8 lg:py-10 px-4">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-col items-center mb-6 sm:mb-10 lg:mb-12">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-5">
            <img src={logoIcon} alt="PreceptorMED" className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preceptor<span className="text-primary">MED</span>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground text-center">
            O que deseja <span className="text-primary">estudar</span> hoje?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-md mx-auto text-center">
            {isFreeUser ? 'Experimente o chat acadêmico grátis ou assine para acesso completo' : 'Escolha uma das opções abaixo para começar'}
          </p>
        </motion.div>

        {/* 4 Main Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 max-w-4xl mx-auto">

          {/* 1. ESTUDO COM IA */}
          <motion.button
            data-tour="estudo"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/dashboard')}
            className={`group relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-primary/10 ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" /> Premium
              </div>
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none opacity-50" />
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-3">
              <Zap className="h-3 w-3" /> Principal
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">ESTUDO COM IA</h2>
            <p className="text-xs font-medium text-primary mb-1">Resumos & Seminários</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              Gere resumos estruturados e seminários completos com IA acadêmica
            </p>
            <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Começar agora'} <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* 2. PRECEPTORMED CHAT */}
          <motion.button
            data-tour="preceptoria"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/ai-chat')}
            className="group relative rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-accent/10"
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">GRÁTIS</div>
            )}
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">PRECEPTORMED</h2>
            <p className="text-xs font-medium text-accent mb-1">Chat Livre com IA</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {isFreeUser ? 'Converse com IA acadêmica — 2 perguntas grátis/dia' : 'Tire dúvidas complexas com profundidade acadêmica'}
            </p>
            <div className="flex items-center gap-1 mt-3 text-accent text-xs font-medium">
              {isFreeUser ? 'Experimentar' : 'Conversar'} <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* 3. PRÁTICA */}
          <motion.button
            data-tour="pratica"
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => {}} // No direct navigation, sub-items below
            className={`group relative rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent p-5 sm:p-6 text-left transition-all duration-300 cursor-default overflow-hidden ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" /> Premium
              </div>
            )}
            <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-3">
              <GraduationCap className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-2">PRÁTICA</h2>

            <div className="space-y-1.5">
              {practiceItems.map((item) => (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    isFreeUser ? navigate('/pricing') : navigate(item.route);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg border border-border/20 bg-background/40 hover:bg-background/80 hover:border-border/40 transition-all text-left active:scale-[0.98]"
                >
                  <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </motion.button>

          {/* 4. BIBLIOTECA */}
          <motion.button
            data-tour="biblioteca"
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/library')}
            className={`group relative rounded-2xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10 p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-muted/30 ${isFreeUser ? 'opacity-70' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">BIBLIOTECA</h2>
            <p className="text-xs font-medium text-muted-foreground mb-1">Seus Conteúdos</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              Resumos, provas e casos clínicos salvos para consulta
            </p>
            <div className="flex items-center gap-1 mt-3 text-muted-foreground text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Acessar'} <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        {/* Legal Disclaimers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="max-w-4xl mx-auto mt-8 sm:mt-14">
          <details className="group rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
            <summary className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors active:bg-muted/40">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avisos Legais — Uso de IA</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/50">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Este aplicativo utiliza modelos de Inteligência Artificial generativa para fins exclusivamente educacionais e acadêmicos. 
                  O conteúdo gerado <strong className="text-foreground/80">não substitui orientação médica profissional, diagnóstico ou tratamento</strong>. 
                  Em conformidade com a <strong className="text-foreground/80">Lei nº 13.709/2018 (LGPD)</strong>, os dados fornecidos são tratados com sigilo.
                </p>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive/70 shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Conteúdos gerados por IA podem conter <strong className="text-foreground/80">imprecisões ou informações desatualizadas</strong>. 
                  Conforme a <strong className="text-foreground/80">Resolução CFM nº 2.338/2023</strong>, 
                  valide sempre com fontes primárias antes de qualquer aplicação clínica ou acadêmica.
                </p>
              </div>
            </div>
          </details>
        </motion.div>

        <div className="text-center mt-6 sm:mt-10 pb-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground/50">
            PreceptorMED © {new Date().getFullYear()} — Ferramenta educacional. Uso acadêmico.
          </p>
        </div>
      </main>
    </PageTransition>
  );
};

export default MainMenu;
