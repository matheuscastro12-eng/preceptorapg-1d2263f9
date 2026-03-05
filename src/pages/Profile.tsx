import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, Edit2, Save, X, Users, FileText, Star, MapPin, GraduationCap, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', university: '', semester: '' });
  const [stats, setStats] = useState({ fechamentos: 0, favoritos: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [publicFechamentos, setPublicFechamentos] = useState<any[]>([]);

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchStats();
      if (!isOwnProfile && user) fetchFollowStatus();
      fetchPublicFechamentos();
    }
  }, [targetUserId, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId!)
      .single();
    if (data) {
      setProfile(data as ProfileData);
      setEditForm({
        full_name: (data as any).full_name || '',
        bio: (data as any).bio || '',
        university: (data as any).university || '',
        semester: (data as any).semester || '',
      });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const [fechRes, favRes, followersRes, followingRes] = await Promise.all([
      supabase.from('fechamentos').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId!),
      supabase.from('fechamentos').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId!).eq('favorito', true),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', targetUserId!),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', targetUserId!),
    ]);
    setStats({
      fechamentos: fechRes.count || 0,
      favoritos: favRes.count || 0,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  const fetchFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user!.id)
      .eq('following_id', targetUserId!)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const fetchPublicFechamentos = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, fechamentos(*)')
      .eq('user_id', targetUserId!)
      .not('fechamento_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    setPublicFechamentos(data || []);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao enviar foto');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('user_id', user.id);
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    toast.success('Foto atualizada!');
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(editForm as any)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao salvar perfil');
      return;
    }
    setProfile(prev => prev ? { ...prev, ...editForm } : prev);
    setEditing(false);
    toast.success('Perfil atualizado!');
  };

  const handleFollow = async () => {
    if (!user || !targetUserId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
      setIsFollowing(false);
      setStats(s => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
  };

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) { navigate('/auth'); return null; }
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Perfil não encontrado</div>;

  const initials = (profile.full_name || profile.email || '?').slice(0, 2).toUpperCase();

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          {isOwnProfile && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
              <Edit2 className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8">
        {/* Avatar & Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-8">
          <div className="relative group mb-4">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {editing ? (
            <div className="w-full space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} />
              </div>
              <div>
                <Label>Faculdade</Label>
                <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" />
              </div>
              <div>
                <Label>Período/Semestre</Label>
                <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º período" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} className="flex-1 gap-1"><Save className="h-4 w-4" /> Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.email}</h1>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {profile.university && (
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {profile.university}</span>
                )}
                {profile.semester && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.semester}</span>
                )}
              </div>
              {!isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'} size="sm" className="gap-1">
                    {isFollowing ? <><UserMinus className="h-4 w-4" /> Seguindo</> : <><UserPlus className="h-4 w-4" /> Seguir</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/messages/${targetUserId}`)} className="gap-1">
                    <MessageCircle className="h-4 w-4" /> Mensagem
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Fechamentos', value: stats.fechamentos, icon: FileText },
            { label: 'Favoritos', value: stats.favoritos, icon: Star },
            { label: 'Seguidores', value: stats.followers, icon: Users },
            { label: 'Seguindo', value: stats.following, icon: Users },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center bg-secondary/30 border-border/30">
              <s.icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="fechamentos" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="fechamentos" className="flex-1">Fechamentos Públicos</TabsTrigger>
          </TabsList>
          <TabsContent value="fechamentos">
            {publicFechamentos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum fechamento compartilhado ainda.</p>
            ) : (
              <div className="space-y-3">
                {publicFechamentos.map((post) => (
                  <Card key={post.id} className="p-4 bg-secondary/20 border-border/30">
                    <h3 className="font-semibold text-foreground text-sm">{post.fechamentos?.tema}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{post.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </PageTransition>
  );
};

export default Profile;
