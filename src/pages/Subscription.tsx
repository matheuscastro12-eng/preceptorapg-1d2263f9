import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import ProfileDropdown from '@/components/ProfileDropdown';
import {
  Stethoscope,
  CreditCard,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Crown,
  Shield,
} from 'lucide-react';

const planLabels: Record<string, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
  free_access: 'Acesso Gratuito',
};

const Subscription = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscription, hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);

  if (authLoading || subLoading || adminLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal de assinatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativa', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    inactive: { label: 'Inativa', color: 'bg-muted text-muted-foreground border-border' },
    past_due: { label: 'Pagamento Pendente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };

  const status = subscription?.status || 'inactive';
  const statusInfo = statusConfig[status] || statusConfig.inactive;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full opacity-50 will-change-transform" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full opacity-50 will-change-transform" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 bg-background/90">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-gradient-medical">Minha Assinatura</span>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container relative py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className="glass border-border/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-accent" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Status da Assinatura
                </CardTitle>
                <Badge className={`${statusInfo.color} border`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {hasAccess || isAdmin ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30">
                      <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Plano</p>
                        <p className="text-sm font-semibold text-foreground">
                          {subscription?.plan_type === 'free_access' && subscription?.granted_by
                            ? 'Acesso Gratuito (Admin)'
                            : planLabels[subscription?.plan_type || ''] || 'Não definido'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {subscription?.plan_type === 'free_access' ? 'Concedido em' : 'Próxima renovação'}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {subscription?.plan_type === 'free_access'
                            ? formatDate(subscription?.created_at || null)
                            : formatDate(subscription?.current_period_end || null)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">Acesso administrativo ativo</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Benefícios inclusos
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['Fechamentos ilimitados', 'Simulados com IA', 'Biblioteca pessoal', 'Exportação PDF'].map((b) => (
                        <div key={b} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground">Você ainda não possui uma assinatura ativa.</p>
                  <Button onClick={() => navigate('/pricing')} className="glow-medical">
                    Ver Planos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {subscription?.stripe_customer_id && (
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gerenciar Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gerencie sua assinatura, altere o método de pagamento ou cancele pelo portal seguro.
                </p>
                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Abrir Portal de Pagamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default Subscription;
