import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  BookOpen, 
  Download, 
  ArrowRight,
  CheckCircle2,
  Brain,
  GraduationCap,
  FileText,
  Users,
  Shield,
  Play,
  ChevronRight
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const steps = [
    { 
      number: '01',
      title: 'Insira o tema', 
      description: 'Digite o tema central do seu estudo PBL ou os objetivos específicos que precisa fechar.' 
    },
    { 
      number: '02',
      title: 'IA elabora o conteúdo', 
      description: 'Em segundos, receba um fechamento estruturado com fisiopatologia, diagnóstico e tratamento.' 
    },
    { 
      number: '03',
      title: 'Estude e pratique', 
      description: 'Salve na biblioteca, gere questões de prova ou casos clínicos baseados no conteúdo.' 
    },
  ];

  const features = [
    { 
      icon: FileText, 
      title: 'Fechamentos estruturados', 
      description: 'Conteúdo organizado em tópicos claros: definição, epidemiologia, fisiopatologia, quadro clínico, diagnóstico e tratamento.' 
    },
    { 
      icon: GraduationCap, 
      title: 'Simulados de residência', 
      description: 'Gere questões objetivas no estilo das principais bancas, com gabarito comentado.' 
    },
    { 
      icon: Brain, 
      title: 'Casos clínicos integrativos', 
      description: 'Pratique raciocínio clínico com casos elaborados a partir dos seus fechamentos.' 
    },
    { 
      icon: BookOpen, 
      title: 'Biblioteca pessoal', 
      description: 'Todos os seus estudos organizados em um só lugar, acessíveis a qualquer momento.' 
    },
    { 
      icon: Download, 
      title: 'Exportação em PDF', 
      description: 'Baixe seus fechamentos formatados para impressão ou compartilhamento.' 
    },
    { 
      icon: Shield, 
      title: 'Conteúdo acadêmico', 
      description: 'IA treinada especificamente para metodologia PBL/ABP em medicina.' 
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">PreceptorMED</span>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/menu')}>
                Meu Painel
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/pricing')}>
                Começar
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
          
          <div className="container px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-sm font-medium text-primary mb-4">
                  Para estudantes de medicina
                </p>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                  Fechamentos de PBL
                  <span className="block text-muted-foreground font-normal mt-1">
                    em minutos, não horas
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                  Automatize a etapa mais trabalhosa do ciclo PBL. 
                  Gere conteúdo estruturado, pratique com questões e organize seus estudos.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/pricing')}
                    className="w-full sm:w-auto"
                  >
                    Começar gratuitamente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Ver demonstração
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 border-t border-border/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
                Como funciona
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
                Três passos simples para transformar sua forma de estudar
              </p>

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex gap-4 sm:gap-6"
                  >
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{step.number}</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-16 sm:py-24 bg-muted/30 border-t border-border/30">
          <div className="container px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Tudo para seu estudo em um só lugar
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
              Ferramentas desenvolvidas especificamente para a rotina do estudante de medicina
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-background rounded-xl p-6 border border-border/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16 sm:py-24 border-t border-border/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Usado por estudantes de medicina</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Otimize seu tempo de estudo
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Enquanto outros passam horas organizando fechamentos, você pode focar no que realmente importa: entender o conteúdo.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                <div className="p-4 rounded-lg bg-muted/40">
                  <p className="text-2xl font-bold text-primary mb-1">2h → 5min</p>
                  <p className="text-sm text-muted-foreground">Tempo médio de fechamento</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40">
                  <p className="text-2xl font-bold text-primary mb-1">100%</p>
                  <p className="text-sm text-muted-foreground">Estrutura padronizada</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40">
                  <p className="text-2xl font-bold text-primary mb-1">∞</p>
                  <p className="text-sm text-muted-foreground">Fechamentos e questões</p>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={() => navigate('/pricing')}
              >
                Começar agora
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 bg-primary/5 border-t border-border/30">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Pronto para estudar de forma mais inteligente?
              </h2>
              <p className="text-muted-foreground mb-8">
                Junte-se a estudantes que já otimizaram sua rotina de estudos com o PreceptorMED.
              </p>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto"
                >
                  Ver planos e preços
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Cancele quando quiser
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Suporte por email
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 bg-background">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">PreceptorIA</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PreceptorIA. Uso educacional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
