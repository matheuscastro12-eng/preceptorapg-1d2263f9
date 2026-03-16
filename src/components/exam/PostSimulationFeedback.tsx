import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, BookOpen, Brain, ArrowRight, Layers, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeedbackProps {
  score: { correct: number; total: number; percentage: number };
  wrongTopics?: string[];
  onGoToFlashcards: () => void;
  onGoToTopics: () => void;
  onGoToEvolution: () => void;
  onRetry: () => void;
  onExit: () => void;
}

const PostSimulationFeedback = ({
  score,
  wrongTopics = [],
  onGoToFlashcards,
  onGoToTopics,
  onGoToEvolution,
  onRetry,
  onExit,
}: FeedbackProps) => {
  const performance = useMemo(() => {
    if (score.percentage >= 80) return { level: 'excelente', color: 'text-primary', bg: 'bg-primary/10', message: 'Excelente! Você domina este conteúdo.' };
    if (score.percentage >= 60) return { level: 'bom', color: 'text-amber-600', bg: 'bg-amber-500/10', message: 'Bom desempenho! Revise os pontos fracos.' };
    return { level: 'revisar', color: 'text-destructive', bg: 'bg-destructive/10', message: 'Reforce o estudo neste tema. Não desanime!' };
  }, [score.percentage]);

  const nextSteps = useMemo(() => {
    const steps: { icon: React.ReactNode; text: string; action: () => void; priority: 'high' | 'medium' | 'low' }[] = [];

    if (wrongTopics.length > 0) {
      steps.push({
        icon: <Layers className="h-4 w-4" />,
        text: `Revise ${wrongTopics.length} flashcards gerados das questões erradas`,
        action: onGoToFlashcards,
        priority: 'high',
      });
    }

    if (score.percentage < 70) {
      steps.push({
        icon: <BookOpen className="h-4 w-4" />,
        text: 'Gere um resumo sobre os temas com mais erros',
        action: onExit,
        priority: 'high',
      });
    }

    steps.push({
      icon: <Target className="h-4 w-4" />,
      text: 'Atualize seu checklist de Top 20 Temas',
      action: onGoToTopics,
      priority: 'medium',
    });

    steps.push({
      icon: <TrendingUp className="h-4 w-4" />,
      text: 'Veja sua evolução no dashboard',
      action: onGoToEvolution,
      priority: 'low',
    });

    return steps;
  }, [wrongTopics, score.percentage, onGoToFlashcards, onGoToTopics, onGoToEvolution, onExit]);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`p-6 text-center border-2 ${performance.bg} border-primary/20`}>
          <Trophy className={`h-10 w-10 mx-auto mb-3 ${performance.color}`} />
          <p className={`text-4xl font-bold ${performance.color}`}>{score.percentage}%</p>
          <p className="text-sm text-muted-foreground mt-1">{score.correct}/{score.total} acertos</p>
          <p className={`text-sm font-medium mt-3 ${performance.color}`}>{performance.message}</p>
        </Card>
      </motion.div>

      {/* Wrong topics */}
      {wrongTopics.length > 0 && (
        <Card className="p-4 border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">Temas para revisar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {wrongTopics.slice(0, 8).map((topic, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-amber-500/5 border-amber-500/20 text-amber-600">
                {topic}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Next steps */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Próximos Passos
        </h3>
        {nextSteps.map((step, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            onClick={step.action}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${
              step.priority === 'high' ? 'border-primary/20 bg-primary/5' : 'border-border/30'
            }`}
          >
            <div className="shrink-0 text-primary">{step.icon}</div>
            <span className="text-sm flex-1">{step.text}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onRetry} className="flex-1 gap-2">
          <Brain className="h-4 w-4" />Refazer
        </Button>
        <Button onClick={onExit} className="flex-1 gap-2">
          Voltar ao Menu
        </Button>
      </div>
    </div>
  );
};

export default PostSimulationFeedback;
