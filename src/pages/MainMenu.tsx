import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, BookOpen, Brain, FlaskConical, GraduationCap, Shield, AlertTriangle } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  {
    id: 'estudo',
    title: 'Estudo com IA',
    subtitle: 'Fechamentos & Seminários',
    description: 'Gere fechamentos de objetivos e seminários completos com IA acadêmica',
    icon: Brain,
    route: '/dashboard',
    span: 'sm:col-span-2',
  },
  {
    id: 'casos',
    title: 'Casos Clínicos',
    subtitle: 'Raciocínio Diagnóstico',
    description: 'Casos clínicos elaborados com base nos seus estudos',
    icon: FlaskConical,
    route: '/exam?mode=caso_clinico',
    span: '',
  },
  {
    id: 'simulados',
    title: 'Simulados',
    subtitle: 'Provas & Simulação',
    description: 'Questões no estilo residência com modo simulado interativo',
    icon: GraduationCap,
    route: '/exam?mode=prova',
    span: '',
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca',
    subtitle: 'Seus Conteúdos',
    description: 'Acesse fechamentos e seminários salvos',
    icon: BookOpen,
    route: '/library',
    span: 'sm:col-span-2 lg:col-span-4',
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
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">PreceptorAPG</span>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container py-8 sm:py-14 px-4">
        {/* Title */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Menu Principal</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            O que deseja estudar hoje?
          </h1>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`group relative rounded-lg border border-border bg-card p-5 sm:p-6 text-left transition-colors hover:border-primary/40 cursor-pointer ${item.span} ${item.id === 'biblioteca' ? 'flex items-center gap-4' : ''}`}
            >
              <item.icon className={`h-5 w-5 text-primary ${item.id === 'biblioteca' ? 'shrink-0' : 'mb-3'}`} />
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-0.5">{item.title}</h2>
                <p className="text-xs text-primary mb-1">{item.subtitle}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Disclaimers */}
        <div className="max-w-4xl mx-auto mt-12 space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Aviso Legal — Uso de IA</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este aplicativo utiliza IA generativa para fins educacionais. O conteúdo <strong className="text-foreground/80">não substitui orientação médica profissional</strong>. 
                Em conformidade com a <strong className="text-foreground/80">LGPD</strong>, os dados são tratados com sigilo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/20 bg-card">
            <AlertTriangle className="h-4 w-4 text-destructive/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive/70 mb-1">Possibilidade de Erros</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conteúdos gerados por IA podem conter <strong className="text-foreground/80">imprecisões</strong>. 
                Valide com fontes primárias antes de qualquer aplicação clínica ou acadêmica.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] text-muted-foreground/50">
            PreceptorAPG © {new Date().getFullYear()} — Ferramenta educacional
          </p>
        </div>
      </main>
    </PageTransition>
  );
};

export default MainMenu;
