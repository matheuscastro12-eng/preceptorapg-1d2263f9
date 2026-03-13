import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfileDropdown from '@/components/ProfileDropdown';
import logoPreceptor from '@/assets/logo-preceptor.png';
import { motion } from 'framer-motion';
import { 
  Check, 
  Loader2,
  Sparkles,
  BookOpen,
  Download,
  Brain,
  GraduationCap,
  MessageSquare,
  Zap,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const Pricing = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!subLoading && user && hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      navigate(`/auth?plan=${planType}`);
      return;
    }

    setLoadingPlan(planType);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const benefits = [
    { icon: Sparkles, text: 'Fechamentos com IA ilimitados' },
    { icon: GraduationCap, text: 'Simulados estilo residência' },
    { icon: MessageSquare, text: 'Chat acadêmico sem limites' },
    { icon: BookOpen, text: 'Biblioteca pessoal completa' },
    { icon: Download, text: 'Exportação em PDF' },
    { icon: Zap, text: 'Casos clínicos inteligentes' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold">PreceptorMED</span>
            </button>
          </div>

          {user ? (
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="py-12 sm:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-12"
              >
                <p className="text-sm font-medium text-primary mb-3">Planos</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Escolha seu plano
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Acesso completo a todas as ferramentas do PreceptorMED. Cancele quando quiser.
                </p>
              </motion.div>

              {/* Pricing Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-12"
              >
                {/* Monthly */}
                <div className="rounded-xl border border-border/50 bg-background p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Mensal</h2>
                    <p className="text-sm text-muted-foreground">Perfeito para começar</p>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">R$ 29,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Acesso completo à plataforma</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Cancele quando quiser</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Suporte por email</span>
                    </li>
                  </ul>

                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleSubscribe('monthly')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === 'monthly' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Assinar Mensal
                  </Button>
                </div>

                {/* Annual */}
                <div className="rounded-xl border-2 border-primary/50 bg-background p-6 sm:p-8 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Melhor preço
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Anual</h2>
                    <p className="text-sm text-muted-foreground">Economia de quase 2 meses</p>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">R$ 299</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Acesso completo à plataforma</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Equivale a R$ 24,92/mês</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Suporte prioritário</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe('annual')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === 'annual' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Assinar Anual
                  </Button>
                </div>
              </motion.div>

              {/* Benefits grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-center mb-6">O que está incluso</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40"
                    >
                      <benefit.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Trust */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Pagamento seguro via Stripe
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Cancele a qualquer momento
                </span>
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
              <span className="text-sm text-muted-foreground">PreceptorMED</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PreceptorMED. Uso educacional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
