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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Camera, Edit2, Save, X, UserPlus, UserMinus, MessageCircle, TrendingUp, Target, Brain, Calendar, BarChart3, Layers, Flame, GraduationCap, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PageSkeleton from '@/components/PageSkeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

type Profile = Tables<'profiles'>;

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

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

interface RecentActivity {
  id: string;
  type: 'resumo' | 'simulado' | 'enamed';
  title: string;
  subtitle: string;
  date: string;
  score?: number;
  total?: number;
  icon: string;
  color: string;
  bgColor: string;
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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'evolucao' | 'atividades'>('evolucao');

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchStats();
      if (!isOwnProfile && user) fetchFollowStatus();
      fetchPublicFechamentos();
      if (isOwnProfile) {
        fetchEvolutionData();
        fetchRecentActivity();
      }
    }
  }, [targetUserId, user]);

  const fetchProfile = async () => {
    if (isOwnProfile) {
      let { data, error } = await supabase.from('profiles').select('*').eq('user_id', targetUserId!).maybeSingle();
      if (error) { toast.error('Erro ao carregar perfil'); setLoading(false); return; }
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

  const fetchRecentActivity = async () => {
    try {
      const [fechRes, attRes] = await Promise.all([
        supabase.from('fechamentos').select('id, tema, tipo, created_at').eq('user_id', targetUserId!).order('created_at', { ascending: false }).limit(5),
        supabase.from('enamed_attempts').select('id, correct_answers, total_questions, percentage, modo, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const activities: RecentActivity[] = [];
      (fechRes.data || []).forEach((f: any) => {
        activities.push({
          id: f.id,
          type: 'resumo',
          title: `Resumo: ${f.tema}`,
          subtitle: f.tipo === 'seminario' ? 'Seminário' : 'Resumo',
          date: f.created_at,
          icon: 'description',
          color: 'text-[#006D5B]',
          bgColor: 'bg-[#c8eade]/40',
        });
      });
      (attRes.data || []).forEach((a: any) => {
        activities.push({
          id: a.id,
          type: a.modo === 'completo' ? 'enamed' : 'simulado',
          title: `Simulado ${a.modo === 'completo' ? 'ENAMED Completo' : 'ENAMED'}`,
          subtitle: `${a.correct_answers}/${a.total_questions} acertos`,
          date: a.created_at,
          score: a.correct_answers,
          total: a.total_questions,
          icon: 'quiz',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100/60',
        });
      });
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 8));
    } catch (e) {
      console.error(e);
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
    if (attempts.length === 0) return { total: 0, correct: 0, avg: 0, trend: 0, simCount: 0 };
    const total = attempts.reduce((s, a) => s + a.total_questions, 0);
    const correct = attempts.reduce((s, a) => s + a.correct_answers, 0);
    const avg = total > 0 ? Math.round((correct / total) * 100) : 0;
    const recent = attempts.slice(-5);
    const previous = attempts.slice(-10, -5);
    const recentAvg = recent.length > 0 ? recent.reduce((s, a) => s + a.percentage, 0) / recent.length : 0;
    const prevAvg = previous.length > 0 ? previous.reduce((s, a) => s + a.percentage, 0) / previous.length : 0;
    return { total, correct, avg, trend: Math.round(recentAvg - prevAvg), simCount: attempts.length };
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
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Agora mesmo';
    if (diffH < 24) return `Há ${diffH}h`;
    if (diffH < 48) return 'Ontem';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Perfil não encontrado</div>;

  return (
    <DashboardLayout mainClassName="p-0">
      <div className="w-full">

        {/* ═══════════════ HERO BANNER ═══════════════ */}
        <header className="relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-[#002b23]">
            <div className="absolute inset-0 opacity-30" style={{
              background: 'radial-gradient(ellipse at 30% 50%, #006d5b 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, #005344 0%, transparent 50%)',
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 1px, transparent 1px), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002b23] via-transparent to-transparent" />
          </div>

          {/* Back button */}
          <div className="relative z-10 pt-3 px-3 sm:pt-6 sm:px-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>

          {/* Profile info in banner */}
          <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-4 pb-5 sm:pt-6 sm:pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-8">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-2xl border-4 border-white/10 overflow-hidden shadow-2xl bg-[#005344]">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-4xl font-bold text-white/80">{initials}</div>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute -bottom-1 -right-1 bg-[#9df3dc] text-[#005344] p-1.5 sm:p-2 rounded-xl border-[3px] sm:border-4 border-[#002b23] shadow-lg cursor-pointer hover:bg-white transition-all hover:scale-105 active:scale-95">
                  <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 text-center sm:text-left pb-0 sm:pb-1">
              <h2 className="font-['Manrope'] text-xl sm:text-4xl font-extrabold text-white mb-1.5 sm:mb-2 drop-shadow-md truncate">{displayName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                {profile.university && (
                  <span className="bg-[#9df3dc] text-[#005344] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {profile.university}
                  </span>
                )}
                {profile.semester && (
                  <span className="text-white/70 text-xs sm:text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60" />
                    {profile.semester}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
              {isOwnProfile ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 hover:bg-white/20 transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all ${
                      isFollowing
                        ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                        : 'bg-[#9df3dc] text-[#005344] hover:brightness-110 shadow-lg'
                    }`}
                  >
                    {isFollowing ? <><UserMinus className="h-3.5 w-3.5" /> Seguindo</> : <><UserPlus className="h-3.5 w-3.5" /> Seguir</>}
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${targetUserId}`)}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-all"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <div className="px-3 sm:px-8 lg:px-12 py-5 sm:py-10 space-y-6 sm:space-y-10">

          {/* Edit form modal-style */}
          {editing && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 animate-fade-up">
              <h3 className="font-['Manrope'] text-base sm:text-lg font-bold text-[#191c1d]">Editar Perfil</h3>
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Nome Completo</Label>
                  <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Faculdade</Label>
                    <Input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Período</Label>
                    <Input value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Bio</Label>
                <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." maxLength={200} className="resize-none" rows={2} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSaveProfile} className="gap-1.5 bg-[#006D5B] hover:bg-[#005344]"><Save className="h-4 w-4" /> Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && !editing && (
            <p className="text-sm text-[#3e4945]/80 max-w-xl leading-relaxed">{profile.bio}</p>
          )}

          {/* ─── Stats Overview ─── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
              <div className="w-1 sm:w-1.5 h-5 sm:h-6 bg-[#006D5B] rounded-full" />
              <h3 className="font-['Manrope'] text-base sm:text-xl font-bold text-[#191c1d]">Visão Geral</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
              <StatCard label="Resumos Gerados" value={stats.fechamentos} badge={stats.favoritos > 0 ? `${stats.favoritos} fav` : undefined} badgeColor="bg-[#c8eade] text-[#005344]" />
              <StatCard label="Simulados" value={overallStats.simCount} badge={overallStats.avg > 0 ? `${overallStats.avg}% média` : undefined} badgeColor="bg-amber-100 text-amber-700" />
              <StatCard label="Flashcards" value={flashcardCount} />
              <StatCard label="Seguidores" value={stats.followers} badge={stats.following > 0 ? `${stats.following} seguindo` : undefined} badgeColor="bg-slate-100 text-slate-500" />
            </div>
          </section>

          {/* ─── Tabs ─── */}
          {isOwnProfile && (
            <section>
              <div className="bg-[#f3f4f5] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex gap-1 sm:gap-1.5 max-w-md mb-5 sm:mb-6">
                <button
                  onClick={() => setActiveTab('evolucao')}
                  className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-['Manrope'] text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'evolucao' ? 'bg-white text-[#006D5B] shadow-sm border border-slate-200/40' : 'text-[#6e7975] hover:bg-white/60'
                  }`}
                >
                  Evolução
                </button>
                <button
                  onClick={() => setActiveTab('atividades')}
                  className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-['Manrope'] text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'atividades' ? 'bg-white text-[#006D5B] shadow-sm border border-slate-200/40' : 'text-[#6e7975] hover:bg-white/60'
                  }`}
                >
                  Atividade
                </button>
              </div>

              {activeTab === 'evolucao' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                  {/* Charts column */}
                  <div className="lg:col-span-8 space-y-6">
                    {evoLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
                      </div>
                    ) : weeklyData.length > 0 ? (
                      <>
                        {/* Bar chart */}
                        <div className="bg-white p-4 sm:p-7 rounded-2xl shadow-sm border border-slate-200/60">
                          <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <div>
                              <h4 className="font-['Manrope'] text-sm sm:text-lg font-bold text-[#191c1d]">Desempenho Semanal</h4>
                              <p className="text-[10px] sm:text-xs text-[#6e7975] mt-0.5">Acertos vs total por semana</p>
                            </div>
                          </div>
                          <ChartContainer config={chartConfig} className="h-[180px] sm:h-[220px] w-full">
                            <BarChart data={weeklyData} barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
                              <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
                              <YAxis className="text-xs" tickLine={false} axisLine={false} width={30} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="total" fill="#e7e8e9" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="acertos" fill="#006D5B" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        </div>

                        {/* Learning curve */}
                        {weeklyData.length > 1 && (
                          <div className="bg-white p-4 sm:p-7 rounded-2xl shadow-sm border border-slate-200/60">
                            <h4 className="font-['Manrope'] text-sm sm:text-lg font-bold text-[#191c1d] mb-0.5 sm:mb-1">Curva de Aprendizado</h4>
                            <p className="text-[10px] sm:text-xs text-[#6e7975] mb-3 sm:mb-5">% de acerto ao longo do tempo</p>
                            <ChartContainer config={chartConfig} className="h-[170px] sm:h-[200px] w-full">
                              <AreaChart data={weeklyData}>
                                <defs>
                                  <linearGradient id="gradPercentage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#006D5B" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#006D5B" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
                                <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} className="text-xs" tickLine={false} axisLine={false} width={30} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="percentage" stroke="#006D5B" strokeWidth={2.5} fill="url(#gradPercentage)" dot={{ fill: '#006D5B', r: 3.5, strokeWidth: 2, stroke: '#f8f9fa' }} />
                              </AreaChart>
                            </ChartContainer>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white p-6 sm:p-14 rounded-2xl shadow-sm border border-slate-200/60 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-7 w-7 text-slate-300" />
                        </div>
                        <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d] mb-1">Sem dados ainda</h3>
                        <p className="text-sm text-[#6e7975] mb-6 max-w-xs mx-auto">Complete simulados ENAMED para visualizar sua evolução aqui.</p>
                        <button
                          onClick={() => navigate('/enamed')}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-['Manrope'] font-bold text-white text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                          style={{ background: 'linear-gradient(135deg, #005344, #006d5b)' }}
                        >
                          <Brain className="h-4 w-4" /> Fazer Simulado
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sidebar column */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* AI Insight card */}
                    {prediction && (
                      <div className="bg-[#005344] text-white p-5 sm:p-7 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2.5 mb-5">
                            <div className="bg-white/15 p-2 rounded-xl backdrop-blur-sm">
                              <MI name="auto_awesome" fill className="text-[18px] text-[#9df3dc]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9df3dc]">Preceptor Insight</span>
                          </div>
                          <p className="text-sm sm:text-base font-medium leading-relaxed text-white/95 italic mb-3 sm:mb-4">
                            {prediction.improving
                              ? `"Você está em uma curva ascendente! Previsão: ~${prediction.predicted}% na próxima semana."`
                              : `"Sua média recuou recentemente. Foque nos temas com mais erros para recuperar."`}
                          </p>
                          <p className="text-sm text-white/60 leading-relaxed mb-5">
                            Média atual: <span className="text-white font-bold">{prediction.current}%</span>
                            {prediction.improving && <> — meta: <span className="text-[#9df3dc] font-bold">{prediction.predicted}%</span></>}
                          </p>
                          <button
                            onClick={() => navigate('/enamed')}
                            className="w-full bg-white text-[#005344] py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#9df3dc] transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            Continuar Estudando
                            <MI name="arrow_forward" className="text-[14px]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick metrics */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
                      <h4 className="font-['Manrope'] text-base font-bold text-[#191c1d]">Métricas Rápidas</h4>
                      <div className="space-y-4">
                        <QuickMetric icon={Target} label="Média Geral" value={`${overallStats.avg}%`} />
                        <QuickMetric icon={TrendingUp} label="Tendência" value={`${overallStats.trend >= 0 ? '+' : ''}${overallStats.trend}%`} positive={overallStats.trend >= 0} />
                        <QuickMetric icon={Brain} label="Questões Feitas" value={String(overallStats.total)} />
                        <QuickMetric icon={Layers} label="Flashcards" value={String(flashcardCount)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'atividades' && (
                <section>
                  {recentActivities.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200/60 text-center">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-7 w-7 text-slate-300" />
                      </div>
                      <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d] mb-1">Nenhuma atividade</h3>
                      <p className="text-sm text-[#6e7975]">Comece a estudar para ver seu histórico aqui.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="p-3 sm:p-5 flex items-center justify-between hover:bg-[#f8f9fa] transition-colors group cursor-pointer">
                          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-12 sm:h-12 ${activity.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center ${activity.color} shrink-0 group-hover:scale-105 transition-transform`}>
                              <MI name={activity.icon} fill className="text-[18px] sm:text-[22px]" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs sm:text-sm font-bold text-[#191c1d] group-hover:text-[#006D5B] transition-colors truncate">{activity.title}</h5>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#6e7975]">{activity.subtitle}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] sm:text-xs text-[#6e7975]">{formatDate(activity.date)}</span>
                              </div>
                            </div>
                          </div>
                          {activity.score !== undefined && activity.total !== undefined && (
                            <div className="text-right shrink-0 ml-2 sm:ml-4">
                              <p className="text-base sm:text-lg font-extrabold text-[#006D5B] font-['Manrope']">
                                {Math.round((activity.score / activity.total) * 100)}%
                              </p>
                              <p className="text-[9px] sm:text-[10px] text-[#6e7975] uppercase font-bold tracking-wider">Score</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </section>
          )}

          {/* Public posts tab for other profiles */}
          {!isOwnProfile && (
            <section>
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <div className="w-1 sm:w-1.5 h-5 sm:h-6 bg-[#006D5B] rounded-full" />
                <h3 className="font-['Manrope'] text-base sm:text-lg font-bold text-[#191c1d]">Resumos Públicos</h3>
              </div>
              {publicFechamentos.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200/60 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-7 w-7 text-slate-300" />
                  </div>
                  <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d] mb-1">Nenhum resumo compartilhado</h3>
                  <p className="text-sm text-[#6e7975]">Este usuário ainda não compartilhou resumos.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
                  {publicFechamentos.map((post) => (
                    <div key={post.id} className="p-5 hover:bg-[#f8f9fa] transition-colors">
                      <h5 className="text-sm font-bold text-[#191c1d]">{post.fechamentos?.tema}</h5>
                      <p className="text-xs text-[#6e7975] mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, badge, badgeColor }: { label: string; value: number; badge?: string; badgeColor?: string }) => (
  <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
    <p className="text-[9px] sm:text-[11px] font-bold text-[#6e7975] uppercase tracking-widest mb-2 sm:mb-3">{label}</p>
    <div className="flex items-baseline justify-between gap-1.5 sm:gap-2">
      <h4 className="font-['Manrope'] text-xl sm:text-3xl font-extrabold text-[#006D5B]">{value}</h4>
      {badge && (
        <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${badgeColor || 'bg-slate-100 text-slate-500'}`}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

/* ─── Quick Metric ─── */
const QuickMetric = ({ icon: Icon, label, value, positive }: { icon: any; label: string; value: string; positive?: boolean }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#c8eade]/50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#005344]" />
      </div>
      <span className="text-xs font-medium text-[#6e7975]">{label}</span>
    </div>
    <span className={`text-sm font-bold ${positive === false ? 'text-red-500' : 'text-[#191c1d]'}`}>{value}</span>
  </div>
);

export default ProfilePage;
