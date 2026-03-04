import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_type: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  granted_by: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Poll for subscription updates when returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success' && user) {
      // Poll every 2s for up to 30s waiting for webhook to process
      let attempts = 0;
      const maxAttempts = 15;
      const interval = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (data) {
          setSubscription(data);
          clearInterval(interval);
          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete('checkout');
          window.history.replaceState({}, '', url.pathname);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const hasAccess = subscription?.status === 'active' || subscription?.plan_type === 'free_access';

  return { subscription, loading, hasAccess, refetch: fetchSubscription };
};
