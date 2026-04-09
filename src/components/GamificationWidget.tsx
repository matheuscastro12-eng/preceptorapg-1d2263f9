import { useProgression, xpForNextLevel, LEVEL_NAMES } from "@/hooks/useGamification";
import { Flame, Star, Zap } from "lucide-react";

interface GamificationWidgetProps {
  variant?: "sidebar" | "card";
}

export default function GamificationWidget({ variant = "card" }: GamificationWidgetProps) {
  const { data: prog } = useProgression();
  if (!prog) return null;

  const level = prog.level;
  const levelName = LEVEL_NAMES[Math.min(level, 10)] ?? `Nivel ${level}`;
  const { current: levelBase, needed } = xpForNextLevel(level);
  const xpInLevel = prog.total_xp - levelBase;
  const pct = needed > 0 ? Math.min(100, Math.round((xpInLevel / needed) * 100)) : 100;

  if (variant === "sidebar") {
    return (
      <div className="px-4 py-3 space-y-2">
        {/* Streak */}
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${prog.streak_days > 0 ? "text-orange-400" : "text-white/20"}`} />
          <span className="text-xs text-white/70">{prog.streak_days}d streak</span>
        </div>
        {/* XP bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50 font-medium">Nv.{level} {levelName}</span>
            <span className="text-[10px] text-[#C9A84C] font-bold">{prog.total_xp} XP</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Card variant — for MainMenu
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#006D5B]/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-[#006D5B]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Nv.{level} — {levelName}</p>
            <p className="text-[10px] text-slate-400">{prog.total_xp} XP total</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">
          <Flame className={`w-3.5 h-3.5 ${prog.streak_days > 0 ? "text-orange-500" : "text-orange-200"}`} />
          <span className="text-xs font-bold text-orange-600">{prog.streak_days}</span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #006D5B, #00A67E)" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">{xpInLevel}/{needed} XP</span>
          <span className="text-[10px] text-slate-400">Nv.{level + 1}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#006D5B]" />
          <span className="text-[10px] text-slate-500">{prog.cards_reviewed_total} revisoes</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] text-slate-500">Melhor: {prog.best_streak}d</span>
        </div>
      </div>
    </div>
  );
}
