import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { 
  Stethoscope, 
  Sparkles, 
  BookOpen, 
  Download, 
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  GraduationCap
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const features = [
    { 
      icon: Brain, 
      title: 'IA Especializada', 
      description: 'Inteligência artificial treinada para metodologia PBL/APG em medicina' 
    },
    { 
      icon: Sparkles, 
      title: 'Fechamentos Automáticos', 
      description: 'Gere fechamentos completos e estruturados em segundos' 
    },
    { 
      icon: BookOpen, 
      title: 'Biblioteca Pessoal', 
      description: 'Salve e organize seus estudos para consulta futura' 
    },
    { 
      icon: Download, 
      title: 'Exportação PDF', 
      description: 'Baixe seus fechamentos em formato profissional' 
    },
  ];

  const benefits = [
    'Economize horas de pesquisa e organização',
    'Conteúdo baseado em evidências científicas',
    'Estrutura padronizada para apresentações',
    'Acesso ilimitado a todas as funcionalidades',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 glass-strong">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg" />
              <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-gradient-medical">
                PreceptorAPG
              </span>
              <p className="text-xs text-muted-foreground">Fechamentos com IA</p>
            </div>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/menu')}>
                Meu Painel
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/pricing')}>
                Ver Planos
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative">
        <section className="container px-4 py-10 sm:py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Para estudantes de Medicina</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-gradient-medical">Fechamentos de PBL</span>
              <br />
              <span className="text-foreground">com Inteligência Artificial</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              O PreceptorAPG automatiza a etapa mais densa do ciclo de aprendizagem PBL/APG: 
              o fechamento de objetivos. Gere conteúdo estruturado e baseado em evidências em segundos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Button 
                size="lg" 
                className="glow-medical text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
                onClick={() => navigate('/pricing')}
              >
                <Zap className="mr-2 h-5 w-5" />
                Ver Planos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container px-4 py-10 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
              Tudo que você precisa para seus estudos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="glass rounded-2xl p-5 sm:p-6 border border-border/50 hover-lift"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container px-4 py-10 sm:py-16">
          <div className="max-w-3xl mx-auto glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-primary/20">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                Por que escolher o PreceptorAPG?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Junte-se a estudantes de medicina que já otimizaram seus estudos
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-background/50">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Button 
                size="lg" 
                className="glow-medical w-full sm:w-auto"
                onClick={() => navigate('/pricing')}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-10 sm:py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-6">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Pare de perder tempo com fechamentos manuais
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comece agora e veja como a IA pode transformar sua forma de estudar medicina.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto"
            >
              Ver Planos e Preços
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold">PreceptorAPG</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PreceptorAPG. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
