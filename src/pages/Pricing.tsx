import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfileDropdown from '@/components/ProfileDropdown';
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
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { planType } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ title: 'Erro', description: 'Não foi possível iniciar o checkout.', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    { icon: Sparkles, text: 'Fechamentos com IA ilimitados' },
    { icon: BookOpen, text: 'Biblioteca para salvar estudos' },
    { icon: Download, text: 'Exportação em PDF' },
    { icon: Clock, text: 'Atualizações automáticas' },
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

          {user ? (
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Entrar / Criar conta
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container py-10 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
              Desbloqueie o Poder do PBL
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Gere fechamentos completos para seus estudos de medicina com inteligência artificial.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card">
                <feature.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-center text-muted-foreground">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Mensal</CardTitle>
                <CardDescription>Perfeito para começar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  R$ 29,90
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
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
                <Button className="w-full" variant="outline" onClick={() => handleSubscribe('monthly')} disabled={loadingPlan !== null}>
                  {loadingPlan === 'monthly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assinar Mensal
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/40 relative">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">
                Mais Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-lg">Anual</CardTitle>
                <CardDescription>Economia de quase 2 meses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  R$ 299,00
                  <span className="text-sm font-normal text-muted-foreground">/ano</span>
                </div>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Acesso completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Equivale a R$ 24,92/mês
                  </li>
                </ul>
                <Button className="w-full" onClick={() => handleSubscribe('annual')} disabled={loadingPlan !== null}>
                  {loadingPlan === 'annual' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assinar Anual
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
