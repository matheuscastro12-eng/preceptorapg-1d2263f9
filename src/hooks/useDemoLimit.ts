import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const DEMO_DAILY_LIMIT = 2;
const STORAGE_KEY = 'preceptoria_demo_usage';

interface DemoUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

export const useDemoLimit = () => {
  const { user } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [usage, setUsage] = useState<DemoUsage>({ date: '', count: 0 });

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const loadUsage = useCallback(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}_${user.id}`;
    const stored = localStorage.getItem(key);
    const today = getTodayKey();

    if (stored) {
      try {
        const parsed: DemoUsage = JSON.parse(stored);
        if (parsed.date === today) {
          setUsage(parsed);
          return;
        }
      } catch { /* reset */ }
    }
    // New day or no data
    const fresh = { date: today, count: 0 };
    setUsage(fresh);
    localStorage.setItem(key, JSON.stringify(fresh));
  }, [user]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const incrementUsage = useCallback(() => {
    if (!user || hasAccess) return;
    const today = getTodayKey();
    const newUsage = { date: today, count: usage.date === today ? usage.count + 1 : 1 };
    setUsage(newUsage);
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newUsage));
  }, [user, hasAccess, usage]);

  const isSubscriber = !subLoading && hasAccess;
  const remainingPrompts = isSubscriber ? Infinity : Math.max(0, DEMO_DAILY_LIMIT - usage.count);
  const hasReachedLimit = !isSubscriber && usage.count >= DEMO_DAILY_LIMIT;

  return {
    isSubscriber,
    remainingPrompts,
    hasReachedLimit,
    dailyLimit: DEMO_DAILY_LIMIT,
    usedToday: usage.count,
    incrementUsage,
    loading: subLoading,
  };
};
