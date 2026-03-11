import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, UserPlus, UserMinus, Trophy, FileText, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  semester: string | null;
}

interface RankedUser extends UserProfile {
  fechamentos_count: number;
  followers_count: number;
  is_following: boolean;
}

const Discover = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RankedUser[]>([]);
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchRanking();
      fetchMyFollowing();
    }
  }, [user]);

  const fetchMyFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    setMyFollowing(new Set((data || []).map(f => f.following_id)));
  };

  const fetchRanking = async () => {
    // Get all profiles
    const { data: profiles } = await (supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url, university, semester') as any);
    if (!profiles) { setLoading(false); return; }

    const userIds = profiles.map(p => p.user_id);
    
    // Count fechamentos per user
    const { data: fechamentos } = await supabase.from('fechamentos').select('user_id');
    const fechMap = new Map<string, number>();
    (fechamentos || []).forEach(f => fechMap.set(f.user_id, (fechMap.get(f.user_id) || 0) + 1));

    // Count followers per user
    const { data: follows } = await supabase.from('follows').select('following_id');
    const followMap = new Map<string, number>();
    (follows || []).forEach(f => followMap.set(f.following_id, (followMap.get(f.following_id) || 0) + 1));

    const ranked: RankedUser[] = profiles
      .filter(p => p.user_id !== user?.id)
      .map(p => ({
        ...p,
        fechamentos_count: fechMap.get(p.user_id) || 0,
        followers_count: followMap.get(p.user_id) || 0,
        is_following: myFollowing.has(p.user_id),
      } as RankedUser))
      .sort((a, b) => b.fechamentos_count - a.fechamentos_count);

    setRanking(ranked);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    
    const { data } = await (supabase
      .from('public_profiles' as any)
      .select('user_id, full_name, avatar_url, university, semester')
      .or(`full_name.ilike.%${query}%,university.ilike.%${query}%`)
      .neq('user_id', user?.id || '')
      .limit(20) as any);

    setSearchResults((data || []).map(p => ({
      ...p,
      fechamentos_count: 0,
      followers_count: 0,
      is_following: myFollowing.has(p.user_id),
    } as RankedUser)));
    setSearching(false);
  };

  const handleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setMyFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setMyFollowing(prev => new Set(prev).add(targetId));
    }
    // Update local state
    const updateList = (list: RankedUser[]) => list.map(u => u.user_id === targetId ? { ...u, is_following: !isFollowing, followers_count: u.followers_count + (isFollowing ? -1 : 1) } : u);
    setRanking(updateList);
    setSearchResults(updateList);
  };

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const UserCard = ({ u, rank }: { u: RankedUser; rank?: number }) => (
    <Card className="p-3 bg-secondary/10 border-border/30 flex items-center gap-3">
      {rank !== undefined && (
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank < 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
        </div>
      )}
      <Avatar className="h-10 w-10 cursor-pointer shrink-0" onClick={() => navigate(`/profile/${u.user_id}`)}>
        <AvatarImage src={u.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {(u.full_name || u.email).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${u.user_id}`)}>
        <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {u.university && <span>{u.university}</span>}
          {rank !== undefined && (
            <>
              <span>• {u.fechamentos_count} fechamentos</span>
              <span>• {u.followers_count} seguidores</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant={myFollowing.has(u.user_id) ? 'outline' : 'default'}
        size="sm"
        className="shrink-0 h-8 text-xs gap-1"
        onClick={() => handleFollow(u.user_id, myFollowing.has(u.user_id))}
      >
        {myFollowing.has(u.user_id) ? <><UserMinus className="h-3 w-3" /> Seguindo</> : <><UserPlus className="h-3 w-3" /> Seguir</>}
      </Button>
    </Card>
  );

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/feed')} className="gap-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estudantes, faculdades..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </header>

      <main className="container max-w-xl px-4 py-6">
        {searchQuery ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{searchResults.length} resultados</p>
            {searchResults.map(u => <UserCard key={u.user_id} u={u} />)}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Ranking de Estudantes</h2>
            </div>
            <div className="space-y-2">
              {ranking.map((u, i) => <UserCard key={u.user_id} u={u} rank={i} />)}
            </div>
            {ranking.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum estudante encontrado.</p>
            )}
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Discover;
