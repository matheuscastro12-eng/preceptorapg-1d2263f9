import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

const DEMO_DAILY_LIMIT = 2;

export const useDemoLimit = () => {
  const { user } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [usedToday, setUsedToday] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsedToday(0);
      setLoaded(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'ai-chat')
      .gte('created_at', `${today}T00:00:00.000Z`);

    setUsedToday(count ?? 0);
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Optimistic increment after sending a message
  const incrementUsage = useCallback(() => {
    if (!user || hasAccess) return;
    setUsedToday(prev => prev + 1);
  }, [user, hasAccess]);

  const isSubscriber = !subLoading && hasAccess;
  const remainingPrompts = isSubscriber ? Infinity : Math.max(0, DEMO_DAILY_LIMIT - usedToday);
  const hasReachedLimit = !isSubscriber && usedToday >= DEMO_DAILY_LIMIT;

  return {
    isSubscriber,
    remainingPrompts,
    hasReachedLimit,
    dailyLimit: DEMO_DAILY_LIMIT,
    usedToday,
    incrementUsage,
    refetch: fetchUsage,
    loading: subLoading || !loaded,
  };
};
