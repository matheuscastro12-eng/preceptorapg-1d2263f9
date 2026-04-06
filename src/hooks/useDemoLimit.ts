import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_LIMITS: Record<string, number> = {
  'ai-chat': 5,
  'generate-flashcards': 1,
};

export const useDemoLimit = (functionName = 'ai-chat', dailyLimit?: number) => {
  const { user } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [usedToday, setUsedToday] = useState(0);
  const [loaded, setLoaded] = useState(hasAccess);

  const limit = dailyLimit ?? DEFAULT_LIMITS[functionName] ?? 1;

  const fetchUsage = useCallback(async () => {
    if (!user || hasAccess) {
      setUsedToday(0);
      setLoaded(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', functionName)
      .gte('created_at', `${today}T00:00:00.000Z`);

    setUsedToday(count ?? 0);
    setLoaded(true);
  }, [user, functionName, hasAccess]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementUsage = useCallback(() => {
    if (!user || hasAccess) return;
    setUsedToday(prev => prev + 1);
  }, [user, hasAccess]);

  const isSubscriber = !subLoading && hasAccess;
  const remainingPrompts = isSubscriber ? Infinity : Math.max(0, limit - usedToday);
  const hasReachedLimit = !isSubscriber && usedToday >= limit;

  return {
    isSubscriber,
    remainingPrompts,
    hasReachedLimit,
    dailyLimit: limit,
    usedToday,
    incrementUsage,
    refetch: fetchUsage,
    loading: subLoading || !loaded,
  };
};
