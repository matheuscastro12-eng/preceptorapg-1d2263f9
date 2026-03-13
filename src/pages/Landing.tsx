import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { motion } from 'framer-motion';
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
  Sparkles,
  Quote,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const features = [
    { 
      icon: FileText, 
      title: 'Fechamentos Estruturados', 
      description: 'Conteúdo organizado: definição, epidemiologia, fisiopatologia, quadro clínico, diagnóstico e tratamento.',
      gradient: 'from-primary/20 to-primary/5',
    },
    { 
      icon: GraduationCap, 
      title: 'Simulados de Residência', 
      description: 'Questões objetivas no estilo das principais bancas, com gabarito comentado e explicações detalhadas.',
      gradient: 'from-accent/20 to-accent/5',
    },
    { 
      icon: Stethoscope, 
      title: 'Casos Clínicos', 
      description: 'Pratique raciocínio diagnóstico com casos elaborados a partir dos seus estudos anteriores.',
      gradient: 'from-primary/20 to-primary/5',
    },
    { 
      icon: MessageSquare, 
      title: 'Chat Acadêmico com IA', 
      description: 'Tire dúvidas em tempo real com um preceptor virtual que domina toda a base curricular.',
      gradient: 'from-accent/20 to-accent/5',
    },
    { 
      icon: BookOpen, 
      title: 'Biblioteca Pessoal', 
      description: 'Todos os seus estudos organizados, acessíveis a qualquer momento, com busca e favoritos.',
      gradient: 'from-primary/20 to-primary/5',
    },
    { 
      icon: Download, 
      title: 'Exportação em PDF', 
      description: 'Baixe seus fechamentos formatados profissionalmente para impressão ou compartilhamento.',
      gradient: 'from-accent/20 to-accent/5',
    },
  ];

  const testimonials = [
    {
      name: 'Estudante de Medicina',
      university: '6º período',
      text: 'O PreceptorMED reduziu meu tempo de fechamento de 2 horas para menos de 10 minutos. A qualidade é impressionante.',
    },
    {
      name: 'Estudante de Medicina',
      university: '4º período',
      text: 'Os casos clínicos gerados a partir dos meus fechamentos são muito realistas. Me ajudou muito na preparação para as provas práticas.',
    },
    {
      name: 'Estudante de Medicina',
      university: '8º período',
      text: 'O chat acadêmico é como ter um preceptor disponível 24h. As respostas são profundas e sempre com referências confiáveis.',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="PreceptorMED" className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preceptor<span className="text-primary">MED</span>
            </span>
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground">
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/auth?tab=signup')} className="rounded-full px-5">
                Criar conta grátis
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-3xl" />
          </div>

          <div className="container px-4 sm:px-6 relative">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary tracking-wide uppercase">Plataforma de Estudo com IA</span>
                </div>

                {/* Logo hero */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-8"
                >
                  <img src={logoIcon} alt="PreceptorMED" className="h-20 sm:h-24 w-auto mx-auto" />
                </motion.div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                  Seus fechamentos de PBL
                  <br />
                  <span className="text-primary">em minutos, não horas</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                  A plataforma que automatiza a etapa mais trabalhosa do ciclo PBL. 
                  Gere conteúdo estruturado, pratique com simulados e domine o conteúdo.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth?tab=signup')}
                    className="w-full sm:w-auto rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                  >
                    Começar grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                    className="w-full sm:w-auto rounded-full px-8 h-12 text-base"
                  >
                    Ver planos
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    2 perguntas grátis/dia
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Sem cartão de crédito
                  </span>
                  <span className="flex items-center gap-1.5 hidden sm:flex">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Cancele quando quiser
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border/30 bg-muted/20">
          <div className="container px-4 sm:px-6">
            <div className="grid grid-cols-3 divide-x divide-border/30">
              {[
                { icon: Clock, value: '2h → 5min', label: 'Tempo de fechamento' },
                { icon: ClipboardList, value: '100%', label: 'Estrutura padronizada' },
                { icon: Infinity, value: 'Ilimitado', label: 'Fechamentos e questões' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="py-8 sm:py-10 text-center px-2"
                >
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-28">
          <div className="container px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Como funciona</span>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Três passos para transformar seus estudos
                </h2>
              </motion.div>

              <div className="relative">
                {/* Connecting line */}
                <div className="hidden sm:block absolute left-[28px] top-8 bottom-8 w-px bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />

                <div className="space-y-12">
                  {[
                    { 
                      number: '01',
                      icon: Brain,
                      title: 'Insira o tema do estudo', 
                      description: 'Digite o tema central do seu PBL ou os objetivos específicos. Use os chips de sugestão ou escreva livremente.' 
                    },
                    { 
                      number: '02',
                      icon: Zap,
                      title: 'A IA elabora o conteúdo', 
                      description: 'Em segundos, receba um fechamento estruturado e completo com fisiopatologia, diagnóstico, tratamento e mais.' 
                    },
                    { 
                      number: '03',
                      icon: GraduationCap,
                      title: 'Estude, pratique e domine', 
                      description: 'Salve na biblioteca, gere simulados, tire dúvidas no chat e exporte tudo em PDF.' 
                    },
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      custom={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="flex gap-5 sm:gap-8"
                    >
                      <div className="shrink-0 relative">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <step.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-primary/60 uppercase tracking-widest">Passo {step.number}</span>
                        <h3 className="font-bold text-xl mt-1 mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-lg">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-20 sm:py-28 bg-muted/20 border-y border-border/20">
          <div className="container px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Recursos</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Tudo para seu estudo em um só lugar
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Ferramentas desenvolvidas especificamente para a rotina do estudante de medicina em PBL
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group bg-background rounded-2xl p-6 border border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-28">
          <div className="container px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Depoimentos</span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                O que dizem nossos usuários
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-muted/30 rounded-2xl p-6 border border-border/30 flex flex-col"
                >
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-sm text-foreground leading-relaxed flex-1 mb-4">
                    "{t.text}"
                  </p>
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.university}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.04] pointer-events-none" />
          <div className="container px-4 sm:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <img src={logoIcon} alt="PreceptorMED" className="h-14 w-14 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Pronto para estudar de forma
                <br />
                <span className="text-primary">mais inteligente?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                Junte-se a estudantes que já otimizaram sua rotina de estudos com o PreceptorMED.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?tab=signup')}
                  className="w-full sm:w-auto rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20"
                >
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto rounded-full px-8 h-12 text-base"
                >
                  Ver planos e preços
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Cancele quando quiser
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Suporte por email
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Dados protegidos
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-muted/10">
        <div className="container px-4 sm:px-6 py-14 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src={logoIcon} alt="PreceptorMED" className="h-9 w-9" />
                <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Preceptor<span className="text-primary">MED</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Plataforma premium para estudantes de medicina em PBL. 
                Fechamentos, casos clínicos e simulados potencializados por IA.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://instagram.com/preceptor.med"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Produto</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">Preços</button></li>
                <li><button onClick={() => navigate('/auth?tab=signup')} className="hover:text-foreground transition-colors">Criar Conta</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Entrar</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Contato</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:preceptormed@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    preceptormed@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Instagram className="h-3.5 w-3.5" />
                    @preceptor.med
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20">
          <div className="container px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
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
