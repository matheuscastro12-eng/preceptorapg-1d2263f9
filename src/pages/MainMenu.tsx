import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, BookOpen, Brain, FlaskConical, GraduationCap, Library, Shield, AlertTriangle, Users, MessageCircle, Trophy } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  {
    id: 'estudo',
    title: 'ESTUDO COM IA',
    subtitle: 'Fechamentos & Seminários',
    description: 'Gere fechamentos de objetivos e seminários completos com IA acadêmica',
    icon: Brain,
    route: '/dashboard',
    accent: 'primary',
    size: 'large' as const,
  },
  {
    id: 'casos',
    title: 'CASOS CLÍNICOS IA',
    subtitle: 'Raciocínio Diagnóstico',
    description: 'Casos clínicos elaborados com base nos seus estudos',
    icon: FlaskConical,
    route: '/exam?mode=caso_clinico',
    accent: 'accent',
    size: 'medium' as const,
  },
  {
    id: 'simulados',
    title: 'GERADOR DE SIMULADOS IA',
    subtitle: 'Provas & Simulação',
    description: 'Questões no estilo residência com modo simulado interativo',
    icon: GraduationCap,
    route: '/exam?mode=prova',
    accent: 'destructive',
    size: 'medium' as const,
  },
  {
    id: 'biblioteca',
    title: 'BIBLIOTECA',
    subtitle: 'Seus Conteúdos',
    description: 'Acesse fechamentos e seminários salvos',
    icon: Library,
    route: '/library',
    accent: 'muted',
    size: 'small' as const,
  },
];

const accentMap: Record<string, string> = {
  primary: 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
  accent: 'from-accent/20 to-accent/5 border-accent/30 hover:border-accent/60 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)]',
  destructive: 'from-destructive/20 to-destructive/5 border-destructive/30 hover:border-destructive/60 hover:shadow-[0_0_30px_hsl(var(--destructive)/0.15)]',
  muted: 'from-muted/40 to-muted/10 border-border/40 hover:border-border/70',
};

const iconBgMap: Record<string, string> = {
  primary: 'bg-primary/20 text-primary',
  accent: 'bg-accent/20 text-accent',
  destructive: 'bg-destructive/20 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

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
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
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
        className="sticky top-0 z-50 border-b border-border/20 bg-background/90"
      >
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-gradient-medical">PreceptorAPG</span>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container relative py-6 sm:py-10 px-4">
        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">Menu Principal</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
            O que deseja <span className="text-gradient-medical">estudar</span> hoje?
          </h1>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {/* Estudo com IA */}
          <motion.button
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(menuItems[0].route)}
            className={`group relative col-span-1 sm:col-span-2 rounded-2xl border bg-gradient-to-br ${accentMap[menuItems[0].accent]} p-6 sm:p-8 text-left transition-colors duration-300 cursor-pointer overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl ${iconBgMap[menuItems[0].accent]} flex items-center justify-center mb-4`}>
              <Brain className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">{menuItems[0].title}</h2>
            <p className="text-xs sm:text-sm font-medium text-primary mb-2">{menuItems[0].subtitle}</p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{menuItems[0].description}</p>
          </motion.button>

          {/* Casos Clínicos */}
          <motion.button
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(menuItems[1].route)}
            className={`group relative rounded-2xl border bg-gradient-to-br ${accentMap[menuItems[1].accent]} p-5 sm:p-6 text-left transition-colors duration-300 cursor-pointer overflow-hidden`}
          >
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${iconBgMap[menuItems[1].accent]} flex items-center justify-center mb-3 sm:mb-4`}>
              <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">{menuItems[1].title}</h2>
            <p className="text-xs font-medium text-accent mb-1.5">{menuItems[1].subtitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{menuItems[1].description}</p>
          </motion.button>

          {/* Simulados */}
          <motion.button
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(menuItems[2].route)}
            className={`group relative rounded-2xl border bg-gradient-to-br ${accentMap[menuItems[2].accent]} p-5 sm:p-6 text-left transition-colors duration-300 cursor-pointer overflow-hidden`}
          >
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${iconBgMap[menuItems[2].accent]} flex items-center justify-center mb-3 sm:mb-4`}>
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">{menuItems[2].title}</h2>
            <p className="text-xs font-medium text-destructive mb-1.5">{menuItems[2].subtitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{menuItems[2].description}</p>
          </motion.button>

          {/* Biblioteca */}
          <motion.button
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(menuItems[3].route)}
            className={`group relative col-span-1 sm:col-span-2 lg:col-span-2 rounded-2xl border bg-gradient-to-br ${accentMap[menuItems[3].accent]} p-4 sm:p-5 text-left transition-colors duration-300 cursor-pointer flex items-center gap-4`}
          >
            <div className={`h-10 w-10 rounded-xl ${iconBgMap[menuItems[3].accent]} flex items-center justify-center shrink-0`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">{menuItems[3].title}</h2>
              <p className="text-xs text-muted-foreground">{menuItems[3].description}</p>
            </div>
          </motion.button>

          {/* Comunidade */}
          <motion.button
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/feed')}
            className="group relative col-span-1 sm:col-span-2 lg:col-span-2 rounded-2xl border bg-gradient-to-br from-primary/15 to-accent/10 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] p-4 sm:p-5 text-left transition-colors duration-300 cursor-pointer flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm sm:text-base font-bold text-foreground">COMUNIDADE</h2>
              <p className="text-xs text-muted-foreground">Feed, chat, ranking e interação entre estudantes</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}>
                <MessageCircle className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); navigate('/discover'); }}>
                <Trophy className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Legal Disclaimers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-5xl mx-auto mt-10 sm:mt-14 space-y-4"
        >
          <div className="flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-muted/30">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aviso Legal — Uso de Inteligência Artificial</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este aplicativo utiliza modelos de Inteligência Artificial generativa para fins exclusivamente educacionais e acadêmicos. 
                O conteúdo gerado <strong className="text-foreground/80">não substitui orientação médica profissional, diagnóstico ou tratamento</strong>. 
                Em conformidade com a <strong className="text-foreground/80">Lei nº 13.709/2018 (LGPD)</strong>, os dados fornecidos são tratados com sigilo e utilizados apenas para a geração do conteúdo solicitado.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive/70 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive/80 uppercase tracking-wider">Possibilidade de Erros</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conteúdos gerados por IA podem conter <strong className="text-foreground/80">imprecisões, erros factuais ou informações desatualizadas</strong>. 
                Conforme as diretrizes do <strong className="text-foreground/80">Conselho Federal de Medicina (CFM)</strong> e a <strong className="text-foreground/80">Resolução CFM nº 2.338/2023</strong> sobre IA na prática médica, 
                o usuário deve sempre validar as informações com fontes primárias (livros-texto, artigos científicos e protocolos institucionais) antes de qualquer aplicação clínica ou acadêmica.
                A responsabilidade pelo uso das informações é exclusivamente do usuário.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10">
          <p className="text-[10px] sm:text-xs text-muted-foreground/50">
            PreceptorAPG © {new Date().getFullYear()} — Ferramenta educacional. Uso acadêmico.
          </p>
        </div>
      </main>
    </PageTransition>
  );
};

export default MainMenu;
