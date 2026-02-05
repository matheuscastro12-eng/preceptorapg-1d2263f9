import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Stethoscope, 
  Check, 
  Loader2,
  Sparkles,
  BookOpen,
  Download,
  Clock
} from 'lucide-react';

const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Stethoscope className="relative h-12 w-12 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  // Allow viewing pricing without login; require login only to start checkout.
  if (user && hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      toast({
        title: 'Faça login para assinar',
        description: 'Entre ou crie sua conta para iniciar o checkout.',
      });
      navigate('/auth');
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

  const features = [
    { icon: Sparkles, text: 'Fechamentos com IA ilimitados' },
    { icon: BookOpen, text: 'Biblioteca para salvar seus estudos' },
    { icon: Download, text: 'Exportação em PDF' },
    { icon: Clock, text: 'Atualizações automáticas' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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

          {!user ? (
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Entrar / Criar conta
            </Button>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container relative py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gradient-medical">
              Desbloqueie o Poder do PBL
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gere fechamentos completos para seus estudos de medicina com inteligência artificial.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-4 glass rounded-xl">
                <feature.icon className="h-6 w-6 text-primary" />
                <span className="text-sm text-center">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Monthly Plan */}
            <Card className="glass border-border/50 hover-lift">
              <CardHeader>
                <CardTitle className="text-xl">Mensal</CardTitle>
                <CardDescription>Perfeito para começar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">
                  R$ 29,90
                  <span className="text-base font-normal text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Acesso completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Cancele quando quiser
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === 'monthly' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Assinar Mensal
                </Button>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="glass border-primary/50 hover-lift relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Mais Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">Anual</CardTitle>
                <CardDescription>Economia de 2 meses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">
                  R$ 249,90
                  <span className="text-base font-normal text-muted-foreground">/ano</span>
                </div>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Acesso completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Equivale a R$ 20,83/mês
                  </li>
                </ul>
                <Button 
                  className="w-full glow-medical" 
                  onClick={() => handleSubscribe('annual')}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === 'annual' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Assinar Anual
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground">
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
