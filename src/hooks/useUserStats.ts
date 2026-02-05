import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalFechamentos: number;
  totalFavoritos: number;
  thisMonth: number;
  loading: boolean;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalFechamentos: 0,
    totalFavoritos: 0,
    thisMonth: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        // Get total fechamentos
        const { count: totalCount } = await supabase
          .from('fechamentos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total favoritos
        const { count: favCount } = await supabase
          .from('fechamentos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('favorito', true);

        // Get this month's fechamentos
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthCount } = await supabase
          .from('fechamentos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        setStats({
          totalFechamentos: totalCount || 0,
          totalFavoritos: favCount || 0,
          thisMonth: monthCount || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    
    setStats(prev => ({ ...prev, loading: true }));
    
    try {
      const { count: totalCount } = await supabase
        .from('fechamentos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: favCount } = await supabase
        .from('fechamentos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('favorito', true);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthCount } = await supabase
        .from('fechamentos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalFechamentos: totalCount || 0,
        totalFavoritos: favCount || 0,
        thisMonth: monthCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return { stats, refresh };
};
