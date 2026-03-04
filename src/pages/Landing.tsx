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
  Brain,
  GraduationCap
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const features = [
    { icon: Brain, title: 'IA Especializada', description: 'Inteligência artificial treinada para metodologia PBL/APG em medicina' },
    { icon: Sparkles, title: 'Fechamentos Automáticos', description: 'Gere fechamentos completos e estruturados em segundos' },
    { icon: BookOpen, title: 'Biblioteca Pessoal', description: 'Salve e organize seus estudos para consulta futura' },
    { icon: Download, title: 'Exportação PDF', description: 'Baixe seus fechamentos em formato profissional' },
  ];

  const benefits = [
    'Economize horas de pesquisa e organização',
    'Conteúdo baseado em evidências científicas',
    'Estrutura padronizada para apresentações',
    'Acesso ilimitado a todas as funcionalidades',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-primary" />
            <div>
              <span className="text-lg font-semibold text-foreground">PreceptorAPG</span>
              <p className="text-xs text-muted-foreground">Fechamentos com IA</p>
            </div>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/menu')}>
                Meu Painel
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/pricing')}>
                Ver Planos
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>Para estudantes de Medicina</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Fechamentos de PBL
              <br />
              <span className="text-primary">com Inteligência Artificial</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              O PreceptorAPG automatiza a etapa mais densa do ciclo PBL/APG: 
              o fechamento de objetivos. Conteúdo estruturado e baseado em evidências.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" onClick={() => navigate('/pricing')}>
                Ver Planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container px-4 py-16 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12">
              Tudo que você precisa para seus estudos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="p-5 rounded-lg border border-border bg-card">
                  <feature.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-medium text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="container px-4 py-16 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-lg border border-border bg-card">
              <h2 className="text-2xl font-semibold text-center mb-2">
                Por que escolher o PreceptorAPG?
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Junte-se a estudantes de medicina que já otimizaram seus estudos
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Button onClick={() => navigate('/pricing')}>
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container px-4 py-16 border-t border-border">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <Clock className="h-8 w-8 text-primary mx-auto" />
            <h2 className="text-2xl font-semibold">
              Pare de perder tempo com fechamentos manuais
            </h2>
            <p className="text-muted-foreground">
              Comece agora e veja como a IA pode transformar sua forma de estudar medicina.
            </p>
            <Button onClick={() => navigate('/pricing')}>
              Ver Planos e Preços
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">PreceptorAPG</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PreceptorAPG. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
