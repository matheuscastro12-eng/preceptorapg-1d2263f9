import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CACHE_KEY = 'preceptor_admin_cache';

function getCachedAdmin(userId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.uid === userId) return cached.isAdmin;
  } catch {}
  return null;
}

function setCachedAdmin(userId: string, isAdmin: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ uid: userId, isAdmin }));
  } catch {}
}

export const useAdmin = () => {
  const { user } = useAuth();
  const cached = user ? getCachedAdmin(user.id) : null;
  const [isAdmin, setIsAdmin] = useState(cached ?? false);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        const admin = !!data;
        setIsAdmin(admin);
        setCachedAdmin(user.id, admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
};
