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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Heart, MessageCircle, Send, Share2, Trash2,
  Stethoscope, Camera, Edit2, Users, FileText, Star,
  GraduationCap, MapPin, Trophy, Search, Home, Compass,
  Mail, User, Grid3X3, Bookmark, Settings, X, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';

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

type ActiveTab = 'feed' | 'discover' | 'messages' | 'profile';

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
    if (!postsData) { setLoading(false); return; }
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url, email, university').in('user_id', userIds.length > 0 ? userIds : ['_']);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const postIds = postsData.map(p => p.id);
    const { data: likes } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds.length > 0 ? postIds : ['_']);
    const { data: commentCounts } = await supabase.from('post_comments').select('post_id').in('post_id', postIds.length > 0 ? postIds : ['_']);
    const fechamentoIds = postsData.filter(p => p.fechamento_id).map(p => p.fechamento_id!);
    let fechamentoMap = new Map<string, string>();
    if (fechamentoIds.length > 0) {
      const { data: fechs } = await supabase.from('fechamentos').select('id, tema').in('id', fechamentoIds);
      fechamentoMap = new Map((fechs || []).map(f => [f.id, f.tema]));
    }
    const likesMap = new Map<string, number>();
    const userLikesSet = new Set<string>();
    (likes || []).forEach(l => { likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1); if (l.user_id === user?.id) userLikesSet.add(l.post_id); });
    const commentsMap = new Map<string, number>();
    (commentCounts || []).forEach(c => { commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1); });
    const enriched: Post[] = postsData.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) as any,
      likes_count: likesMap.get(p.id) || 0,
      comments_count: commentsMap.get(p.id) || 0,
      is_liked: userLikesSet.has(p.id),
      fechamento_tema: p.fechamento_id ? fechamentoMap.get(p.fechamento_id) || null : null,
    }));
    setPosts(enriched);
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
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url, email').in('user_id', uids);
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
    const { data: prof } = await supabase.from('profiles').select('user_id, full_name, avatar_url, email').eq('user_id', user.id).single();
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
    <PageTransition className="min-h-screen bg-background pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-12 items-center justify-between px-4 max-w-xl">
          <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground tracking-tight">Comunidade</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setShowNewPost(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container max-w-xl px-0">
        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
            {/* Profile Header - Instagram Style */}
            <div className="py-5">
              <div className="flex items-center gap-5 mb-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-20 w-20 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
                    <Avatar className="h-full w-full border-2 border-background">
                      <AvatarImage src={myProfile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xl bg-primary/20 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <label className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg border-2 border-background">
                    <Camera className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>

                {/* Stats Row */}
                <div className="flex-1 flex justify-around">
                  {[
                    { label: 'Posts', value: myPosts.length },
                    { label: 'Seguidores', value: stats.followers },
                    { label: 'Seguindo', value: stats.following },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name & Bio */}
              {editingProfile ? (
                <div className="space-y-3 mt-2">
                  <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" className="h-9 text-sm" />
                  <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio..." maxLength={200} className="min-h-[60px] text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Faculdade" className="h-9 text-sm" />
                    <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Período" className="h-9 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} className="flex-1 gap-1"><Save className="h-3.5 w-3.5" /> Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingProfile(false)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  <h2 className="text-sm font-bold text-foreground">{myProfile?.full_name || user.email}</h2>
                  {myProfile?.bio && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{myProfile.bio}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    {myProfile?.university && (
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-primary" /> {myProfile.university}</span>
                    )}
                    {myProfile?.semester && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {myProfile.semester}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold" onClick={() => setEditingProfile(true)}>
                      Editar perfil
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold" onClick={() => navigate('/discover')}>
                      Descobrir pessoas
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Card className="p-3 bg-secondary/20 border-border/20 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{stats.fechamentos}</p>
                  <p className="text-[10px] text-muted-foreground">Fechamentos</p>
                </div>
              </Card>
              <Card className="p-3 bg-secondary/20 border-border/20 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{stats.favoritos}</p>
                  <p className="text-[10px] text-muted-foreground">Favoritos</p>
                </div>
              </Card>
            </div>

            {/* Profile Sub-tabs */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full bg-transparent border-b border-border/20 rounded-none h-10 p-0">
                <TabsTrigger value="posts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10">
                  <Bookmark className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="mt-0">
                {myPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid3X3 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma publicação ainda</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setActiveTab('feed'); setShowNewPost(true); }}>
                      Criar primeiro post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 py-3">
                    {myPosts.map(post => (
                      <PostCard key={post.id} post={post} user={user} timeAgo={timeAgo} onLike={handleLike} onDelete={handleDelete}
                        onToggleComments={toggleComments} expandedComments={expandedComments} comments={comments}
                        newComment={newComment} setNewComment={setNewComment} onComment={handleComment} navigate={navigate} />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="saved" className="mt-0">
                <div className="text-center py-12">
                  <Bookmark className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Itens salvos aparecerão aqui</p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* ===== FEED TAB ===== */}
        {activeTab === 'feed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
            {/* Stories-like top bar with users */}
            <div className="px-4 py-3 border-b border-border/10 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setActiveTab('profile')}>
                  <div className="h-14 w-14 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
                    <Avatar className="h-full w-full border-2 border-background">
                      <AvatarImage src={myProfile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Você</span>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="divide-y divide-border/10">
              {posts.map(post => (
                <PostCard key={post.id} post={post} user={user} timeAgo={timeAgo} onLike={handleLike} onDelete={handleDelete}
                  onToggleComments={toggleComments} expandedComments={expandedComments} comments={comments}
                  newComment={newComment} setNewComment={setNewComment} onComment={handleComment} navigate={navigate} />
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="h-16 w-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-foreground font-semibold">Bem-vindo à Comunidade</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">Compartilhe seus estudos e interaja com outros estudantes de medicina.</p>
                <Button size="sm" className="mt-4" onClick={() => setShowNewPost(true)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Criar publicação
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== DISCOVER TAB ===== */}
        {activeTab === 'discover' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DiscoverSection user={user} navigate={navigate} />
          </motion.div>
        )}

        {/* ===== MESSAGES TAB ===== */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-foreground font-semibold">Mensagens Diretas</p>
              <p className="text-muted-foreground text-xs mt-1">Converse com outros estudantes</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => navigate('/messages')}>
                Abrir Mensagens
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border/20">
              <Button variant="ghost" size="sm" onClick={() => setShowNewPost(false)} className="text-muted-foreground">Cancelar</Button>
              <span className="text-sm font-bold text-foreground">Nova publicação</span>
              <Button size="sm" onClick={handlePost} disabled={!newPost.trim() || posting} className="font-semibold">
                Publicar
              </Button>
            </div>
            <div className="p-4 max-w-xl mx-auto">
              <div className="flex gap-3 items-start">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={myProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-2">{myProfile?.full_name || user.email}</p>
                  <Textarea
                    placeholder="No que você está pensando?"
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    className="min-h-[120px] bg-transparent border-none shadow-none text-sm p-0 focus-visible:ring-0 resize-none"
                    maxLength={500}
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/20">
                <Select value={selectedFechamento} onValueChange={setSelectedFechamento}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="📎 Anexar um fechamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {fechamentos.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.tema.slice(0, 50)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Instagram Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/20 bg-background/95 backdrop-blur-xl">
        <div className="max-w-xl mx-auto flex items-center justify-around h-14">
          {[
            { id: 'feed' as ActiveTab, icon: Home, label: 'Feed' },
            { id: 'discover' as ActiveTab, icon: Compass, label: 'Explorar' },
            { id: 'messages' as ActiveTab, icon: Mail, label: 'Chat' },
            { id: 'profile' as ActiveTab, icon: User, label: 'Perfil' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </PageTransition>
  );
};

/* ===== Post Card Component ===== */
const PostCard = ({ post, user, timeAgo, onLike, onDelete, onToggleComments, expandedComments, comments, newComment, setNewComment, onComment, navigate }: any) => (
  <div className="px-4 py-3">
    {/* Post Header */}
    <div className="flex items-center gap-3 mb-2.5">
      <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate(`/profile/${post.user_id}`)}>
        <AvatarImage src={post.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
          {(post.profile?.full_name || post.profile?.email || '?').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-foreground cursor-pointer hover:text-primary truncate" onClick={() => navigate(`/profile/${post.user_id}`)}>
            {post.profile?.full_name || post.profile?.email}
          </p>
          <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
        </div>
        {post.profile?.university && (
          <p className="text-[10px] text-muted-foreground -mt-0.5">{post.profile.university}</p>
        )}
      </div>
      {post.user_id === user?.id && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(post.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>

    {/* Content */}
    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-2">{post.content}</p>

    {/* Attached Fechamento */}
    {post.fechamento_tema && (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/8 border border-primary/15 mb-2">
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-primary truncate">{post.fechamento_tema}</span>
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center gap-5 pt-1">
      <button onClick={() => onLike(post.id, post.is_liked)} className={`flex items-center gap-1.5 text-xs transition-all ${post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
        <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current scale-110' : ''} transition-transform`} />
      </button>
      <button onClick={() => onToggleComments(post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <MessageCircle className="h-5 w-5" />
      </button>
      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Send className="h-5 w-5" />
      </button>
    </div>

    {/* Likes count */}
    {post.likes_count > 0 && (
      <p className="text-xs font-bold text-foreground mt-1.5">{post.likes_count} curtida{post.likes_count > 1 ? 's' : ''}</p>
    )}

    {/* Comments preview */}
    {post.comments_count > 0 && expandedComments !== post.id && (
      <button onClick={() => onToggleComments(post.id)} className="text-xs text-muted-foreground mt-1 hover:text-foreground">
        Ver {post.comments_count} comentário{post.comments_count > 1 ? 's' : ''}
      </button>
    )}

    {/* Expanded Comments */}
    {expandedComments === post.id && (
      <div className="mt-3 space-y-2.5">
        {(comments[post.id] || []).map((c: any) => (
          <div key={c.id} className="flex gap-2 items-start">
            <Avatar className="h-6 w-6 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${c.user_id}`)}>
              <AvatarImage src={c.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                {(c.profile?.full_name || c.profile?.email || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs">
                <span className="font-bold text-foreground mr-1">{c.profile?.full_name || c.profile?.email}</span>
                <span className="text-muted-foreground">{c.content}</span>
              </p>
            </div>
          </div>
        ))}
        <div className="flex gap-2 items-center mt-2">
          <Input
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e: any) => setNewComment(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && onComment(post.id)}
            className="h-8 text-xs border-none bg-secondary/30 rounded-full px-3"
          />
          <Button size="sm" variant="ghost" className="h-8 px-2 text-primary font-bold text-xs" onClick={() => onComment(post.id)} disabled={!newComment.trim()}>
            Publicar
          </Button>
        </div>
      </div>
    )}
  </div>
);

/* ===== Discover Section (inline) ===== */
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
    const { data: profiles } = await supabase.from('profiles').select('user_id, email, full_name, avatar_url, university, semester');
    if (!profiles) { setLoading(false); return; }
    const { data: fechamentos } = await supabase.from('fechamentos').select('user_id');
    const fechMap = new Map<string, number>();
    (fechamentos || []).forEach((f: any) => fechMap.set(f.user_id, (fechMap.get(f.user_id) || 0) + 1));
    const { data: follows } = await supabase.from('follows').select('following_id');
    const followMap = new Map<string, number>();
    (follows || []).forEach((f: any) => followMap.set(f.following_id, (followMap.get(f.following_id) || 0) + 1));
    const ranked = profiles.filter(p => p.user_id !== user.id).map(p => ({
      ...p,
      fechamentos_count: fechMap.get(p.user_id) || 0,
      followers_count: followMap.get(p.user_id) || 0,
    })).sort((a, b) => b.fechamentos_count - a.fechamentos_count);
    setRanking(ranked);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('user_id, email, full_name, avatar_url, university').or(`full_name.ilike.%${query}%,email.ilike.%${query}%,university.ilike.%${query}%`).neq('user_id', user.id).limit(20);
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

  const UserRow = ({ u, rank }: { u: any; rank?: number }) => (
    <div className="flex items-center gap-3 py-2.5">
      {rank !== undefined && (
        <span className={`text-xs font-bold w-6 text-center ${rank < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
        </span>
      )}
      <Avatar className="h-10 w-10 cursor-pointer" onClick={() => navigate(`/profile/${u.user_id}`)}>
        <AvatarImage src={u.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {(u.full_name || u.email).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${u.user_id}`)}>
        <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {u.university || u.email}
          {rank !== undefined && ` · ${u.fechamentos_count} fechamentos`}
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
  );

  return (
    <div className="px-4 py-4">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar estudantes, faculdades..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-secondary/30 border-border/20"
        />
      </div>

      {searchQuery ? (
        <div>
          <p className="text-xs text-muted-foreground mb-3">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map(u => <UserRow key={u.user_id} u={u} />)}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Ranking de Estudantes</h2>
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <div className="divide-y divide-border/10">
              {ranking.map((u, i) => <UserRow key={u.user_id} u={u} rank={i} />)}
            </div>
          )}
          {!loading && ranking.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum estudante encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
