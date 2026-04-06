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
  access_expires_at: string | null;
  created_at: string;
}

const CACHE_KEY = 'preceptor_sub_cache';

function getCachedSub(userId: string): Subscription | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.user_id === userId) return cached;
  } catch {}
  return null;
}

function setCachedSub(sub: Subscription | null) {
  try {
    if (sub) sessionStorage.setItem(CACHE_KEY, JSON.stringify(sub));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export const useSubscription = () => {
  const { user } = useAuth();
  const cached = user ? getCachedSub(user.id) : null;
  const [subscription, setSubscription] = useState<Subscription | null>(cached);
  const [loading, setLoading] = useState(!cached);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setCachedSub(null);
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
      setCachedSub(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      setCachedSub(null);
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
          setCachedSub(data);
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

  const isExpired = subscription?.access_expires_at 
    ? new Date(subscription.access_expires_at) < new Date() 
    : false;

  const hasAccess = (subscription?.status === 'active' || subscription?.plan_type === 'free_access') && !isExpired;

  return { subscription, loading, hasAccess, refetch: fetchSubscription };
};
