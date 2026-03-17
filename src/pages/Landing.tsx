import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import logoIcon from '@/assets/logo-icon.png';
import { 
  BookOpen, 
  Download, 
  ArrowRight,
  CheckCircle2,
  Brain,
  GraduationCap,
  FileText,
  Shield,
  ChevronRight,
  Mail,
  Instagram,
  Clock,
  Zap,
  Infinity,
  MessageSquare,
  Stethoscope,
  ClipboardList,
  Quote,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const features = [
    { icon: FileText, title: 'Resumos Estruturados', description: 'Conteúdo organizado: definição, epidemiologia, fisiopatologia, quadro clínico, diagnóstico e tratamento.' },
    { icon: GraduationCap, title: 'Simulados de Residência', description: 'Questões objetivas no estilo das principais bancas, com gabarito comentado e explicações detalhadas.' },
    { icon: Stethoscope, title: 'Casos Clínicos', description: 'Pratique raciocínio diagnóstico com casos elaborados a partir dos seus estudos anteriores.' },
    { icon: MessageSquare, title: 'Chat Acadêmico com IA', description: 'Tire dúvidas em tempo real com um preceptor virtual que domina toda a base curricular.' },
    { icon: BookOpen, title: 'Biblioteca Pessoal', description: 'Todos os seus estudos organizados, acessíveis a qualquer momento, com busca e favoritos.' },
    { icon: Download, title: 'Exportação em PDF', description: 'Baixe seus resumos formatados profissionalmente para impressão ou compartilhamento.' },
  ];

  const testimonials = [
    { name: 'Estudante de Medicina', university: '6º período', text: 'O PreceptorMED reduziu meu tempo de estudo de 2 horas para menos de 10 minutos. A qualidade é impressionante.' },
    { name: 'Estudante de Medicina', university: '4º período', text: 'Os casos clínicos gerados a partir dos meus resumos são muito realistas. Me ajudou muito na preparação para as provas práticas.' },
    { name: 'Estudante de Medicina', university: '8º período', text: 'O chat acadêmico é como ter um preceptor disponível 24h. As respostas são profundas e sempre com referências confiáveis.' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-8 w-8" />
            <span className="text-base sm:text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preceptor<span className="text-primary">MED</span>
            </span>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="text-xs sm:text-sm">
                Meu Painel
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground text-xs sm:text-sm">
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/auth?tab=signup')} className="text-xs sm:text-sm">
                Criar conta
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 mb-6">
                <span className="text-[11px] sm:text-xs font-medium text-primary">Plataforma de Estudo com IA</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5">
                Seus resumos médicos
                <br />
                <span className="text-primary">em minutos, não horas</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                Gere resumos estruturados, pratique com simulados e domine o conteúdo 
                com inteligência artificial acadêmica.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?tab=signup')}
                  className="w-full sm:w-auto px-8 h-12 text-sm sm:text-base"
                >
                  Começar grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto px-8 h-12 text-sm sm:text-base"
                >
                  Ver planos
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> 2 perguntas grátis/dia
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> Cancele quando quiser
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border/30 bg-muted/15">
          <div className="container px-4 sm:px-6">
            <div className="grid grid-cols-3 divide-x divide-border/30">
              {[
                { icon: Clock, value: '2h → 5min', label: 'Tempo de resumo' },
                { icon: ClipboardList, value: '100%', label: 'Estrutura padronizada' },
                { icon: Infinity, value: 'Ilimitado', label: 'Resumos e questões' },
              ].map((stat, i) => (
                <div key={i} className="py-6 sm:py-10 text-center px-2">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm sm:text-xl font-bold text-foreground mb-0.5">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">Como funciona</p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Três passos simples
                </h2>
              </div>

              <div className="space-y-8 sm:space-y-10">
                {[
                  { number: '01', icon: Brain, title: 'Insira o tema', description: 'Digite o assunto ou os objetivos de estudo. Use sugestões ou escreva livremente.' },
                  { number: '02', icon: Zap, title: 'A IA gera o conteúdo', description: 'Em segundos, receba um resumo estruturado com fisiopatologia, diagnóstico, tratamento e mais.' },
                  { number: '03', icon: GraduationCap, title: 'Estude e pratique', description: 'Salve na biblioteca, gere simulados, tire dúvidas no chat e exporte em PDF.' },
                ].map((step, index) => (
                  <div key={index} className="flex gap-5 sm:gap-8">
                    <div className="shrink-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] font-semibold text-primary/50 uppercase tracking-widest">Passo {step.number}</p>
                      <h3 className="font-bold text-base sm:text-lg mt-0.5 mb-1.5">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24 bg-muted/15 border-y border-border/20">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">Recursos</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                Tudo para seu estudo em um só lugar
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Ferramentas desenvolvidas para a rotina do estudante de medicina
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-background rounded-xl p-4 sm:p-5 border border-border/40 hover:border-primary/20 transition-colors"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-3">
                    <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">Depoimentos</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                O que dizem nossos usuários
              </h2>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:max-w-4xl sm:mx-auto">
              <div className="flex sm:contents gap-4 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {testimonials.map((t, index) => (
                  <div
                    key={index}
                    className="bg-muted/20 rounded-xl p-5 border border-border/30 flex flex-col min-w-[270px] sm:min-w-0 snap-center"
                  >
                    <Quote className="h-6 w-6 text-primary/15 mb-3" />
                    <p className="text-sm text-foreground leading-relaxed flex-1 mb-3">
                      "{t.text}"
                    </p>
                    <div className="pt-3 border-t border-border/20">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.university}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 bg-muted/10">
          <div className="container px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center">
              <img src={logoIcon} alt="PreceptorMED" className="h-11 w-11 mx-auto mb-5" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Pronto para estudar de forma
                <br />
                <span className="text-primary">mais inteligente?</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-7 max-w-md mx-auto">
                Junte-se a estudantes que já otimizaram sua rotina de estudos com o PreceptorMED.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?tab=signup')}
                  className="w-full sm:w-auto px-8 h-12 text-sm sm:text-base"
                >
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto px-8 h-12 text-sm sm:text-base"
                >
                  Ver planos e preços
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Cancele quando quiser
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Suporte por email
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Dados protegidos
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-muted/5">
        <div className="container px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <img src={logoIcon} alt="PreceptorMED" className="h-8 w-8" />
                <span className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Preceptor<span className="text-primary">MED</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Plataforma para estudantes de medicina. Resumos, casos clínicos e simulados potencializados por IA.
              </p>
              <a
                href="https://instagram.com/preceptor.med"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </div>

            <div>
              <h4 className="font-semibold text-xs sm:text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">Preços</button></li>
                <li><button onClick={() => navigate('/auth?tab=signup')} className="hover:text-foreground transition-colors">Criar Conta</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Entrar</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs sm:text-sm mb-3">Contato</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href="mailto:preceptormed@gmail.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="break-all">preceptormed@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Instagram className="h-3 w-3 shrink-0" />
                    @preceptor.med
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border/15">
          <div className="container px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              © {new Date().getFullYear()} PreceptorMED. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Ferramenta educacional. Não substitui orientação médica profissional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
