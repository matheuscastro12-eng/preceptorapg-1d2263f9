import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';

/**
 * Banner que aparece para usuários no trial gratuito de 3 dias.
 * Mostra dias/horas restantes e CTA para assinar.
 *
 * Renderiza apenas se:
 * - tem subscription com plan_type='free_access'
 * - tem access_expires_at no futuro
 * - granted_by IS NULL (trial automático, não acesso concedido por admin)
 */
export default function TrialBanner() {
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  if (!subscription) return null;
  if (subscription.plan_type !== 'free_access') return null;
  if (subscription.granted_by) return null; // acesso dado por admin, não é trial
  if (!subscription.access_expires_at) return null;

  const expiresAt = new Date(subscription.access_expires_at).getTime();
  const now = Date.now();
  const msLeft = expiresAt - now;

  if (msLeft <= 0) return null; // já expirou — modo demo já está ativo

  const totalHours = Math.floor(msLeft / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  // Texto dinamico baseado no tempo restante
  const timeLeftText =
    days >= 1
      ? `${days} ${days === 1 ? 'dia' : 'dias'}${hours > 0 ? ` e ${hours}h` : ''}`
      : totalHours >= 1
      ? `${totalHours}h restantes`
      : 'menos de 1h';

  // Urgencia visual aumenta conforme se aproxima do fim
  const isUrgent = days < 1; // ultimas 24h
  const isCritical = totalHours < 6; // ultimas 6h

  const bgGradient = isCritical
    ? 'from-red-500 to-red-600'
    : isUrgent
    ? 'from-orange-500 to-amber-600'
    : 'from-[#005344] to-[#006D5B]';

  const iconBg = isCritical || isUrgent ? 'bg-white/20' : 'bg-[#C9A84C]/20';
  const iconColor = isCritical || isUrgent ? 'text-white' : 'text-[#C9A84C]';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} text-white p-4 sm:p-5 shadow-lg shadow-black/10 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group`}
      onClick={() => navigate('/pricing')}
    >
      {/* Decorative blur */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:bg-white/15 transition-all duration-500" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center backdrop-blur-sm`}>
          {isCritical ? (
            <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
          ) : (
            <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
            {isCritical ? 'Trial expirando' : isUrgent ? 'Últimas horas do trial' : 'Trial gratuito ativo'}
          </p>
          <p className="text-sm sm:text-base font-bold font-['Manrope'] leading-tight">
            {isCritical
              ? `Seu acesso completo expira em ${timeLeftText}`
              : `Acesso completo por mais ${timeLeftText}`}
          </p>
          <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 leading-snug">
            Assine para continuar com tudo liberado depois desse período.
          </p>
        </div>

        <div className="hidden sm:flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold uppercase tracking-wider transition-all duration-200 group-hover:gap-2">
          Assinar
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
