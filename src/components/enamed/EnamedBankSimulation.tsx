import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Trophy, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { EnamedQuestion } from '@/hooks/useEnamedBank';
import { AREA_LABELS } from '@/hooks/useEnamedBank';

interface EnamedBankSimulationProps {
  questions: EnamedQuestion[];
  onFinish: (score: { correct: number; total: number; percentage: number; answers: Record<string, string> }) => void;
  onExit: () => void;
  loading?: boolean;
}

const EnamedBankSimulation = ({ questions, onFinish, onExit, loading }: EnamedBankSimulationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const alternatives = useMemo(() => {
    if (!currentQ) return [];
    return [
      { letter: 'A', text: currentQ.alternativa_a },
      { letter: 'B', text: currentQ.alternativa_b },
      { letter: 'C', text: currentQ.alternativa_c },
      { letter: 'D', text: currentQ.alternativa_d },
    ];
  }, [currentQ]);

  const selectAnswer = useCallback((letter: string) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: letter }));
  }, [currentIndex, showResults]);

  const toggleReveal = useCallback(() => {
    setRevealedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  }, [currentIndex]);

  const score = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].gabarito) correct++;
    }
    return {
      correct,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    };
  }, [answers, questions]);

  const handleFinish = useCallback(() => {
    setShowResults(true);
    const answerMap: Record<string, string> = {};
    Object.entries(answers).forEach(([idx, letter]) => {
      answerMap[questions[Number(idx)]?.id || idx] = letter;
    });
    onFinish({ ...score, answers: answerMap });
  }, [answers, questions, score, onFinish]);

  const resetExam = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setRevealedQuestions(new Set());
  }, []);

  if (loading || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
        {loading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Carregando questões...</p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">Nenhuma questão disponível.</p>
            <Button variant="outline" onClick={onExit}>Voltar</Button>
          </>
        )}
      </div>
    );
  }

  // Results
  if (showResults) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center py-6 border-b border-border/30 shrink-0">
          <Trophy className={`h-12 w-12 mx-auto mb-3 ${score.percentage >= 70 ? 'text-primary' : score.percentage >= 50 ? 'text-accent' : 'text-destructive'}`} />
          <h2 className="text-2xl font-bold">Resultado ENAMED</h2>
          <p className="text-4xl font-bold mt-2">
            <span className={score.percentage >= 70 ? 'text-primary' : score.percentage >= 50 ? 'text-accent' : 'text-destructive'}>
              {score.percentage}%
            </span>
          </p>
          <p className="text-muted-foreground mt-1">{score.correct} de {score.total} questões corretas</p>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-4 py-4">
          <div className="space-y-3 max-w-xl mx-auto">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.gabarito;
              const wasAnswered = userAnswer !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => { setShowResults(false); setCurrentIndex(i); setRevealedQuestions(prev => new Set(prev).add(i)); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-accent/10 ${
                    wasAnswered ? isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5' : 'border-border/30 bg-muted/20'
                  }`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    wasAnswered ? isCorrect ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{AREA_LABELS[q.area] || q.area}</p>
                    <p className="text-xs text-muted-foreground">
                      {wasAnswered ? `Resposta: ${userAnswer} | Gabarito: ${q.gabarito}` : 'Não respondida'}
                    </p>
                  </div>
                  {wasAnswered && (isCorrect ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <XCircle className="h-5 w-5 text-destructive shrink-0" />)}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t border-border/30 shrink-0">
          <Button variant="outline" onClick={resetExam} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />Refazer
          </Button>
          <Button variant="outline" onClick={onExit} className="flex-1">Voltar</Button>
        </div>
      </div>
    );
  }

  // Question view
  const isRevealed = revealedQuestions.has(currentIndex);
  const userAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const showFinishButton = isLastQuestion && answeredCount > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Questão {currentIndex + 1} de {totalQuestions}</span>
          <span className="text-xs text-muted-foreground">{answeredCount} respondida{answeredCount !== 1 ? 's' : ''}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pr-2">
          {/* Area badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              {AREA_LABELS[currentQ.area] || currentQ.area}
            </span>
            <span className="text-xs text-muted-foreground">ENAMED {currentQ.ano}</span>
            {currentQ.anulada && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">ANULADA</span>
            )}
          </div>

          {/* Enunciado */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{currentQ.enunciado}</div>

          {/* Alternatives */}
          <div className="space-y-2">
            {alternatives.map((alt) => {
              const isSelected = userAnswer === alt.letter;
              const isCorrectAlt = alt.letter === currentQ.gabarito;
              const showFeedback = isRevealed && userAnswer;

              return (
                <button
                  key={alt.letter}
                  onClick={() => selectAnswer(alt.letter)}
                  disabled={isRevealed}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    showFeedback
                      ? isCorrectAlt ? 'border-primary/50 bg-primary/10' : isSelected ? 'border-destructive/50 bg-destructive/10' : 'border-border/30 bg-background/40 opacity-60'
                      : isSelected ? 'border-primary/50 bg-primary/10' : 'border-border/30 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
                  } disabled:cursor-default`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      showFeedback
                        ? isCorrectAlt ? 'bg-primary/20 text-primary' : isSelected ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                        : isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{alt.letter}</span>
                    <span className="text-sm flex-1">{alt.text}</span>
                    {showFeedback && isCorrectAlt && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                    {showFeedback && isSelected && !isCorrectAlt && <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reveal */}
          {userAnswer && (
            <div className="pt-2">
              {!isRevealed ? (
                <Button variant="outline" size="sm" onClick={toggleReveal} className="gap-2">
                  <Eye className="h-4 w-4" />Ver Gabarito
                </Button>
              ) : (
                <div className="rounded-xl border border-border/30 bg-secondary/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Gabarito: {currentQ.gabarito}</span>
                    <Button variant="ghost" size="sm" onClick={toggleReveal} className="gap-1 h-7 text-xs">
                      <EyeOff className="h-3 w-3" />Ocultar
                    </Button>
                  </div>
                  {currentQ.explicacao && (
                    <p className="text-sm text-muted-foreground">{currentQ.explicacao}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30 shrink-0">
        <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" />Anterior
        </Button>

        {showFinishButton ? (
          <Button size="sm" onClick={handleFinish} className="gap-1 bg-gradient-to-r from-primary to-primary/80">
            <Trophy className="h-4 w-4" />Finalizar ({answeredCount}/{totalQuestions})
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={isLastQuestion} className="gap-1">
            Próxima<ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnamedBankSimulation;
