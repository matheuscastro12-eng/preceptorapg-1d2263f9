import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, BookOpen, Brain, FlaskConical, GraduationCap, Library, Shield, AlertTriangle, MessageSquare, ChevronRight, Zap, Lock, Crown } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
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
  // Non-subscribers can now access the menu (for demo), but features will show locks
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-2xl"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-xl"
      >
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-1 ring-primary/20">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold text-gradient-medical">PreceptorMED</span>
              <p className="text-[10px] text-muted-foreground hidden sm:block">Sua plataforma de estudos</p>
            </div>
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
          <div className="container px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground">Modo Demonstração</span> — Experimente o chat grátis! Assine para desbloquear tudo.
              </p>
            </div>
            <Button size="sm" className="shrink-0 h-7 text-xs gap-1" onClick={() => navigate('/pricing')}>
              Ver Planos
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 container relative py-6 sm:py-10 px-4">
        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Menu Principal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
            O que deseja <span className="text-gradient-medical">estudar</span> hoje?
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {isFreeUser ? 'Experimente o chat acadêmico grátis ou assine para acesso completo' : 'Escolha uma das opções abaixo para começar sua jornada de aprendizado'}
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          
          {/* ESTUDO COM IA - Hero Card */}
          <motion.button
            data-tour="estudo"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/dashboard')}
            className={`group relative lg:col-span-2 lg:row-span-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 text-left transition-all duration-300 cursor-pointer overflow-hidden hover:border-primary/50 hover:shadow-[0_0_40px_hsl(var(--primary)/0.15)] ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {/* Lock overlay for free users */}
            {isFreeUser && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                Premium
              </div>
            )}
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full pointer-events-none" />
            
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4">
              <Zap className="h-3 w-3" />
              Principal
            </div>

            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">ESTUDO COM IA</h2>
            <p className="text-sm font-medium text-primary mb-3">Fechamentos & Seminários</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Gere fechamentos de objetivos e seminários completos com IA acadêmica. 
              A ferramenta perfeita para seu estudo dirigido em PBL/ABP.
            </p>

            <div className="flex items-center gap-2 mt-6 text-primary text-sm font-medium">
              {isFreeUser ? 'Desbloquear' : 'Começar agora'}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* CASOS CLÍNICOS */}
          <motion.button
            data-tour="casos"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/exam?mode=caso_clinico')}
            className={`group relative rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)] ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FlaskConical className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">CASOS CLÍNICOS</h2>
            <p className="text-xs font-medium text-accent mb-2">Raciocínio Diagnóstico</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Casos clínicos elaborados com base nos seus estudos anteriores
            </p>
            <div className="flex items-center gap-1 mt-4 text-accent text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Praticar'}
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* SIMULADOS */}
          <motion.button
            data-tour="simulados"
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/exam?mode=prova')}
            className={`group relative rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer overflow-hidden hover:border-destructive/50 hover:shadow-[0_0_30px_hsl(var(--destructive)/0.15)] ${isFreeUser ? 'opacity-80' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">SIMULADOS</h2>
            <p className="text-xs font-medium text-destructive mb-2">Provas & Simulação</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Questões no estilo residência com modo simulado interativo
            </p>
            <div className="flex items-center gap-1 mt-4 text-destructive text-xs font-medium">
              {isFreeUser ? 'Desbloquear' : 'Treinar'}
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-5xl mx-auto mt-5">
          {/* PRECEPTORIA CHAT - Always accessible */}
          <motion.button
            data-tour="preceptoria"
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/ai-chat')}
            className="group relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-4 text-left transition-all duration-300 cursor-pointer flex items-center gap-4 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
          >
            {isFreeUser && (
              <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                GRÁTIS
              </div>
            )}
            <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground">PRECEPTORMED</h2>
              <p className="text-xs text-muted-foreground truncate">
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
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => isFreeUser ? navigate('/pricing') : navigate('/library')}
            className={`group relative rounded-xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10 p-4 text-left transition-all duration-300 cursor-pointer flex items-center gap-4 hover:border-border/70 hover:bg-muted/30 ${isFreeUser ? 'opacity-70' : ''}`}
          >
            {isFreeUser && (
              <div className="absolute top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 border border-border/50 text-[10px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground">BIBLIOTECA</h2>
              <p className="text-xs text-muted-foreground truncate">Acesse seus conteúdos salvos</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        </div>

        {/* Legal Disclaimers - Collapsible style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-10 sm:mt-14"
        >
          <details className="group rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avisos Legais — Uso de IA</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este aplicativo utiliza modelos de Inteligência Artificial generativa para fins exclusivamente educacionais e acadêmicos. 
                  O conteúdo gerado <strong className="text-foreground/80">não substitui orientação médica profissional, diagnóstico ou tratamento</strong>. 
                  Em conformidade com a <strong className="text-foreground/80">Lei nº 13.709/2018 (LGPD)</strong>, os dados fornecidos são tratados com sigilo.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conteúdos gerados por IA podem conter <strong className="text-foreground/80">imprecisões ou informações desatualizadas</strong>. 
                  Conforme a <strong className="text-foreground/80">Resolução CFM nº 2.338/2023</strong>, 
                  valide sempre com fontes primárias antes de qualquer aplicação clínica ou acadêmica.
                </p>
              </div>
            </div>
          </details>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10">
          <p className="text-[10px] sm:text-xs text-muted-foreground/50">
            PreceptorMED © {new Date().getFullYear()} — Ferramenta educacional. Uso acadêmico.
          </p>
        </div>
      </main>
    </PageTransition>
  );
};

export default MainMenu;
