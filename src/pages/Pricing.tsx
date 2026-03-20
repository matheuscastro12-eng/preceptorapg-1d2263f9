import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PixPaymentModal from '@/components/PixPaymentModal';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfileDropdown from '@/components/ProfileDropdown';
import logoIcon from '@/assets/logo-icon.png';
import { Loader2 } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

const Pricing = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<{ open: boolean; plan: 'monthly' | 'annual' | 'biannual' }>({ open: false, plan: 'monthly' });

  if (authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="h-5 w-5 text-[#006D5B] animate-spin" />
      </div>
    );
  }

  if (!subLoading && user && hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubscribe = async (planType: 'monthly' | 'annual' | 'biannual') => {
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
      if (data?.url) window.location.href = data.url;
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] sticky top-0 z-50">
        <nav className="flex justify-between items-center w-full px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src={logoIcon} alt="PreceptorMED" className="h-7 w-7" />
              <span className="text-2xl font-extrabold text-[#006D5B] tracking-tighter" style={{ fontFamily: "'Manrope', sans-serif" }}>
                PreceptorMED
              </span>
            </button>
          </div>
          {user ? (
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2 text-slate-600 font-semibold hover:text-[#006D5B] transition-colors duration-300 text-sm"
            >
              Entrar
            </button>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6">
          {/* Heading */}
          <div className="text-center mb-16 animate-fade-up">
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#191c1d]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              O plano certo para cada etapa.
            </h1>
            <p className="text-slate-500 text-lg">
              Invista na sua excelência clínica com transparência.
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-16 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Mensal */}
            <div className="flex-1 bg-white p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Mensal</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#005344]">R$ 49,90</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 text-sm text-[#191c1d]">
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Acesso completo à plataforma
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Resumos e simulados ilimitados
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Cancelamento a qualquer momento
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={loadingPlan !== null}
                className="w-full py-4 border border-slate-300 text-[#191c1d] text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loadingPlan === 'monthly' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                Começar mensal
              </button>
              <button
                onClick={() => setPixModal({ open: true, plan: 'monthly' })}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-[#006D5B] transition-colors py-2"
              >
                <MI name="qr_code" className="text-base" /> Pagar com Pix
              </button>
            </div>

            {/* Anual — highlighted */}
            <div className="flex-1 bg-white p-10 rounded-2xl shadow-xl border-2 border-[#006D5B] relative overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-[#005344] text-white px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                Melhor Valor
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Anual</h3>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-[#005344]">R$ 350,90</span>
                <span className="text-slate-500">/ano</span>
              </div>
              <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 29,24/mês (Economia de 41%)</p>
              <ul className="space-y-4 mb-10 text-sm text-[#191c1d]">
                <li className="flex items-center gap-3 font-semibold">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Tudo do plano mensal
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Economia de mais de 40%
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Suporte prioritário
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe('annual')}
                disabled={loadingPlan !== null}
                className="btn-shimmer relative overflow-hidden w-full py-4 bg-[#005344] text-white text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:bg-[#003d32] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loadingPlan === 'annual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                Começar anual
              </button>
            </div>

            {/* Bianual */}
            <div className="flex-1 bg-white p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Bianual</h3>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-[#005344]">R$ 599,90</span>
                <span className="text-slate-500">/2 anos</span>
              </div>
              <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 24,99/mês (Economia de 50%)</p>
              <ul className="space-y-4 mb-10 text-sm text-[#191c1d]">
                <li className="flex items-center gap-3 font-semibold">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Tudo do plano anual
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Maior economia possível
                </li>
                <li className="flex items-center gap-3">
                  <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                  Suporte prioritário
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe('biannual')}
                disabled={loadingPlan !== null}
                className="w-full py-4 border border-slate-300 text-[#191c1d] text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loadingPlan === 'biannual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                Começar bianual
              </button>
            </div>
          </div>

          {/* What's included */}
          <div className="max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h4 className="text-[11px] font-bold text-slate-400 text-center mb-5 uppercase tracking-widest">O que está incluso em todos os planos</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'Resumos com IA ilimitados',
                'Simulados estilo residência',
                'Chat acadêmico sem limites',
                'Biblioteca pessoal completa',
                'Exportação em PDF',
                'Casos clínicos inteligentes',
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-slate-100 text-[12px] text-slate-600 font-medium shadow-sm">
                  <MI name="check_circle" fill className="text-[#006D5B] text-base" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-10 text-[12px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <MI name="verified_user" className="text-[#006D5B] text-base" />
              Pagamento seguro
            </span>
            <span className="flex items-center gap-1.5">
              <MI name="verified_user" className="text-[#006D5B] text-base" />
              Cancele a qualquer momento
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 py-6 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="PreceptorMED" className="h-4 w-4 opacity-50" />
            <span className="text-xs text-slate-400 font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>
              PreceptorMED
            </span>
          </div>
          <p className="text-xs text-slate-400/60">
            © {new Date().getFullYear()} — Uso educacional
          </p>
        </div>
      </footer>

      <PixPaymentModal
        open={pixModal.open}
        onClose={() => setPixModal({ ...pixModal, open: false })}
        planLabel={pixModal.plan === 'annual' ? 'Plano Anual' : pixModal.plan === 'biannual' ? 'Plano Bianual' : 'Plano Mensal'}
        planPrice={pixModal.plan === 'annual' ? 'R$ 350,90' : pixModal.plan === 'biannual' ? 'R$ 599,90' : 'R$ 49,90'}
      />
    </div>
  );
};

export default Pricing;
