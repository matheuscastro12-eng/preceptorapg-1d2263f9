import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, Heart } from 'lucide-react';

const SHOW_EVERY_DAYS = 30; // don't ask more than once a month
const WAIT_AFTER_SIGNUP_DAYS = 7; // only after a week of using

export default function NpsModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const shouldShow = async () => {
      // localStorage short-circuit — so we don't query supabase every page load
      const lsKey = `nps_last_prompt_${user.id}`;
      const lastLocal = localStorage.getItem(lsKey);
      if (lastLocal) {
        const lastDate = new Date(lastLocal);
        if (Date.now() - lastDate.getTime() < SHOW_EVERY_DAYS * 86_400_000) {
          return false;
        }
      }

      // Check user creation date — don't prompt users in their first week
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : Date.now();
      if (Date.now() - createdAt < WAIT_AFTER_SIGNUP_DAYS * 86_400_000) {
        return false;
      }

      // Check DB: last NPS prompt/response
      const { data: lastPrompt } = await (supabase
        .from('nps_prompt_log' as any) as any)
        .select('shown_at')
        .eq('user_id', user.id)
        .order('shown_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPrompt?.shown_at) {
        const last = new Date(lastPrompt.shown_at).getTime();
        if (Date.now() - last < SHOW_EVERY_DAYS * 86_400_000) {
          return false;
        }
      }

      // Also check if there's already a recent response
      const { data: lastResponse } = await (supabase
        .from('nps_responses' as any) as any)
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastResponse?.created_at) {
        const last = new Date(lastResponse.created_at as string).getTime();
        if (Date.now() - last < SHOW_EVERY_DAYS * 86_400_000) {
          return false;
        }
      }

      return true;
    };

    (async () => {
      try {
        const show = await shouldShow();
        if (cancelled || !show) return;

        // Delay a bit so we don't fire on load
        setTimeout(async () => {
          if (cancelled) return;
          setVisible(true);
          // Log that we showed it
          await (supabase.from('nps_prompt_log' as any) as any).insert({ user_id: user.id });
          localStorage.setItem(`nps_last_prompt_${user.id}`, new Date().toISOString());
        }, 8000);
      } catch {
        // Silent — NPS is not critical
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const submit = useCallback(async () => {
    if (!user || score === null || sending) return;
    setSending(true);
    try {
      await (supabase.from('nps_responses' as any) as any).insert({
        user_id: user.id,
        score,
        comment: comment.trim() || null,
      });
      // Mark the most recent prompt as responded (find id first, since .update doesn't accept .order/.limit)
      const { data: recentPrompt } = await (supabase
        .from('nps_prompt_log' as any) as any)
        .select('id')
        .eq('user_id', user.id)
        .order('shown_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentPrompt?.id) {
        await (supabase.from('nps_prompt_log' as any) as any)
          .update({ responded: true })
          .eq('id', recentPrompt.id);
      }
      setSent(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      // Silent fail — don't block user
      setVisible(false);
    } finally {
      setSending(false);
    }
  }, [user, score, comment, sending]);

  const dismiss = useCallback(async () => {
    if (user) {
      const { data: recentPrompt } = await (supabase
        .from('nps_prompt_log' as any) as any)
        .select('id')
        .eq('user_id', user.id)
        .order('shown_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentPrompt?.id) {
        await (supabase.from('nps_prompt_log' as any) as any)
          .update({ dismissed: true })
          .eq('id', recentPrompt.id);
      }
    }
    setVisible(false);
  }, [user]);

  if (!visible || !user) return null;

  const getLabel = () => {
    if (score === null) return '';
    if (score <= 6) return 'Detrator — o que poderíamos melhorar?';
    if (score <= 8) return 'Neutro — o que faltou para um 10?';
    return 'Promotor — que bom que você curte! 💚';
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-up">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#006D5B] to-[#005344] text-white px-6 py-5 relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-[#C9A84C] fill-[#C9A84C]" />
            </div>
            <div>
              <h2 className="font-bold text-lg font-['Manrope']">Sua opinião importa muito</h2>
              <p className="text-xs text-white/80 mt-0.5">
                Leva menos de 30 segundos — prometemos.
              </p>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-flex rounded-full bg-green-50 p-4">
              <Heart className="h-8 w-8 text-green-600 fill-green-600" />
            </div>
            <p className="font-bold text-slate-900 font-['Manrope']">Obrigado! 💚</p>
            <p className="text-sm text-slate-500">Sua resposta foi registrada.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                De 0 a 10, o quanto você recomendaria o <span className="text-[#006D5B]">PreceptorMED</span> para um colega de faculdade?
              </p>
              <p className="text-[11px] text-slate-500">0 = Nunca recomendaria · 10 = Recomendaria com certeza</p>
            </div>

            {/* Score picker */}
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`h-10 rounded-lg text-xs font-bold border-2 transition-all ${
                    score === n
                      ? n <= 6
                        ? 'bg-red-500 border-red-500 text-white scale-110'
                        : n <= 8
                        ? 'bg-amber-500 border-amber-500 text-white scale-110'
                        : 'bg-green-500 border-green-500 text-white scale-110'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {score !== null && (
              <div className="space-y-2 animate-fade-up">
                <p className="text-xs font-semibold text-slate-700">{getLabel()}</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentário (opcional)..."
                  rows={3}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006D5B] focus:ring-1 focus:ring-[#006D5B]/20 outline-none px-3.5 py-2.5 resize-none"
                  maxLength={500}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={submit}
                disabled={score === null || sending}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#006D5B] rounded-xl hover:bg-[#005344] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
