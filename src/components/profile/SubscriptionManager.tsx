import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  CreditCard, AlertTriangle, Loader2, XCircle, Clock, Crown, Gift,
  Ban, Trash2, ChevronRight, Info,
} from 'lucide-react';

interface Subscription {
  status: string;
  plan_type: string;
  access_expires_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
  biannual: 'Bianual',
  free_access: 'Acesso gratuito',
  none: 'Sem plano',
};

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type ConfirmAction = 'immediate' | 'end_of_period' | 'delete' | null;

export default function SubscriptionManager() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan_type, access_expires_at, current_period_end, cancel_at_period_end, canceled_at')
      .eq('user_id', user.id)
      .maybeSingle();
    setSub((data as Subscription | null) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const callFn = async (path: string, body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Sessão expirada');
    const res = await fetch(`${API_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? 'Erro');
    return data;
  };

  const handleCancel = async (mode: 'immediate' | 'end_of_period') => {
    setActing(true);
    try {
      const result = await callFn('cancel-subscription', { mode });
      toast.success(result.message ?? 'Feito');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      await callFn('delete-user', { self: true });
      toast.success('Conta excluída. Até breve!');
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
      setActing(false);
      setConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#006D5B]" />
      </div>
    );
  }

  const planLabel = PLAN_LABELS[sub?.plan_type ?? 'none'] ?? sub?.plan_type ?? 'Sem plano';
  const isActive = sub?.status === 'active';
  const isFreeAccess = sub?.plan_type === 'free_access';
  const isPaying = isActive && (sub?.plan_type === 'monthly' || sub?.plan_type === 'annual' || sub?.plan_type === 'biannual');
  const periodEnd = sub?.current_period_end || sub?.access_expires_at;
  const periodEndDate = periodEnd ? new Date(periodEnd) : null;
  const periodEndFmt = periodEndDate ? periodEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  return (
    <div className="space-y-5">
      {/* Card do plano atual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(25,28,29,0.04)]">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            isPaying ? 'bg-[#006D5B]/10' : isFreeAccess ? 'bg-[#C9A84C]/15' : 'bg-gray-100'
          }`}>
            {isPaying ? <Crown className="w-5 h-5 text-[#006D5B]" />
              : isFreeAccess ? <Gift className="w-5 h-5 text-[#8a6f26]" />
              : <CreditCard className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[#191C1D] font-['Manrope']">{planLabel}</h3>
              {isActive ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Ativo</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">Inativo</span>
              )}
            </div>
            {periodEndFmt && (
              <p className="text-sm text-[#4a5568]">
                {sub?.cancel_at_period_end
                  ? <>Termina em <strong>{periodEndFmt}</strong> (renovação cancelada)</>
                  : isPaying
                    ? <>Renova em <strong>{periodEndFmt}</strong></>
                    : <>Expira em <strong>{periodEndFmt}</strong></>}
              </p>
            )}
            {!sub || sub.plan_type === 'none' ? (
              <div className="mt-3">
                <button
                  onClick={() => navigate('/pricing')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006D5B] text-white text-sm font-bold rounded-lg hover:bg-[#005344] transition-colors"
                >
                  Ver planos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {sub?.cancel_at_period_end && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Sua renovação está cancelada. Você continua com acesso até <strong>{periodEndFmt}</strong> e depois a conta volta para o plano gratuito.
            </p>
          </div>
        )}
      </div>

      {/* Ações de assinatura (só se tem plano pago ativo) */}
      {isPaying && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-[#191C1D] font-['Manrope'] mb-1">Gerenciar assinatura</h3>

          {!sub?.cancel_at_period_end && (
            <button
              onClick={() => setConfirm('end_of_period')}
              disabled={acting}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-colors disabled:opacity-50"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#191C1D]">Cancelar renovação</p>
                <p className="text-xs text-[#4a5568]">Acesso continua até {periodEndFmt ?? 'o fim do período'}. Não renova depois.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          )}

          <button
            onClick={() => setConfirm('immediate')}
            disabled={acting}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors disabled:opacity-50"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#191C1D]">Cancelar agora</p>
              <p className="text-xs text-[#4a5568]">Encerra o acesso imediatamente. Sem reembolso proporcional.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
        </div>
      )}

      {/* Danger zone — excluir conta */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-red-700 font-['Manrope']">Zona perigosa</h3>
        </div>
        <p className="text-xs text-[#4a5568] mb-3">
          Excluir a conta remove tudo: perfil, histórico, fechamentos, flashcards, progresso. A ação é irreversível.
        </p>
        <button
          onClick={() => setConfirm('delete')}
          disabled={acting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Excluir minha conta
        </button>
      </div>

      {/* Modal de confirmação */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !acting && setConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirm === 'delete' ? 'bg-red-100' : confirm === 'immediate' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {confirm === 'delete' ? <Trash2 className="w-5 h-5 text-red-600" />
                    : confirm === 'immediate' ? <Ban className="w-5 h-5 text-red-600" />
                    : <Clock className="w-5 h-5 text-amber-700" />}
                </div>
                <h3 className="text-lg font-bold text-[#191C1D] font-['Manrope']">
                  {confirm === 'delete' ? 'Excluir conta permanentemente?'
                    : confirm === 'immediate' ? 'Cancelar agora?'
                    : 'Cancelar renovação?'}
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {confirm === 'delete' && (
                <>
                  <p className="text-sm text-[#4a5568]">
                    Tudo será apagado: seu perfil, fechamentos, flashcards, histórico de questões, progresso e conta de acesso.
                  </p>
                  <p className="text-sm font-bold text-red-700">Esta ação NÃO pode ser desfeita.</p>
                </>
              )}
              {confirm === 'immediate' && (
                <>
                  <p className="text-sm text-[#4a5568]">
                    Seu acesso será encerrado imediatamente. Não há reembolso proporcional dos dias restantes.
                  </p>
                  <p className="text-xs text-[#6e7975]">
                    O cancelamento da cobrança no cartão precisa ser feito pelo painel de pagamento do EasyFlow. Se precisar de ajuda, entre em contato no suporte.
                  </p>
                </>
              )}
              {confirm === 'end_of_period' && (
                <>
                  <p className="text-sm text-[#4a5568]">
                    Você continua com acesso completo até <strong>{periodEndFmt}</strong>. Depois dessa data, a assinatura não será renovada.
                  </p>
                  <p className="text-xs text-[#6e7975]">
                    Você pode reativar a qualquer momento antes do vencimento.
                  </p>
                </>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="px-4 py-2 text-sm font-medium text-[#4a5568] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (confirm === 'delete') handleDelete();
                  else handleCancel(confirm);
                }}
                disabled={acting}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirm === 'end_of_period' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {acting && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirm === 'delete' ? 'Excluir conta'
                  : confirm === 'immediate' ? 'Cancelar agora'
                  : 'Cancelar renovação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
