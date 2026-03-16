import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Circle, BookOpen, GraduationCap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const TOP_20_TOPICS = [
  { key: 'hipertensao', name: 'Hipertensão Arterial Sistêmica', area: 'Clínica Médica' },
  { key: 'diabetes', name: 'Diabetes Mellitus', area: 'Clínica Médica' },
  { key: 'insuficiencia_cardiaca', name: 'Insuficiência Cardíaca', area: 'Clínica Médica' },
  { key: 'pneumonia', name: 'Pneumonia Comunitária', area: 'Clínica Médica' },
  { key: 'itu', name: 'Infecção do Trato Urinário', area: 'Clínica Médica' },
  { key: 'asma', name: 'Asma', area: 'Clínica Médica' },
  { key: 'dpoc', name: 'DPOC', area: 'Clínica Médica' },
  { key: 'avc', name: 'AVC / Doenças Cerebrovasculares', area: 'Clínica Médica' },
  { key: 'abdome_agudo', name: 'Abdome Agudo', area: 'Cirurgia' },
  { key: 'apendicite', name: 'Apendicite Aguda', area: 'Cirurgia' },
  { key: 'colecistite', name: 'Colecistite / Colelitíase', area: 'Cirurgia' },
  { key: 'trauma', name: 'Trauma (ATLS)', area: 'Cirurgia' },
  { key: 'pre_natal', name: 'Pré-Natal de Risco Habitual', area: 'GO' },
  { key: 'pre_eclampsia', name: 'Pré-Eclâmpsia / Eclâmpsia', area: 'GO' },
  { key: 'parto', name: 'Trabalho de Parto e Parto', area: 'GO' },
  { key: 'ivas_pediatria', name: 'IVAS na Infância', area: 'Pediatria' },
  { key: 'diarreia_aguda', name: 'Diarreia Aguda Infantil', area: 'Pediatria' },
  { key: 'puericultura', name: 'Puericultura / Crescimento e Desenvolvimento', area: 'Pediatria' },
  { key: 'sus', name: 'Princípios do SUS', area: 'Saúde Coletiva' },
  { key: 'epidemiologia', name: 'Epidemiologia Básica / Indicadores de Saúde', area: 'Saúde Coletiva' },
];

interface TopicProgress {
  topic_key: string;
  studied: boolean;
  resumo_count: number;
  exam_count: number;
}

const TopicsChecklist = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [progress, setProgress] = useState<Map<string, TopicProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data } = await supabase
        .from('topic_progress')
        .select('topic_key, studied, resumo_count, exam_count');

      const map = new Map<string, TopicProgress>();
      (data || []).forEach(item => {
        map.set(item.topic_key, item as TopicProgress);
      });
      setProgress(map);
    } catch (error) {
      console.error('Error fetching topic progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudied = async (topicKey: string, topicName: string) => {
    if (!user) return;
    const current = progress.get(topicKey);
    const newStudied = !current?.studied;

    try {
      if (current) {
        await supabase.from('topic_progress')
          .update({ studied: newStudied, last_studied_at: newStudied ? new Date().toISOString() : null })
          .eq('user_id', user.id)
          .eq('topic_key', topicKey);
      } else {
        await supabase.from('topic_progress').insert({
          user_id: user.id,
          topic_key: topicKey,
          topic_name: topicName,
          studied: newStudied,
          last_studied_at: newStudied ? new Date().toISOString() : null,
        });
      }

      setProgress(prev => {
        const next = new Map(prev);
        next.set(topicKey, { 
          topic_key: topicKey, 
          studied: newStudied, 
          resumo_count: current?.resumo_count || 0,
          exam_count: current?.exam_count || 0 
        });
        return next;
      });
    } catch (error) {
      console.error('Error toggling topic:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
    }
  };

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const studiedCount = TOP_20_TOPICS.filter(t => progress.get(t.key)?.studied).length;
  const overallProgress = (studiedCount / TOP_20_TOPICS.length) * 100;

  const areaColor = (area: string) => {
    switch (area) {
      case 'Clínica Médica': return 'bg-primary/10 text-primary border-primary/20';
      case 'Cirurgia': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'GO': return 'bg-accent/10 text-accent border-accent/20';
      case 'Pediatria': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Saúde Coletiva': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient-medical">Top 20 Temas</span>
            </div>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container relative py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress header */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Progresso Geral</h2>
                <p className="text-sm text-muted-foreground">{studiedCount} de {TOP_20_TOPICS.length} temas estudados</p>
              </div>
              <div className="text-2xl font-bold text-primary">{Math.round(overallProgress)}%</div>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Topics list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {TOP_20_TOPICS.map((topic, index) => {
                const p = progress.get(topic.key);
                const isStudied = p?.studied || false;

                return (
                  <motion.button
                    key={topic.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => toggleStudied(topic.key, topic.name)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all text-left ${
                      isStudied 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border/30 bg-card/50 hover:border-border/60'
                    }`}
                  >
                    <div className="shrink-0">
                      {isStudied ? (
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isStudied ? 'text-primary line-through decoration-primary/30' : 'text-foreground'}`}>
                        {topic.name}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${areaColor(topic.area)}`}>
                      {topic.area}
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default TopicsChecklist;
