import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Brain, FlaskConical, GraduationCap, Library, Shield, AlertTriangle, MessageSquare, ChevronRight, Zap, Lock, Crown, ClipboardList } from 'lucide-react';
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
    description: 'Aqui você gera fechamentos e seminários completos sobre qualquer tema médico. É a principal ferramenta de estudo!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="casos"]',
    title: 'Casos Clínicos',
    description: 'Pratique raciocínio clínico com casos elaborados pela IA baseados nos seus estudos anteriores.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="simulados"]',
    title: 'Simulados',
    description: 'Gere questões no estilo residência médica com modo simulado interativo para testar seus conhecimentos.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="biblioteca"]',
    title: 'Sua Biblioteca',
    description: 'Todos os seus fechamentos, provas e casos clínicos ficam salvos aqui para consulta futura.',
    placement: 'top',
  },
  {
    target: '[data-tour="preceptoria"]',
    title: 'Chat Acadêmico',
    description: 'Converse livremente com a IA para tirar dúvidas complexas com profundidade acadêmica.',
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

  // Show success toast after checkout
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({
        title: '🎉 Assinatura ativada!',
        description: 'Seu acesso já está liberado. Bons estudos!',
      });
    }
  }, [searchParams, toast]);

  if (authLoading || subLoading || adminLoading) {
    return <PageSkeleton variant="menu" />;
  }

  if (!user) return <Navigate to="/auth" replace />;
  const isFreeUser = !hasAccess && !isAdmin;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      {/* Onboarding Tour */}
      <OnboardingTour steps={menuTourSteps} tourKey="main-menu" />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full opacity-50 will-change-transform"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full opacity-50 will-change-transform"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-xl safe-area-top"
      >
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <img 
              src={logoPreceptor} 
              alt="PreceptorMED" 
              className="h-10 sm:h-12 lg:h-14 w-auto"
            />
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </motion.header>

      {/* Upgrade Banner for free users */}
      {isFreeUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20"
        >
          <div className="container px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground">Demo</span> — Assine para desbloquear tudo
              </p>
            </div>
            <Button size="sm" className="shrink-0 h-7 text-[11px] sm:text-xs gap-1" onClick={() => navigate('/pricing')}>
              Ver Planos
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 container relative py-5 sm:py-8 lg:py-10 px-4">
        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-6 sm:mb-10 lg:mb-12"
        >
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

        {/* Main Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 max-w-5xl mx-auto">
          
          {/* ESTUDO COM IA - Hero Card */}
          <motion.button
            data-tour="estudo"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/dashboard')}
            className={`group relative col-span-2 lg:col-span-2 lg:row-span-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 lg:p-8 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-primary/10 ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                Premium
              </div>
            )}
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none opacity-50" />
            
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-3 sm:mb-4">
              <Zap className="h-3 w-3" />
              Principal
            </div>

            <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
            </div>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">ESTUDO COM IA</h2>
            <p className="text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-3">Fechamentos & Seminários</p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md hidden sm:block">
              Gere fechamentos de objetivos e seminários completos com IA acadêmica. 
              A ferramenta perfeita para seu estudo dirigido em PBL/ABP.
            </p>

            <div className="flex items-center gap-1.5 mt-3 sm:mt-6 text-primary text-xs sm:text-sm font-medium">
              {isFreeUser ? 'Desbloquear' : 'Começar agora'}
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* CASOS CLÍNICOS */}
          <motion.button
            data-tour="casos"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.96 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/exam?mode=caso_clinico')}
            className={`group relative rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 sm:p-5 lg:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-accent/10 ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-accent/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-0.5 sm:mb-1">CASOS CLÍNICOS</h2>
            <p className="text-[10px] sm:text-xs font-medium text-accent mb-1 sm:mb-2">Raciocínio Diagnóstico</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              Casos clínicos elaborados com base nos seus estudos
            </p>
            <div className="flex items-center gap-1 mt-3 sm:mt-4 text-accent text-[11px] sm:text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Praticar'}
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* SIMULADOS */}
          <motion.button
            data-tour="simulados"
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.96 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/exam?mode=prova')}
            className={`group relative rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent p-4 sm:p-5 lg:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-destructive/10 ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-destructive/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-0.5 sm:mb-1">SIMULADOS</h2>
            <p className="text-[10px] sm:text-xs font-medium text-destructive mb-1 sm:mb-2">Provas & Simulação</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              Questões no estilo residência com modo simulado
            </p>
            <div className="flex items-center gap-1 mt-3 sm:mt-4 text-destructive text-[11px] sm:text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Treinar'}
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        {/* ENAMED Section */}
        <div className="max-w-5xl mx-auto mt-3 sm:mt-5">
          <motion.button
            data-tour="enamed"
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.99 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/enamed')}
            className={`group relative w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-600/10 p-4 sm:p-5 lg:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden active:bg-amber-500/10 ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                Premium
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ring-1 ring-amber-500/20">
                <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">ESTUDO ENAMED</h2>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">2025/2026</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  Banco de questões oficiais + simulados por IA no padrão INEP
                </p>
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-5xl mx-auto mt-3 sm:mt-5">
          {/* PRECEPTORIA CHAT */}
          <motion.button
            data-tour="preceptoria"
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/ai-chat')}
            className="group relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex items-center gap-3 sm:gap-4 active:bg-primary/10"
          >
            {isFreeUser && (
              <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                GRÁTIS
              </div>
            )}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground">PRECEPTORMED</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {isFreeUser ? 'Chat com IA — 2 perguntas grátis/dia' : 'Chat livre com IA acadêmica'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>

          {/* BIBLIOTECA */}
          <motion.button
            data-tour="biblioteca"
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.98 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/library')}
            className={`group relative rounded-xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10 p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex items-center gap-3 sm:gap-4 active:bg-muted/30 ${isFreeUser ? 'opacity-70' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground">BIBLIOTECA</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Acesse seus conteúdos salvos</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        </div>

        {/* Legal Disclaimers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-8 sm:mt-14"
        >
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

        {/* Footer */}
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
