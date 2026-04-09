import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── XP Rules ──
const XP_TABLE: Record<string, number> = {
  review_easy: 10, review_good: 5, review_hard: 3, review_again: 1,
  streak_3: 30, streak_7: 75, streak_14: 150, streak_30: 300,
  daily_bonus: 15,
};

// ── Level thresholds ──
function xpToLevel(xp: number): number {
  // Levels: 1=0, 2=100, 3=250, 4=500, 5=850, 6=1300, ...
  // Formula: XP needed = 50 * level^1.5
  let level = 1;
  let threshold = 0;
  while (true) {
    const next = threshold + Math.round(50 * Math.pow(level, 1.5));
    if (xp < next) return level;
    threshold = next;
    level++;
    if (level > 99) return 99;
  }
}

function xpForNextLevel(currentLevel: number): { current: number; needed: number } {
  let threshold = 0;
  for (let l = 1; l < currentLevel; l++) threshold += Math.round(50 * Math.pow(l, 1.5));
  const needed = Math.round(50 * Math.pow(currentLevel, 1.5));
  return { current: threshold, needed };
}

export const LEVEL_NAMES: Record<number, string> = {
  1: "Calouro", 2: "Estudante", 3: "Acadêmico", 4: "Interno",
  5: "Residente R1", 6: "Residente R2", 7: "Residente R3",
  8: "Especialista", 9: "Preceptor", 10: "Professor Titular",
};

// ── SM-2 Algorithm (proper implementation) ──
export function sm2(quality: 'easy' | 'good' | 'hard' | 'again', ease: number, interval: number, reps: number) {
  // quality mapping: again=0, hard=2, good=3, easy=5
  const q = quality === 'again' ? 0 : quality === 'hard' ? 2 : quality === 'good' ? 3 : 5;

  let newEase = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEase = Math.max(1.3, newEase);

  let newInterval: number;
  let newReps: number;

  if (q < 2) {
    // Failed — reset
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = reps + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * newEase);

    // Bonus for easy
    if (quality === 'easy') newInterval = Math.round(newInterval * 1.3);
  }

  return { ease: Math.round(newEase * 100) / 100, interval: newInterval, reps: newReps };
}

// ── Hooks ──

export interface UserProgression {
  total_xp: number;
  level: number;
  streak_days: number;
  best_streak: number;
  cards_reviewed_total: number;
  last_activity_date: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at?: string;
}

export function useProgression() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gamification", "progression", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progression")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // Auto-create progression for new users
        const { data: created } = await supabase
          .from("user_progression")
          .insert({ user_id: user!.id })
          .select()
          .single();
        return created as UserProgression;
      }
      return data as UserProgression;
    },
    staleTime: 30000,
  });
}

export function useAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gamification", "achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: definitions } = await supabase
        .from("achievement_definitions")
        .select("*")
        .order("xp_reward", { ascending: true });

      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user!.id);

      const unlockedMap = new Map((unlocked ?? []).map(u => [u.achievement_id, u.unlocked_at]));

      return (definitions ?? []).map(d => ({
        ...d,
        unlocked_at: unlockedMap.get(d.id) ?? undefined,
      })) as Achievement[];
    },
    staleTime: 60000,
  });
}

export function useRecordReview() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, quality, easeBefore, easeAfter, intervalBefore, intervalAfter }: {
      cardId: string; quality: string; easeBefore: number; easeAfter: number; intervalBefore: number; intervalAfter: number;
    }) => {
      if (!user) return;

      // 1. Log review history
      await supabase.from("flashcard_reviews").insert({
        card_id: cardId,
        user_id: user.id,
        quality,
        ease_before: easeBefore,
        ease_after: easeAfter,
        interval_before: intervalBefore,
        interval_after: intervalAfter,
      });

      // 2. Award XP
      const xpAction = `review_${quality}` as keyof typeof XP_TABLE;
      const xpAmount = XP_TABLE[xpAction] ?? 5;

      await supabase.from("xp_ledger").insert({
        user_id: user.id,
        action: xpAction,
        amount: xpAmount,
        metadata: { card_id: cardId },
      });

      // 3. Update progression
      const { data: prog } = await supabase
        .from("user_progression")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const today = new Date().toISOString().split("T")[0];
      const lastDate = prog?.last_activity_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      let newStreak = prog?.streak_days ?? 0;
      let dailyBonus = 0;

      if (lastDate !== today) {
        // New day activity
        if (lastDate === yesterday) {
          newStreak += 1; // Consecutive day
        } else if (!lastDate) {
          newStreak = 1; // First ever
        } else {
          newStreak = 1; // Streak broken
        }
        dailyBonus = XP_TABLE.daily_bonus; // Daily login bonus
      }

      const newXp = (prog?.total_xp ?? 0) + xpAmount + dailyBonus;
      const newLevel = xpToLevel(newXp);
      const newTotal = (prog?.cards_reviewed_total ?? 0) + 1;
      const bestStreak = Math.max(prog?.best_streak ?? 0, newStreak);

      if (prog) {
        await supabase.from("user_progression").update({
          total_xp: newXp,
          level: newLevel,
          streak_days: newStreak,
          best_streak: bestStreak,
          cards_reviewed_total: newTotal,
          last_activity_date: today,
        }).eq("user_id", user.id);
      } else {
        await supabase.from("user_progression").insert({
          user_id: user.id,
          total_xp: newXp,
          level: newLevel,
          streak_days: newStreak,
          best_streak: bestStreak,
          cards_reviewed_total: newTotal,
          last_activity_date: today,
        });
      }

      // 4. Check streak XP bonuses
      if (lastDate !== today) {
        for (const [days, action] of [[3, "streak_3"], [7, "streak_7"], [14, "streak_14"], [30, "streak_30"]] as const) {
          if (newStreak === days) {
            await supabase.from("xp_ledger").insert({
              user_id: user.id,
              action,
              amount: XP_TABLE[action],
              metadata: { streak_days: days },
            });
          }
        }
      }

      // 5. Check achievements
      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      const unlockedSet = new Set((unlocked ?? []).map(u => u.achievement_id));

      const checks: [string, boolean][] = [
        ["first_review", newTotal >= 1],
        ["ten_reviews", newTotal >= 10],
        ["fifty_reviews", newTotal >= 50],
        ["hundred_reviews", newTotal >= 100],
        ["five_hundred", newTotal >= 500],
        ["streak_3", bestStreak >= 3],
        ["streak_7", bestStreak >= 7],
        ["streak_14", bestStreak >= 14],
        ["streak_30", bestStreak >= 30],
      ];

      const newBadges: string[] = [];
      for (const [id, met] of checks) {
        if (met && !unlockedSet.has(id)) {
          await supabase.from("user_achievements").insert({ user_id: user.id, achievement_id: id });
          newBadges.push(id);
        }
      }

      return { xpEarned: xpAmount + dailyBonus, newLevel, newStreak, newBadges, totalXp: newXp };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

export { xpToLevel, xpForNextLevel };
