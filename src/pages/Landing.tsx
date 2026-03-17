import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProfileDropdown from '@/components/ProfileDropdown';
import PixPaymentModal from '@/components/PixPaymentModal';
import logoIcon from '@/assets/logo-icon.png';
import {
  BookOpen,
  Download,
  ArrowRight,
  Check,
  Brain,
  GraduationCap,
  FileText,
  Shield,
  Mail,
  Instagram,
  Clock,
  Zap,
  MessageSquare,
  Stethoscope,
  Loader2,
  QrCode,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState(false);

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      navigate(`/auth?plan=${planType}`);
      return;
    }
    setLoadingPlan(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível iniciar o checkout.', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    { icon: FileText, title: 'Resumos Estruturados', desc: 'Definição, epidemiologia, fisiopatologia, diagnóstico e tratamento — tudo organizado.' },
    { icon: GraduationCap, title: 'Simulados de Residência', desc: 'Questões no estilo das bancas com gabarito comentado.' },
    { icon: Stethoscope, title: 'Casos Clínicos', desc: 'Raciocínio diagnóstico com casos elaborados dos seus estudos.' },
    { icon: MessageSquare, title: 'Chat Acadêmico', desc: 'Preceptor virtual 24h para tirar dúvidas em tempo real.' },
    { icon: BookOpen, title: 'Biblioteca Pessoal', desc: 'Todos os seus materiais organizados com busca e favoritos.' },
    { icon: Download, title: 'Exportação PDF', desc: 'Resumos formatados para impressão ou compartilhamento.' },
  ];

  const steps = [
    { num: '1', icon: Brain, title: 'Insira o tema', desc: 'Digite o assunto ou objetivos de estudo.' },
    { num: '2', icon: Zap, title: 'IA gera o conteúdo', desc: 'Resumo completo em segundos.' },
    { num: '3', icon: GraduationCap, title: 'Estude e pratique', desc: 'Simulados, chat, PDF — tudo integrado.' },
  ];

  const allBenefits = [
    'Resumos ilimitados com IA',
    'Simulados estilo residência',
    'Chat acadêmico sem limites',
    'Biblioteca pessoal completa',
    'Exportação em PDF',
    'Casos clínicos inteligentes',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preceptor<span className="text-primary">MED</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
          </nav>

          {!loading && user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="text-sm">
                Meu Painel
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-sm text-muted-foreground">
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/auth?tab=signup')} className="text-sm">
                Criar conta
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />

          <div className="container relative px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
                Estude medicina com
                <span className="text-primary"> precisão cirúrgica</span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
                Resumos estruturados, simulados e casos clínicos gerados por IA acadêmica. De 2 horas para 5 minutos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" onClick={() => navigate('/auth?tab=signup')} className="w-full sm:w-auto px-8 h-12 gap-2">
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => {
                  document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' });
                }} className="w-full sm:w-auto px-8 h-12">
                  Ver preços
                </Button>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                Sem cartão de crédito · 2 perguntas grátis por dia · Cancele quando quiser
              </p>
            </div>
          </div>
        </section>

        {/* ─── Metrics ─── */}
        <section className="border-y border-border/30">
          <div className="container px-4 sm:px-6">
            <div className="grid grid-cols-3 divide-x divide-border/30">
              {[
                { value: '2h → 5min', label: 'Tempo de resumo' },
                { value: '100%', label: 'Estrutura padronizada' },
                { value: '∞', label: 'Resumos e simulados' },
              ].map((s, i) => (
                <div key={i} className="py-8 sm:py-10 text-center">
                  <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="como-funciona" className="py-20 sm:py-28">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 text-center">Como funciona</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-center mb-14">
                Três passos. Resultado imediato.
              </h2>

              <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
                {steps.map((step) => (
                  <div key={step.num} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-1">Passo {step.num}</p>
                    <h3 className="font-bold text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="recursos" className="py-20 sm:py-28 bg-muted/10 border-y border-border/20">
          <div className="container px-4 sm:px-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 text-center">Recursos</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-center mb-4">
              Tudo que você precisa para estudar
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mx-auto mb-14">
              Ferramentas feitas para a rotina do estudante de medicina.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {features.map((f, i) => (
                <div key={i} className="bg-background rounded-xl p-5 border border-border/40 hover:border-primary/25 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="precos" className="py-20 sm:py-28">
          <div className="container px-4 sm:px-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 text-center">Planos</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-center mb-3">
              Escolha seu plano
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mx-auto mb-12">
              Acesso completo a todas as ferramentas. Cancele quando quiser.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
              {/* Monthly */}
              <div className="rounded-xl border border-border/50 bg-background p-6">
                <h3 className="font-semibold text-lg mb-0.5">Mensal</h3>
                <p className="text-xs text-muted-foreground mb-5">Perfeito para começar</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold">R$ 39,90</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <ul className="space-y-2.5 mb-6 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Acesso completo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Cancele quando quiser</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Suporte por email</li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleSubscribe('monthly')} disabled={loadingPlan !== null}>
                  {loadingPlan === 'monthly' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assinar Mensal
                </Button>
                <Button variant="ghost" className="w-full mt-2 gap-2 text-xs" onClick={() => setPixModal(true)}>
                  <QrCode className="h-3.5 w-3.5" /> Pagar com Pix
                </Button>
              </div>

              {/* Annual */}
              <div className="rounded-xl border-2 border-primary/40 bg-background p-6 relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  MELHOR PREÇO
                </div>
                <h3 className="font-semibold text-lg mb-0.5">Anual</h3>
                <p className="text-xs text-muted-foreground mb-5">Economize quase 2 meses</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold">R$ 299</span>
                  <span className="text-muted-foreground text-sm">/ano</span>
                </div>
                <ul className="space-y-2.5 mb-6 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Acesso completo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Equivale a R$ 24,92/mês</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Suporte prioritário</li>
                </ul>
                <Button className="w-full" onClick={() => handleSubscribe('annual')} disabled={loadingPlan !== null}>
                  {loadingPlan === 'annual' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assinar Anual
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-center mb-4">O que está incluso</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allBenefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 text-xs">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {b}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Pagamento seguro</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Cancele a qualquer momento</span>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-20 sm:py-28 bg-muted/10 border-t border-border/20">
          <div className="container px-4 sm:px-6">
            <div className="max-w-lg mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Pronto para estudar de forma <span className="text-primary">mais inteligente?</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-7">
                Junte-se a estudantes que já otimizaram sua rotina com o PreceptorMED.
              </p>
              <Button size="lg" onClick={() => navigate('/auth?tab=signup')} className="px-8 h-12 gap-2">
                Criar conta grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/20">
        <div className="container px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <img src={logoIcon} alt="PreceptorMED" className="h-7 w-7" />
                <span className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Preceptor<span className="text-primary">MED</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Resumos, casos clínicos e simulados potencializados por IA acadêmica.
              </p>
              <a href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </div>

            <div>
              <h4 className="font-semibold text-xs mb-3">Produto</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><button onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Preços</button></li>
                <li><button onClick={() => navigate('/auth?tab=signup')} className="hover:text-foreground transition-colors">Criar Conta</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Entrar</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs mb-3">Contato</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="mailto:preceptormed@gmail.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="h-3 w-3 shrink-0" /> preceptormed@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Instagram className="h-3 w-3 shrink-0" /> @preceptor.med
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border/15">
          <div className="container px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} PreceptorMED. Todos os direitos reservados.</p>
            <p className="text-[10px] text-muted-foreground/60">Ferramenta educacional. Não substitui orientação médica.</p>
          </div>
        </div>
      </footer>

      <PixPaymentModal
        open={pixModal}
        onClose={() => setPixModal(false)}
        planLabel="Plano Mensal"
        planPrice="R$ 39,90"
      />
    </div>
  );
};

export default Landing;
