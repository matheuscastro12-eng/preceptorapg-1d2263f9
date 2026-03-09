import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Lock, Crown, Brain, GraduationCap, BookOpen, Download, 
  Sparkles, ArrowRight, Loader2, Check, Zap, MessageSquare 
} from 'lucide-react';

interface UpgradePaywallProps {
  variant?: 'chat-limit' | 'feature-locked' | 'banner';
  remainingPrompts?: number;
  dailyLimit?: number;
}

const UpgradePaywall = ({ variant = 'chat-limit', remainingPrompts = 0, dailyLimit = 2 }: UpgradePaywallProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    setLoadingPlan(planType);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/auth?plan=${planType}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
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

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">Modo Demonstração</span> — {remainingPrompts} de {dailyLimit} perguntas restantes hoje
          </p>
        </div>
        <Button size="sm" variant="default" className="shrink-0 h-7 text-xs gap-1" onClick={() => navigate('/pricing')}>
          <Crown className="h-3 w-3" />
          Desbloquear
        </Button>
      </motion.div>
    );
  }

  if (variant === 'feature-locked') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center"
      >
        <Lock className="h-10 w-10 text-primary/60 mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-1">Funcionalidade Premium</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Assine para desbloquear fechamentos, simulados, casos clínicos e mais.
        </p>
        <Button onClick={() => navigate('/pricing')} className="gap-2">
          <Crown className="h-4 w-4" />
          Ver Planos
        </Button>
      </motion.div>
    );
  }

  // chat-limit variant (full paywall after limit reached)
  const benefits = [
    { icon: Brain, text: 'Fechamentos ilimitados com IA' },
    { icon: GraduationCap, text: 'Simulados estilo residência' },
    { icon: MessageSquare, text: 'Chat acadêmico sem limites' },
    { icon: BookOpen, text: 'Biblioteca pessoal completa' },
    { icon: Download, text: 'Exportação em PDF' },
    { icon: Zap, text: 'Casos clínicos inteligentes' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto p-6 sm:p-8"
    >
      <div className="text-center mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Suas {dailyLimit} perguntas grátis acabaram hoje
        </h2>
        <p className="text-sm text-muted-foreground">
          Assine o PreceptorIA para continuar estudando sem limites. 
          Amanhã você terá mais {dailyLimit} perguntas grátis, ou desbloqueie agora:
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
            <b.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <button
          onClick={() => handleSubscribe('annual')}
          disabled={loadingPlan !== null}
          className="w-full p-4 rounded-xl border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors text-left relative"
        >
          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            MELHOR PREÇO
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Plano Anual</p>
              <p className="text-xs text-muted-foreground">Equivale a R$ 24,92/mês</p>
            </div>
            <div className="text-right">
              {loadingPlan === 'annual' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <p className="font-bold text-lg">R$ 299</p>
                  <p className="text-[10px] text-muted-foreground">/ano</p>
                </>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSubscribe('monthly')}
          disabled={loadingPlan !== null}
          className="w-full p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Plano Mensal</p>
              <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
            </div>
            <div className="text-right">
              {loadingPlan === 'monthly' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <p className="font-bold text-lg">R$ 29,90</p>
                  <p className="text-[10px] text-muted-foreground">/mês</p>
                </>
              )}
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-primary" />
          Pagamento seguro
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-primary" />
          Cancele a qualquer hora
        </span>
      </div>
    </motion.div>
  );
};

export default UpgradePaywall;
