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
import { ArrowLeft, Heart, MessageCircle, Send, Share2, Trash2, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';

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

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchMyFechamentos();
    }
  }, [user]);

  const fetchPosts = async () => {
    // Fetch posts with profiles
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!postsData) { setLoading(false); return; }

    // Get unique user IDs
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url, email, university').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Get likes counts
    const postIds = postsData.map(p => p.id);
    const { data: likes } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds);
    const { data: commentCounts } = await supabase.from('post_comments').select('post_id').in('post_id', postIds);

    // Get fechamento temas
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
    const { data: myProfile } = await supabase.from('profiles').select('user_id, full_name, avatar_url, email').eq('user_id', user.id).single();
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), { ...commentData, profile: myProfile as any }] }));
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/discover')}>
            Descobrir
          </Button>
        </div>
      </header>

      <main className="container max-w-xl px-4 py-6 space-y-6">
        {/* New Post */}
        <Card className="p-4 bg-secondary/20 border-border/30 space-y-3">
          <Textarea
            placeholder="Compartilhe algo com a comunidade..."
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            className="min-h-[80px] bg-background/50"
            maxLength={500}
          />
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
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-9 w-9 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                  >
                    <AvatarImage src={post.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {(post.profile?.full_name || post.profile?.email || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-foreground cursor-pointer hover:underline truncate"
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
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

                {/* Content */}
                <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

                {/* Attached fechamento */}
                {post.fechamento_tema && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Share2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-primary truncate">📝 {post.fechamento_tema}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={() => handleLike(post.id, post.is_liked)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                  >
                    <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                    {post.likes_count > 0 && post.likes_count}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count > 0 && post.comments_count}
                  </button>
                </div>

                {/* Comments */}
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
          <div className="text-center py-16">
            <Stethoscope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma publicação ainda.</p>
            <p className="text-muted-foreground/60 text-xs">Seja o primeiro a compartilhar!</p>
          </div>
        )}
      </main>
    </PageTransition>
  );
};



export default Feed;
