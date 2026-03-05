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
import { ArrowLeft, Heart, MessageCircle, Send, Share2, Trash2, Stethoscope, Camera, Edit2, Users, FileText, Star, GraduationCap, MapPin, Trophy, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { Label } from '@/components/ui/label';

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

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
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
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

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
    (likes || []).forEach(l => {
      likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
      if (l.user_id === user?.id) userLikesSet.add(l.post_id);
    });

    const commentsMap = new Map<string, number>();
    (commentCounts || []).forEach(c => {
      commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
    });

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
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: newPost.trim(),
      fechamento_id: selectedFechamento !== 'none' ? selectedFechamento : null,
    });
    if (error) { toast.error('Erro ao publicar'); }
    else { toast.success('Publicado!'); setNewPost(''); setSelectedFechamento('none'); fetchPosts(); }
    setPosting(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
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

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Menu
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Comunidade</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/messages')}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/discover')}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-xl px-4 py-6 space-y-5">
        {/* My Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 overflow-hidden">
            {editingProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                      <AvatarImage src={myProfile?.avatar_url || undefined} />
                      <AvatarFallback className="text-lg bg-primary/20 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                      <Camera className="h-3.5 w-3.5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Nome</Label>
                    <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Bio</Label>
                  <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} className="min-h-[60px] text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Faculdade</Label>
                    <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Período</Label>
                    <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º" className="h-8 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveProfile} className="flex-1">Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingProfile(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="relative group">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                    <AvatarImage src={myProfile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/20 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground truncate">
                        {myProfile?.full_name || user.email}
                      </h2>
                      {myProfile?.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{myProfile.bio}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        {myProfile?.university && (
                          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {myProfile.university}</span>
                        )}
                        {myProfile?.semester && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {myProfile.semester}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary" onClick={() => setEditingProfile(true)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
                    {[
                      { label: 'Fechamentos', value: stats.fechamentos, icon: FileText },
                      { label: 'Favoritos', value: stats.favoritos, icon: Star },
                      { label: 'Seguidores', value: stats.followers, icon: Users },
                      { label: 'Seguindo', value: stats.following, icon: Users },
                    ].map(s => (
                      <div key={s.label} className="text-center flex-1">
                        <p className="text-base font-bold text-foreground">{s.value}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* New Post */}
        <Card className="p-4 bg-secondary/20 border-border/30 space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={myProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Compartilhe algo com a comunidade..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              className="min-h-[70px] bg-background/50 text-sm"
              maxLength={500}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Select value={selectedFechamento} onValueChange={setSelectedFechamento}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Anexar fechamento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {fechamentos.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.tema.slice(0, 40)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handlePost} disabled={!newPost.trim() || posting} className="gap-1">
              <Send className="h-3.5 w-3.5" /> Publicar
            </Button>
          </div>
        </Card>

        {/* Posts */}
        <AnimatePresence>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 bg-secondary/10 border-border/30 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate(`/profile/${post.user_id}`)}>
                    <AvatarImage src={post.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {(post.profile?.full_name || post.profile?.email || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground cursor-pointer hover:underline truncate" onClick={() => navigate(`/profile/${post.user_id}`)}>
                      {post.profile?.full_name || post.profile?.email}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{timeAgo(post.created_at)}</span>
                      {post.profile?.university && <span>• {post.profile.university}</span>}
                    </div>
                  </div>
                  {post.user_id === user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

                {post.fechamento_tema && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Share2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-primary truncate">📝 {post.fechamento_tema}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                  <button onClick={() => handleLike(post.id, post.is_liked)} className={`flex items-center gap-1.5 text-xs transition-colors ${post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
                    <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                    {post.likes_count > 0 && post.likes_count}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count > 0 && post.comments_count}
                  </button>
                </div>

                {expandedComments === post.id && (
                  <div className="border-t border-border/20 pt-3 space-y-3">
                    {(comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 cursor-pointer" onClick={() => navigate(`/profile/${c.user_id}`)}>
                          <AvatarImage src={c.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {(c.profile?.full_name || c.profile?.email || '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-secondary/30 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-foreground">{c.profile?.full_name || c.profile?.email}</p>
                          <p className="text-xs text-muted-foreground">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 px-3" onClick={() => handleComment(post.id)} disabled={!newComment.trim()}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma publicação ainda.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Seja o primeiro a compartilhar!</p>
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Feed;
