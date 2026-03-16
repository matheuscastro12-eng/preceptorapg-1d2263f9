import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, Edit2, Save, X, Users, FileText, Star, MapPin, GraduationCap, UserPlus, UserMinus, MessageCircle, TrendingUp, Target, Brain, BookOpen, Calendar, BarChart3, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

type Profile = Tables<'profiles'>;

interface ProfileData {
  user_id: string;
  email?: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  university: string | null;
  semester: string | null;
}

interface AttemptRow {
  created_at: string;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  source: string;
  modo: string;
}

interface WeeklyData {
  week: string;
  acertos: number;
  total: number;
  percentage: number;
}

const chartConfig: ChartConfig = {
  acertos: { label: 'Acertos', color: 'hsl(var(--primary))' },
  total: { label: 'Total', color: 'hsl(var(--muted-foreground))' },
  percentage: { label: '% Acerto', color: 'hsl(var(--primary))' },
};

const ProfilePage = () => {
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
  const [publicFechamentos, setPublicFechamentos] = useState<Array<{ id: string; content: string; fechamentos: { tema: string } | null }>>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [evoLoading, setEvoLoading] = useState(true);

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchStats();
      if (!isOwnProfile && user) fetchFollowStatus();
      fetchPublicFechamentos();
      if (isOwnProfile) fetchEvolutionData();
    }
  }, [targetUserId, user]);

  const fetchProfile = async () => {
    if (isOwnProfile) {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', targetUserId!).maybeSingle();
      if (error) { toast.error('Erro ao carregar perfil'); setLoading(false); return; }
      if (data) {
        setProfile({ user_id: data.user_id, email: data.email, full_name: data.full_name, bio: data.bio, avatar_url: data.avatar_url, university: data.university, semester: data.semester });
        setEditForm({ full_name: data.full_name || '', bio: data.bio || '', university: data.university || '', semester: data.semester || '' });
      }
    } else {
      const { data, error } = await (supabase.from('public_profiles' as any).select('user_id, full_name, bio, avatar_url, university, semester').eq('user_id', targetUserId!).maybeSingle() as any);
      if (error) { toast.error('Erro ao carregar perfil'); setLoading(false); return; }
      if (data) {
        setProfile({ user_id: data.user_id, full_name: data.full_name, bio: data.bio, avatar_url: data.avatar_url, university: data.university, semester: data.semester });
      }
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
    setStats({ fechamentos: fechRes.count || 0, favoritos: favRes.count || 0, followers: followersRes.count || 0, following: followingRes.count || 0 });
  };

  const fetchEvolutionData = async () => {
    try {
      const [attemptsRes, flashRes] = await Promise.all([
        supabase.from('enamed_attempts').select('created_at, correct_answers, total_questions, percentage, source, modo').order('created_at', { ascending: true }),
        supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      ]);
      setAttempts((attemptsRes.data || []) as AttemptRow[]);
      setFlashcardCount(flashRes.count || 0);
    } catch (error) {
      console.error('Error fetching evolution data:', error);
    } finally {
      setEvoLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user!.id).eq('following_id', targetUserId!).maybeSingle();
    setIsFollowing(!!data);
  };

  const fetchPublicFechamentos = async () => {
    const { data } = await supabase.from('posts').select('*, fechamentos(*)').eq('user_id', targetUserId!).not('fechamento_id', 'is', null).order('created_at', { ascending: false }).limit(10);
    setPublicFechamentos((data || []) as any);
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
    const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    if (error) { toast.error('Erro ao atualizar avatar'); setUploading(false); return; }
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    toast.success('Foto atualizada!');
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: editForm.full_name, bio: editForm.bio, university: editForm.university, semester: editForm.semester }).eq('user_id', user.id);
    if (error) { toast.error('Erro ao salvar perfil'); return; }
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

  // Evolution computations
  const weeklyData = useMemo<WeeklyData[]>(() => {
    if (attempts.length === 0) return [];
    const weeks = new Map<string, { acertos: number; total: number }>();
    attempts.forEach(a => {
      const date = new Date(a.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      const existing = weeks.get(key) || { acertos: 0, total: 0 };
      existing.acertos += a.correct_answers;
      existing.total += a.total_questions;
      weeks.set(key, existing);
    });
    return Array.from(weeks.entries()).map(([week, data]) => ({
      week, acertos: data.acertos, total: data.total,
      percentage: data.total > 0 ? Math.round((data.acertos / data.total) * 100) : 0,
    }));
  }, [attempts]);

  const overallStats = useMemo(() => {
    if (attempts.length === 0) return { total: 0, correct: 0, avg: 0, trend: 0 };
    const total = attempts.reduce((s, a) => s + a.total_questions, 0);
    const correct = attempts.reduce((s, a) => s + a.correct_answers, 0);
    const avg = total > 0 ? Math.round((correct / total) * 100) : 0;
    const recent = attempts.slice(-5);
    const previous = attempts.slice(-10, -5);
    const recentAvg = recent.length > 0 ? recent.reduce((s, a) => s + a.percentage, 0) / recent.length : 0;
    const prevAvg = previous.length > 0 ? previous.reduce((s, a) => s + a.percentage, 0) / previous.length : 0;
    return { total, correct, avg, trend: Math.round(recentAvg - prevAvg) };
  }, [attempts]);

  const prediction = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const last = weeklyData[weeklyData.length - 1];
    const secondLast = weeklyData[weeklyData.length - 2];
    const diff = last.percentage - secondLast.percentage;
    const predicted = Math.min(100, Math.max(0, last.percentage + diff));
    return { current: last.percentage, predicted: Math.round(predicted), improving: diff > 0 };
  }, [weeklyData]);

  const initials = useMemo(() => (profile?.full_name || profile?.email || '?').slice(0, 2).toUpperCase(), [profile]);

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Perfil não encontrado</div>;

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

      <main className="container max-w-2xl px-4 py-6 sm:py-8">
        {/* Avatar & Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-6">
          <div className="relative group mb-4">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-primary/20">
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
              <div><Label>Nome Completo</Label><Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" /></div>
              <div><Label>Bio</Label><Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} /></div>
              <div><Label>Faculdade</Label><Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" /></div>
              <div><Label>Período/Semestre</Label><Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º período" /></div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} className="flex-1 gap-1"><Save className="h-4 w-4" /> Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.email || 'Usuário'}</h1>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {profile.university && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {profile.university}</span>}
                {profile.semester && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.semester}</span>}
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
          {[
            { label: 'Resumos', value: stats.fechamentos, icon: FileText },
            { label: 'Favoritos', value: stats.favoritos, icon: Star },
            { label: 'Seguidores', value: stats.followers, icon: Users },
            { label: 'Seguindo', value: stats.following, icon: Users },
          ].map((s) => (
            <Card key={s.label} className="p-2.5 sm:p-3 text-center bg-secondary/30 border-border/30">
              <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto text-primary mb-1" />
              <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue={isOwnProfile ? 'evolucao' : 'posts'} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            {isOwnProfile && <TabsTrigger value="evolucao" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5" /> Evolução</TabsTrigger>}
            <TabsTrigger value="posts" className="gap-1.5 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5" /> Resumos Públicos</TabsTrigger>
          </TabsList>

          {/* Evolution Tab */}
          {isOwnProfile && (
            <TabsContent value="evolucao" className="space-y-4 mt-4">
              {evoLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}
                </div>
              ) : (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <Card className="p-3 border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground">Média</span>
                      </div>
                      <p className="text-xl font-bold text-primary">{overallStats.avg}%</p>
                    </Card>
                    <Card className="p-3 border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[10px] text-muted-foreground">Tendência</span>
                      </div>
                      <p className={`text-xl font-bold ${overallStats.trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {overallStats.trend >= 0 ? '+' : ''}{overallStats.trend}%
                      </p>
                    </Card>
                    <Card className="p-3 border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground">Questões</span>
                      </div>
                      <p className="text-xl font-bold">{overallStats.total}</p>
                    </Card>
                    <Card className="p-3 border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[10px] text-muted-foreground">Flashcards</span>
                      </div>
                      <p className="text-xl font-bold">{flashcardCount}</p>
                    </Card>
                  </div>

                  {/* Prediction */}
                  {prediction && (
                    <Card className="p-4 border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold">Previsão de Desempenho</h3>
                          <p className="text-[11px] text-muted-foreground">
                            {prediction.improving
                              ? `Você está melhorando! Previsão: ~${prediction.predicted}% na próxima semana.`
                              : `Atenção — sua média caiu. Revise os temas com mais erros.`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Charts */}
                  {weeklyData.length > 0 ? (
                    <>
                      <Card className="p-4 border-border/30">
                        <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Acertos por Semana
                        </h3>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                          <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis dataKey="week" className="text-xs" />
                            <YAxis className="text-xs" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="acertos" fill="var(--color-acertos)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} opacity={0.3} />
                          </BarChart>
                        </ChartContainer>
                      </Card>

                      {weeklyData.length > 1 && (
                        <Card className="p-4 border-border/30">
                          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Curva de Aprendizado
                          </h3>
                          <ChartContainer config={chartConfig} className="h-[180px] w-full">
                            <LineChart data={weeklyData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                              <XAxis dataKey="week" className="text-xs" />
                              <YAxis domain={[0, 100]} className="text-xs" />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line type="monotone" dataKey="percentage" stroke="var(--color-percentage)" strokeWidth={2} dot={{ fill: 'var(--color-percentage)', r: 4 }} />
                            </LineChart>
                          </ChartContainer>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card className="p-8 border-border/30 text-center">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold mb-1">Sem dados ainda</h3>
                      <p className="text-xs text-muted-foreground mb-4">Complete simulados para ver sua evolução.</p>
                      <Button size="sm" onClick={() => navigate('/enamed')} className="gap-2">
                        <Brain className="h-4 w-4" /> Fazer Simulado
                      </Button>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          )}

          <TabsContent value="posts">
            {publicFechamentos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum resumo compartilhado ainda.</p>
            ) : (
              <div className="space-y-3 mt-4">
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

export default ProfilePage;
