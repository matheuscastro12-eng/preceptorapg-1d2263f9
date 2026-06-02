import { useProgression, useAchievements, xpForNextLevel, LEVEL_NAMES } from '@/hooks/useGamification';
import { Flame, Zap, Trophy, Lock, Star, TrendingUp } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

// achievement_definitions.icon pode ser nome de material-symbol ("local_fire_department")
// ou um emoji. Heurística simples: só letras/números/_ => material symbol.
const isSymbolName = (s: string) => /^[a-z0-9_]+$/.test(s);

export default function AchievementsTab() {
  const { data: prog, isLoading: progLoading } = useProgression();
  const { data: achievements, isLoading: achLoading } = useAchievements();

  if (progLoading || achLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }

  const level = prog?.level ?? 1;
  const levelName = LEVEL_NAMES[Math.min(level, 10)] ?? `Nível ${level}`;
  const nextName = LEVEL_NAMES[Math.min(level + 1, 10)] ?? `Nível ${level + 1}`;
  const { current: levelBase, needed } = xpForNextLevel(level);
  const totalXp = prog?.total_xp ?? 0;
  const xpInLevel = Math.max(0, totalXp - levelBase);
  const pct = needed > 0 ? Math.min(100, Math.round((xpInLevel / needed) * 100)) : 100;
  const xpToNext = Math.max(0, needed - xpInLevel);

  const all = achievements ?? [];
  const unlocked = all.filter(a => a.unlocked_at);
  const locked = all.filter(a => !a.unlocked_at);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Nível + Streak */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Card de nível */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#005344] to-[#00261f] text-white p-6 sm:p-7 rounded-2xl shadow-xl">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#9df3dc]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <Star className="w-6 h-6 text-[#9df3dc]" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9df3dc]">Nível {level}</p>
                  <h3 className="font-['Manrope'] text-2xl font-extrabold leading-tight">{levelName}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="font-['Manrope'] text-2xl font-extrabold text-[#C9A84C]">{totalXp.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">XP total</p>
              </div>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#9df3dc,#C9A84C)' }} />
            </div>
            <div className="flex justify-between text-[11px] text-white/60">
              <span>{xpInLevel}/{needed} XP neste nível</span>
              <span>{xpToNext > 0 ? `faltam ${xpToNext} p/ ${nextName}` : 'Nível máximo 🎉'}</span>
            </div>
          </div>
        </div>

        {/* Card de streak */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${(prog?.streak_days ?? 0) > 0 ? 'bg-orange-50' : 'bg-slate-100'}`}>
              <Flame className={`w-8 h-8 ${(prog?.streak_days ?? 0) > 0 ? 'text-orange-500' : 'text-slate-300'}`} fill={(prog?.streak_days ?? 0) > 0 ? 'currentColor' : 'none'} />
            </div>
            <div>
              <p className="font-['Manrope'] text-4xl font-extrabold text-[#191c1d] leading-none">
                {prog?.streak_days ?? 0}<span className="text-lg text-slate-400 font-bold ml-1.5">dias</span>
              </p>
              <p className="text-xs text-[#6e7975] font-medium mt-1.5">Sequência atual de estudo</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#191c1d]">{prog?.best_streak ?? 0} dias</p>
                <p className="text-[10px] text-[#6e7975] uppercase tracking-wider font-bold">Recorde</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#006D5B] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#191c1d]">{prog?.cards_reviewed_total ?? 0}</p>
                <p className="text-[10px] text-[#6e7975] uppercase tracking-wider font-bold">Revisões</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges / conquistas */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#C9A84C]" />
            <h3 className="font-['Manrope'] text-base sm:text-lg font-bold text-[#191c1d]">Conquistas</h3>
          </div>
          <span className="text-xs font-bold text-[#6e7975]">{unlocked.length}/{all.length} desbloqueadas</span>
        </div>
        {all.length === 0 ? (
          <p className="text-sm text-[#6e7975] text-center py-8">As conquistas aparecem aqui conforme você estuda e revisa flashcards.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...unlocked, ...locked].map(a => {
              const on = !!a.unlocked_at;
              return (
                <div key={a.id} className={`relative rounded-xl border p-4 transition-all ${on ? 'border-[#C9A84C]/40 bg-[#fdf8ec]' : 'border-slate-200 bg-slate-50/60'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${on ? 'bg-[#C9A84C]/15 text-[#a4842f]' : 'bg-slate-200/70 text-slate-400'}`}>
                    {on
                      ? (a.icon && isSymbolName(a.icon)
                          ? <MI name={a.icon} fill className="text-[20px]" />
                          : a.icon
                            ? <span className="text-lg leading-none">{a.icon}</span>
                            : <Trophy className="w-5 h-5" />)
                      : <Lock className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs font-bold leading-tight ${on ? 'text-[#191c1d]' : 'text-slate-400'}`}>{a.name}</p>
                  <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${on ? 'text-[#6e7975]' : 'text-slate-400'}`}>{a.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] font-bold ${on ? 'text-[#C9A84C]' : 'text-slate-300'}`}>+{a.xp_reward} XP</span>
                    {on && a.unlocked_at && <span className="text-[9px] text-[#6e7975]">{new Date(a.unlocked_at).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
