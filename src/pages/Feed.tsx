import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Heart, MessageCircle, Send, Trash2,
  Stethoscope, Camera, Edit2, Users, FileText, Star,
  GraduationCap, MapPin, Trophy, Search, Home, Compass,
  Mail, User, X, Save, Plus, TrendingUp, BookOpen, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';

// ===== TYPES =====
interface ProfileData {
  user_id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  university: string | null;
  semester: string | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  fechamento_id: string | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; email: string; university: string | null };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  fechamento_tema?: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; email: string };
}

type ActiveTab = 'feed' | 'discover' | 'profile';

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [fechamentos, setFechamentos] = useState<{ id: string; tema: string }[]>([]);
  const [selectedFechamento, setSelectedFechamento] = useState<string>('none');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', university: '', semester: '' });
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ fechamentos: 0, favoritos: 0, followers: 0, following: 0 });
  const [showNewPost, setShowNewPost] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyProfile();
      fetchPosts();
      fetchMyFechamentos();
      fetchMyStats();
    }
  }, [user]);

  const fetchMyProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setMyProfile(data as ProfileData);
      setEditForm({
        full_name: (data as any).full_name || '',
        bio: (data as any).bio || '',
        university: (data as any).university || '',
        semester: (data as any).semester || '',
      });
    }
  };

  const fetchMyStats = async () => {
    if (!user) return;
    const [fechRes, favRes, followersRes, followingRes] = await Promise.all([
      supabase.from('fechamentos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('fechamentos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('favorito', true),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]);
    setStats({
      fechamentos: fechRes.count || 0,
      favoritos: favRes.count || 0,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error('Erro ao enviar foto'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('user_id', user.id);
    setMyProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    toast.success('Foto atualizada!');
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(editForm as any).eq('user_id', user.id);
    if (error) { toast.error('Erro ao salvar perfil'); return; }
    setMyProfile(prev => prev ? { ...prev, ...editForm } : prev);
    setEditingProfile(false);
    toast.success('Perfil atualizado!');
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (!postsData || postsData.length === 0) { setPosts([]); setLoading(false); return; }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const postIds = postsData.map(p => p.id);
    const fechamentoIds = postsData.filter(p => p.fechamento_id).map(p => p.fechamento_id!);

    const [profilesRes, likesRes, commentCountsRes, fechsRes] = await Promise.all([
      supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url, university').in('user_id', userIds),
      supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('post_comments').select('post_id').in('post_id', postIds),
      fechamentoIds.length > 0
        ? supabase.from('fechamentos').select('id, tema').in('id', fechamentoIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const fechamentoMap = new Map((fechsRes.data || []).map(f => [f.id, f.tema]));
    const likesMap = new Map<string, number>();
    const userLikesSet = new Set<string>();
    (likesRes.data || []).forEach(l => { likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1); if (l.user_id === user?.id) userLikesSet.add(l.post_id); });
    const commentsMap = new Map<string, number>();
    (commentCountsRes.data || []).forEach(c => { commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1); });

    setPosts(postsData.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) as any,
      likes_count: likesMap.get(p.id) || 0,
      comments_count: commentsMap.get(p.id) || 0,
      is_liked: userLikesSet.has(p.id),
      fechamento_tema: p.fechamento_id ? fechamentoMap.get(p.fechamento_id) || null : null,
    })));
    setLoading(false);
  };

  const fetchMyFechamentos = async () => {
    if (!user) return;
    const { data } = await supabase.from('fechamentos').select('id, tema').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setFechamentos(data || []);
  };

  const handlePost = async () => {
    if (!user || !newPost.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content: newPost.trim(), fechamento_id: selectedFechamento !== 'none' ? selectedFechamento : null });
    if (error) { toast.error('Erro ao publicar'); }
    else { toast.success('Publicado!'); setNewPost(''); setSelectedFechamento('none'); setShowNewPost(false); fetchPosts(); }
    setPosting(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) { await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id); }
    else { await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id }); }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p));
  };

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post removido');
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) { setExpandedComments(null); return; }
    setExpandedComments(postId);
    if (!comments[postId]) {
      const { data: commentsData } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
      if (commentsData && commentsData.length > 0) {
        const uids = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url').in('user_id', uids);
        const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setComments(prev => ({ ...prev, [postId]: commentsData.map(c => ({ ...c, profile: pMap.get(c.user_id) as any })) }));
      } else {
        setComments(prev => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;
    const { data: commentData, error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content: newComment.trim() }).select().single();
    if (error) { toast.error('Erro ao comentar'); return; }
    const { data: prof } = await supabase.from('profiles').select('user_id, full_name, avatar_url').eq('user_id', user.id).single();
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), { ...commentData, profile: prof as any }] }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    setNewComment('');
  };

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const initials = (myProfile?.full_name || myProfile?.email || user.email || '?').slice(0, 2).toUpperCase();
  const myPosts = posts.filter(p => p.user_id === user.id);

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b border-border/15 backdrop-blur-xl bg-background/85">
        <div className="flex h-12 items-center justify-between px-4 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Menu
          </Button>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground">Comunidade APG</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate('/messages')}>
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-border/10">
          {[
            { id: 'feed' as ActiveTab, icon: Home, label: 'Feed' },
            { id: 'discover' as ActiveTab, icon: Compass, label: 'Explorar' },
            { id: 'profile' as ActiveTab, icon: User, label: 'Meu Perfil' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="min-h-[calc(100vh-6rem)]">

        {/* ===== FEED TAB ===== */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0 lg:gap-6 lg:px-8 lg:py-6">
            {/* Feed Column */}
            <div>
              {/* Compose Bar */}
              <div className="p-4 border-b border-border/10 lg:border lg:border-border/20 lg:rounded-2xl lg:mb-4 bg-card/50">
                <div className="flex gap-3 items-start">
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={myProfile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  {showNewPost ? (
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="Compartilhe seus estudos, dúvidas ou conquistas..."
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        className="min-h-[80px] bg-secondary/20 border-border/20 text-sm resize-none"
                        maxLength={500}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <Select value={selectedFechamento} onValueChange={setSelectedFechamento}>
                          <SelectTrigger className="w-[200px] h-8 text-xs border-border/20">
                            <SelectValue placeholder="📎 Anexar fechamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {fechamentos.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.tema.slice(0, 40)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setShowNewPost(false); setNewPost(''); }}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handlePost} disabled={!newPost.trim() || posting} className="gap-1 rounded-full px-4">
                            <Send className="h-3.5 w-3.5" /> Publicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewPost(true)}
                      className="flex-1 text-left text-sm text-muted-foreground bg-secondary/20 rounded-full px-4 py-2 hover:bg-secondary/40 transition-colors"
                    >
                      No que você está estudando?
                    </button>
                  )}
                </div>
              </div>

              {/* Posts */}
              <div className="divide-y divide-border/8">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-4 lg:p-5 hover:bg-secondary/5 transition-colors"
                  >
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <Avatar className="h-9 w-9 cursor-pointer ring-1 ring-border/20" onClick={() => navigate(`/profile/${post.user_id}`)}>
                        <AvatarImage src={post.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {(post.profile?.full_name || post.profile?.email || '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                            onClick={() => navigate(`/profile/${post.user_id}`)}
                          >
                            {post.profile?.full_name || post.profile?.email || 'Usuário'}
                          </span>
                          {post.profile?.university && (
                            <span className="text-[10px] text-muted-foreground bg-secondary/40 px-1.5 py-0.5 rounded-full hidden sm:inline">
                              {post.profile.university}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                      </div>
                      {post.user_id === user?.id && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-12">{post.content}</p>

                    {/* Fechamento Card */}
                    {post.fechamento_tema && (
                      <div className="ml-12 mt-2 flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => {
                          if (post.fechamento_id) navigate(`/library`);
                        }}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary truncate">{post.fechamento_tema}</p>
                          <p className="text-[10px] text-muted-foreground">Fechamento compartilhado</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-5 mt-3 pl-12">
                      <button
                        onClick={() => handleLike(post.id, post.is_liked)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-all ${post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
                      >
                        <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                        {post.likes_count > 0 && <span>{post.likes_count}</span>}
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {post.comments_count > 0 && <span>{post.comments_count}</span>}
                      </button>
                    </div>

                    {/* Comments */}
                    {expandedComments === post.id && (
                      <div className="mt-3 ml-12 space-y-2.5">
                        {(comments[post.id] || []).map((c: any) => (
                          <div key={c.id} className="flex gap-2 items-start">
                            <Avatar className="h-6 w-6 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${c.user_id}`)}>
                              <AvatarImage src={c.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px] bg-secondary text-muted-foreground">
                                {(c.profile?.full_name || c.profile?.email || '?').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-secondary/30 rounded-xl px-3 py-1.5">
                              <span className="text-xs font-bold text-foreground mr-1">{c.profile?.full_name || c.profile?.email}</span>
                              <span className="text-xs text-muted-foreground">{c.content}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Comentar..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            className="h-8 text-xs rounded-full bg-secondary/20 border-border/15 px-3"
                          />
                          <Button size="sm" variant="ghost" className="h-8 px-3 text-primary font-bold text-xs shrink-0" onClick={() => handleComment(post.id)} disabled={!newComment.trim()}>
                            Enviar
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {posts.length === 0 && (
                <div className="text-center py-20 px-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mx-auto mb-5">
                    <Stethoscope className="h-10 w-10 text-primary/50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">A comunidade está começando!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Seja o primeiro a compartilhar seus estudos e ajudar outros estudantes.</p>
                  <Button className="mt-5 rounded-full gap-1" onClick={() => setShowNewPost(true)}>
                    <Plus className="h-4 w-4" /> Criar publicação
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar (desktop only) */}
            <aside className="hidden lg:block space-y-4 sticky top-28 self-start">
              {/* My Card */}
              <Card className="p-4 border-border/15 bg-card/80">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 cursor-pointer" onClick={() => setActiveTab('profile')}>
                    <AvatarImage src={myProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{myProfile?.full_name || user.email}</p>
                    {myProfile?.university && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {myProfile.university}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'Fechamentos', value: stats.fechamentos },
                    { label: 'Seguidores', value: stats.followers },
                    { label: 'Seguindo', value: stats.following },
                  ].map(s => (
                    <div key={s.label} className="text-center py-2 rounded-lg bg-secondary/20">
                      <p className="text-sm font-bold text-foreground">{s.value}</p>
                      <p className="text-[9px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-4 border-border/15 bg-card/80">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" /> Sua Atividade
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Fechamentos</span>
                    <span className="text-xs font-bold text-foreground">{stats.fechamentos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Favoritos</span>
                    <span className="text-xs font-bold text-foreground">{stats.favoritos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Seguidores</span>
                    <span className="text-xs font-bold text-foreground">{stats.followers}</span>
                  </div>
                </div>
              </Card>

              {/* Quick Links */}
              <Card className="p-4 border-border/15 bg-card/80">
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-8 text-muted-foreground hover:text-foreground" onClick={() => navigate('/messages')}>
                    <Mail className="h-3.5 w-3.5" /> Mensagens Diretas
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-8 text-muted-foreground hover:text-foreground" onClick={() => navigate('/library')}>
                    <BookOpen className="h-3.5 w-3.5" /> Minha Biblioteca
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        )}

        {/* ===== DISCOVER TAB ===== */}
        {activeTab === 'discover' && (
          <DiscoverSection user={user} navigate={navigate} />
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
            {/* Profile Hero */}
            <div className="relative">
              <div className="h-28 sm:h-36 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10" />
              <div className="px-4 sm:px-6 -mt-12 sm:-mt-14 relative">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="relative shrink-0">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl p-[3px] bg-gradient-to-br from-primary to-accent shadow-xl">
                      <Avatar className="h-full w-full rounded-[calc(1rem-3px)] border-3 border-background">
                        <AvatarImage src={myProfile?.avatar_url || undefined} className="rounded-[calc(1rem-3px)]" />
                        <AvatarFallback className="text-2xl bg-primary/15 text-primary font-bold rounded-[calc(1rem-3px)]">{initials}</AvatarFallback>
                      </Avatar>
                    </div>
                    <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg border-2 border-background hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>

                  <div className="flex-1 pb-4 sm:pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{myProfile?.full_name || user.email}</h1>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {myProfile?.university && (
                            <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-primary" /> {myProfile.university}</span>
                          )}
                          {myProfile?.semester && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {myProfile.semester}</span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0" onClick={() => setEditingProfile(true)}>
                        <Edit2 className="h-3 w-3" /> Editar
                      </Button>
                    </div>
                    {myProfile?.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">{myProfile.bio}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <AnimatePresence>
              {editingProfile && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 space-y-3 bg-secondary/10 border-y border-border/15 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome</label>
                        <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome completo" className="h-9 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Faculdade</label>
                        <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" className="h-9 text-sm mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bio</label>
                      <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} className="min-h-[60px] text-sm mt-1" />
                    </div>
                    <div className="w-40">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Período</label>
                      <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º período" className="h-9 text-sm mt-1" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSaveProfile} className="gap-1"><Save className="h-3.5 w-3.5" /> Salvar alterações</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)}>Cancelar</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-0 border-y border-border/15 mt-4">
              {[
                { label: 'Fechamentos', value: stats.fechamentos, icon: FileText },
                { label: 'Favoritos', value: stats.favoritos, icon: Star },
                { label: 'Seguidores', value: stats.followers, icon: Users },
                { label: 'Seguindo', value: stats.following, icon: Users },
              ].map((s, i) => (
                <div key={s.label} className={`text-center py-4 ${i < 3 ? 'border-r border-border/15' : ''}`}>
                  <s.icon className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* My Posts */}
            <div className="px-4 sm:px-6 py-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Minhas publicações</h3>
              {myPosts.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-border/30">
                  <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Você ainda não publicou nada</p>
                  <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => { setActiveTab('feed'); setShowNewPost(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Criar publicação
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPosts.map(post => (
                    <Card key={post.id} className="p-4 border-border/15 bg-card/60 hover:bg-card transition-colors">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                      {post.fechamento_tema && (
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-primary font-medium truncate">{post.fechamento_tema}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span>{timeAgo(post.created_at)}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments_count}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
};

/* ===== DISCOVER SECTION ===== */
const DiscoverSection = ({ user, navigate }: { user: any; navigate: any }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    setMyFollowing(new Set((data || []).map((f: any) => f.following_id)));
  };

  const fetchRanking = async () => {
    const [profilesRes, fechamentosRes, followsRes] = await Promise.all([
      supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url, university, semester'),
      supabase.from('fechamentos').select('user_id'),
      supabase.from('follows').select('following_id'),
    ]);

    const profiles = profilesRes.data || [];
    const fechMap = new Map<string, number>();
    (fechamentosRes.data || []).forEach((f: any) => fechMap.set(f.user_id, (fechMap.get(f.user_id) || 0) + 1));
    const followMap = new Map<string, number>();
    (followsRes.data || []).forEach((f: any) => followMap.set(f.following_id, (followMap.get(f.following_id) || 0) + 1));

    setRanking(
      profiles
        .filter(p => p.user_id !== user.id)
        .map(p => ({ ...p, fechamentos_count: fechMap.get(p.user_id) || 0, followers_count: followMap.get(p.user_id) || 0 }))
        .sort((a, b) => b.fechamentos_count - a.fechamentos_count)
    );
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('user_id, email, full_name, avatar_url, university')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,university.ilike.%${query}%`)
      .neq('user_id', user.id).limit(20);
    setResults(data || []);
  };

  const handleFollow = async (targetId: string) => {
    if (myFollowing.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setMyFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setMyFollowing(prev => new Set(prev).add(targetId));
    }
  };

  const dataToShow = searchQuery ? results : ranking;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-0 lg:gap-8 lg:px-8 lg:py-6">
      {/* Search & Users */}
      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudantes, faculdades..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-secondary/20 border-border/15 text-sm"
          />
        </div>

        {!searchQuery && (
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Ranking de Estudantes</h2>
          </div>
        )}

        {searchQuery && (
          <p className="text-xs text-muted-foreground mb-4">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
        )}

        {loading && !searchQuery ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <div className="space-y-1">
            {dataToShow.map((u: any, i: number) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/10 transition-colors">
                {!searchQuery && (
                  <span className={`text-sm font-bold w-7 text-center shrink-0 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                )}
                <Avatar className="h-10 w-10 cursor-pointer shrink-0" onClick={() => navigate(`/profile/${u.user_id}`)}>
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${u.user_id}`)}>
                  <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.university || u.email}
                    {!searchQuery && ` · ${u.fechamentos_count} fechamentos · ${u.followers_count} seguidores`}
                  </p>
                </div>
                <Button
                  variant={myFollowing.has(u.user_id) ? 'outline' : 'default'}
                  size="sm"
                  className="h-8 text-xs rounded-lg shrink-0"
                  onClick={() => handleFollow(u.user_id)}
                >
                  {myFollowing.has(u.user_id) ? 'Seguindo' : 'Seguir'}
                </Button>
              </div>
            ))}
            {dataToShow.length === 0 && !loading && (
              <div className="text-center py-12">
                <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum estudante encontrado'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar info - desktop */}
      <div className="hidden lg:block p-6">
        <Card className="p-5 border-border/15 bg-gradient-to-br from-primary/10 to-accent/5">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Como funciona o ranking?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O ranking é baseado na quantidade de fechamentos criados por cada estudante.
            Quanto mais você estuda e gera conteúdo, mais sobe no ranking da comunidade!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Feed;
