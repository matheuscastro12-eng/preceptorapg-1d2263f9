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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Camera, Edit2, Save, X, Users, FileText, Star, MapPin, GraduationCap, UserPlus, UserMinus, MessageCircle, TrendingUp, Target, Brain, BookOpen, Calendar, BarChart3, Layers, Award, Flame, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
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
      let { data, error } = await supabase.from('profiles').select('*').eq('user_id', targetUserId!).maybeSingle();
      if (error) { toast.error('Erro ao carregar perfil'); setLoading(false); return; }
      // Auto-create profile if missing (for users created before trigger)
      if (!data && user) {
        const { data: newProfile, error: insertErr } = await supabase.from('profiles').insert({ user_id: user.id, email: user.email || '' }).select().single();
        if (!insertErr && newProfile) data = newProfile;
      }
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-14 items-center justify-between px-4 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <span className="text-sm font-semibold text-foreground">Perfil</span>
          {isOwnProfile && !editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </Button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </header>

      <main className="container max-w-2xl px-4 pb-12">
        {/* Hero Banner */}
        <div className="relative -mx-4 overflow-hidden">
          <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
        </div>

        {/* Avatar overlapping banner */}
        <motion.div
          initial="hidden" animate="show" custom={0} variants={fadeUp}
          className="relative -mt-14 sm:-mt-16 flex flex-col items-center text-center px-4"
        >
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-background" />
            <Avatar className="relative h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {editing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full mt-6 space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} className="resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Faculdade</Label>
                  <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Período</Label>
                  <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveProfile} className="flex-1 gap-1.5"><Save className="h-4 w-4" /> Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)} size="icon"><X className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          ) : (
            <div className="mt-3 space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{profile.full_name || profile.email || 'Usuário'}</h1>
              {profile.bio && <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{profile.bio}</p>}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                {profile.university && (
                  <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-full">
                    <GraduationCap className="h-3 w-3" /> {profile.university}
                  </span>
                )}
                {profile.semester && (
                  <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-full">
                    <MapPin className="h-3 w-3" /> {profile.semester}
                  </span>
                )}
              </div>
              {!isOwnProfile && (
                <div className="flex gap-2 pt-2 justify-center">
                  <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'} size="sm" className="gap-1.5 rounded-full px-5">
                    {isFollowing ? <><UserMinus className="h-3.5 w-3.5" /> Seguindo</> : <><UserPlus className="h-3.5 w-3.5" /> Seguir</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/messages/${targetUserId}`)} className="gap-1.5 rounded-full px-5">
                    <MessageCircle className="h-3.5 w-3.5" /> Mensagem
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div initial="hidden" animate="show" custom={1} variants={fadeUp} className="mt-6 mb-6">
          <div className="flex items-center justify-center gap-0 divide-x divide-border/40">
            {[
              { label: 'Resumos', value: stats.fechamentos },
              { label: 'Favoritos', value: stats.favoritos },
              { label: 'Seguidores', value: stats.followers },
              { label: 'Seguindo', value: stats.following },
            ].map((s) => (
              <div key={s.label} className="flex-1 text-center py-2 px-3">
                <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial="hidden" animate="show" custom={2} variants={fadeUp}>
          <Tabs defaultValue={isOwnProfile ? 'evolucao' : 'posts'} className="w-full">
            <TabsList className={`w-full ${isOwnProfile ? 'grid grid-cols-2' : ''} bg-secondary/40 rounded-xl p-1`}>
              {isOwnProfile && (
                <TabsTrigger value="evolucao" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="h-3.5 w-3.5" /> Evolução
                </TabsTrigger>
              )}
              <TabsTrigger value="posts" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="h-3.5 w-3.5" /> Resumos Públicos
              </TabsTrigger>
            </TabsList>

            {/* Evolution Tab */}
            {isOwnProfile && (
              <TabsContent value="evolucao" className="space-y-4 mt-5">
                {evoLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />)}
                  </div>
                ) : (
                  <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <MetricCard icon={Target} label="Média Geral" value={`${overallStats.avg}%`} color="primary" />
                      <MetricCard
                        icon={TrendingUp}
                        label="Tendência"
                        value={`${overallStats.trend >= 0 ? '+' : ''}${overallStats.trend}%`}
                        color={overallStats.trend >= 0 ? 'primary' : 'destructive'}
                      />
                      <MetricCard icon={Brain} label="Questões" value={String(overallStats.total)} color="accent" />
                      <MetricCard icon={Layers} label="Flashcards" value={String(flashcardCount)} color="accent" />
                    </div>

                    {/* Prediction */}
                    {prediction && (
                      <Card className="p-4 border-border/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                            {prediction.improving ? <Flame className="h-5 w-5 text-primary" /> : <Target className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-semibold text-foreground">Previsão de Desempenho</h3>
                              {prediction.improving && (
                                <span className="text-[10px] font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-full">Em alta</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {prediction.improving
                                ? `Excelente progresso! Previsão: ~${prediction.predicted}% na próxima semana.`
                                : `Sua média recuou. Revise os temas com mais erros para recuperar.`}
                            </p>
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                  <span>Atual: {prediction.current}%</span>
                                  <span>Meta: {prediction.predicted}%</span>
                                </div>
                                <Progress value={prediction.current} className="h-1.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Charts */}
                    {weeklyData.length > 0 ? (
                      <div className="space-y-4">
                        <Card className="p-4 sm:p-5 border-border/20 rounded-2xl">
                          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
                            <Calendar className="h-4 w-4 text-primary" /> Acertos por Semana
                          </h3>
                          <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <BarChart data={weeklyData} barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                              <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
                              <YAxis className="text-xs" tickLine={false} axisLine={false} width={30} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="total" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="acertos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        </Card>

                        {weeklyData.length > 1 && (
                          <Card className="p-4 sm:p-5 border-border/20 rounded-2xl">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
                              <TrendingUp className="h-4 w-4 text-primary" /> Curva de Aprendizado
                            </h3>
                            <ChartContainer config={chartConfig} className="h-[180px] w-full">
                              <AreaChart data={weeklyData}>
                                <defs>
                                  <linearGradient id="gradPercentage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                                <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} className="text-xs" tickLine={false} axisLine={false} width={30} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradPercentage)" dot={{ fill: 'hsl(var(--primary))', r: 3.5, strokeWidth: 2, stroke: 'hsl(var(--background))' }} />
                              </AreaChart>
                            </ChartContainer>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card className="p-10 border-border/20 text-center rounded-2xl bg-secondary/20">
                        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-sm font-semibold mb-1 text-foreground">Sem dados ainda</h3>
                        <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">Complete simulados e pratique para visualizar sua evolução aqui.</p>
                        <Button size="sm" onClick={() => navigate('/enamed')} className="gap-2 rounded-full px-6">
                          <Brain className="h-4 w-4" /> Começar Agora
                        </Button>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
            )}

            <TabsContent value="posts" className="mt-5">
              {publicFechamentos.length === 0 ? (
                <Card className="p-10 border-border/20 text-center rounded-2xl bg-secondary/20">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-foreground">Nenhum resumo compartilhado</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {isOwnProfile ? 'Compartilhe seus resumos no feed para que apareçam aqui.' : 'Este usuário ainda não compartilhou resumos.'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {publicFechamentos.map((post) => (
                    <Card key={post.id} className="p-4 bg-secondary/20 border-border/20 rounded-2xl hover:bg-secondary/30 transition-colors">
                      <h3 className="font-semibold text-foreground text-sm">{post.fechamentos?.tema}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </PageTransition>
  );
};

/* Reusable metric card */
const MetricCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <Card className="p-3.5 border-border/20 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color === 'primary' ? 'bg-primary/15' : color === 'destructive' ? 'bg-destructive/15' : 'bg-accent/15'}`}>
        <Icon className={`h-3.5 w-3.5 ${color === 'primary' ? 'text-primary' : color === 'destructive' ? 'text-destructive' : 'text-accent'}`} />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-xl font-bold ${color === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
  </Card>
);

export default ProfilePage;
