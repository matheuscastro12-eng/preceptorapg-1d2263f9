import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatsCard from '@/components/StatsCard';
import { ArrowLeft, TrendingUp, BarChart3, Target, Calendar, Brain, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';

interface WeeklyData {
  week: string;
  acertos: number;
  total: number;
  percentage: number;
}

interface AttemptRow {
  created_at: string;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  source: string;
  modo: string;
}

const chartConfig: ChartConfig = {
  acertos: { label: 'Acertos', color: 'hsl(var(--primary))' },
  total: { label: 'Total', color: 'hsl(var(--muted-foreground))' },
  percentage: { label: '% Acerto', color: 'hsl(var(--primary))' },
};

const Evolution = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [resumoCount, setResumoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [attemptsRes, resumoRes] = await Promise.all([
        supabase.from('enamed_attempts').select('created_at, correct_answers, total_questions, percentage, source, modo').order('created_at', { ascending: true }),
        supabase.from('fechamentos').select('*', { count: 'exact', head: true }),
      ]);

      setAttempts((attemptsRes.data || []) as AttemptRow[]);
      setResumoCount(resumoRes.count || 0);
    } catch (error) {
      console.error('Error fetching evolution data:', error);
    } finally {
      setLoading(false);
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
      week,
      acertos: data.acertos,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.acertos / data.total) * 100) : 0,
    }));
  }, [attempts]);

  const overallStats = useMemo(() => {
    if (attempts.length === 0) return { total: 0, correct: 0, avg: 0, trend: 0 };
    
    const total = attempts.reduce((s, a) => s + a.total_questions, 0);
    const correct = attempts.reduce((s, a) => s + a.correct_answers, 0);
    const avg = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Trend: compare last 5 vs previous 5
    const recent = attempts.slice(-5);
    const previous = attempts.slice(-10, -5);
    const recentAvg = recent.length > 0 ? recent.reduce((s, a) => s + a.percentage, 0) / recent.length : 0;
    const prevAvg = previous.length > 0 ? previous.reduce((s, a) => s + a.percentage, 0) / previous.length : 0;
    const trend = Math.round(recentAvg - prevAvg);

    return { total, correct, avg, trend };
  }, [attempts]);

  // Performance prediction based on trend
  const prediction = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const last = weeklyData[weeklyData.length - 1];
    const secondLast = weeklyData[weeklyData.length - 2];
    const diff = last.percentage - secondLast.percentage;
    const predicted = Math.min(100, Math.max(0, last.percentage + diff));
    return { current: last.percentage, predicted: Math.round(predicted), improving: diff > 0 };
  }, [weeklyData]);

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80 safe-area-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Voltar
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient-medical">Evolução</span>
            </div>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container relative py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-4 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Média Geral</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{overallStats.avg}%</p>
                </Card>
                <Card className="p-4 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Tendência</span>
                  </div>
                  <p className={`text-2xl font-bold ${overallStats.trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {overallStats.trend >= 0 ? '+' : ''}{overallStats.trend}%
                  </p>
                </Card>
                <Card className="p-4 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Questões</span>
                  </div>
                  <p className="text-2xl font-bold">{overallStats.total}</p>
                </Card>
                <Card className="p-4 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Resumos</span>
                  </div>
                  <p className="text-2xl font-bold">{resumoCount}</p>
                </Card>
              </div>

              {/* Performance prediction */}
              {prediction && (
                <Card className="p-5 border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Previsão de Desempenho</h3>
                      <p className="text-xs text-muted-foreground">
                        {prediction.improving 
                          ? `Você está melhorando! Previsão: ~${prediction.predicted}% na próxima semana.`
                          : `Atenção — sua média caiu. Revise os temas com mais erros.`
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Weekly accuracy chart */}
              {weeklyData.length > 0 ? (
                <Card className="p-5 border-border/30">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Acertos por Semana
                  </h3>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
              ) : (
                <Card className="p-8 border-border/30 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sem dados ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">Complete simulados para ver sua evolução aqui.</p>
                  <Button onClick={() => navigate('/enamed')} className="gap-2">
                    <Brain className="h-4 w-4" />Fazer Simulado
                  </Button>
                </Card>
              )}

              {/* Learning curve */}
              {weeklyData.length > 1 && (
                <Card className="p-5 border-border/30">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Curva de Aprendizado
                  </h3>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default Evolution;
