import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Trophy, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ParsedQuestion {
  number: number;
  enunciado: string;
  alternatives: { letter: string; text: string }[];
  explanation: string;
  correctAnswer: string;
  type?: string;
  tema?: string;
}

interface SimulationViewProps {
  resultado: string;
  onExit: () => void;
  isGenerating?: boolean;
  isComplete?: boolean;
}

function parseQuestions(markdown: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  const questionBlocks = markdown.split(/(?=##\s*Questão\s+\d+)/i);

  for (const block of questionBlocks) {
    const numMatch = block.match(/##\s*Questão\s+(\d+)/i);
    if (!numMatch) continue;

    const number = parseInt(numMatch[1]);

    const metaMatch = block.match(/\*Tipo:\s*(.+?)\s*\|\s*Tema:\s*(.+?)\s*\|/i);
    const type = metaMatch?.[1]?.trim();
    const tema = metaMatch?.[2]?.trim();

    let questionPart = block;
    let explanationPart = '';

    const detailsIdx = block.indexOf('<details>');
    if (detailsIdx !== -1) {
      questionPart = block.slice(0, detailsIdx);
      const detailsMatch = block.match(/<details>[\s\S]*?<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i);
      explanationPart = detailsMatch?.[1]?.trim() || '';
    } else {
      const gabaritoIdx = block.search(/\*\*Gabarito:\s*[A-E]\*\*/i);
      if (gabaritoIdx !== -1) {
        questionPart = block.slice(0, gabaritoIdx);
        explanationPart = block.slice(gabaritoIdx);
      }
    }

    const correctMatch = block.match(/\*\*Gabarito:\s*([A-E])\*\*/i);
    const correctAnswer = correctMatch?.[1] || '';

    const alternatives: { letter: string; text: string }[] = [];
    const altRegex = /\*\*([A-E])\)\*\*\s*(.+)/g;
    let altMatch;
    while ((altMatch = altRegex.exec(questionPart)) !== null) {
      if (!alternatives.find(a => a.letter === altMatch[1])) {
        alternatives.push({ letter: altMatch[1], text: altMatch[2].trim() });
      }
    }

    const headerEnd = questionPart.indexOf('\n', questionPart.indexOf('##'));
    const firstAltIdx = questionPart.search(/\*\*[A-E]\)\*\*/);
    const enunciado = firstAltIdx > headerEnd
      ? questionPart.slice(headerEnd, firstAltIdx).replace(/\*Tipo:.*?\*/i, '').trim()
      : '';

    if (alternatives.length >= 4) {
      questions.push({
        number,
        enunciado,
        alternatives,
        explanation: explanationPart,
        correctAnswer,
        type,
        tema,
      });
    }
  }

  return questions;
}

const SimulationView = ({ resultado, onExit, isGenerating = false, isComplete = true }: SimulationViewProps) => {
  const questions = useMemo(() => parseQuestions(resultado), [resultado]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Check if the user has navigated beyond available questions
  const isWaitingForQuestion = currentIndex >= totalQuestions && isGenerating;

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

  const finishExam = useCallback(() => setShowResults(true), []);

  const resetExam = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setRevealedQuestions(new Set());
  }, []);

  const score = useMemo(() => {
    if (!showResults) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) correct++;
    }
    return {
      correct,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    };
  }, [showResults, answers, questions]);

  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <p className="text-muted-foreground">Não foi possível analisar as questões para o modo simulação.</p>
        <Button variant="outline" onClick={onExit} className="mt-4">
          Voltar para visualização completa
        </Button>
      </div>
    );
  }

  // Initial loading — no questions parsed yet but generating
  if (questions.length === 0 && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Gerando as questões... aguarde um momento.</p>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center py-6 border-b border-border/30 shrink-0">
          <Trophy className={`h-12 w-12 mx-auto mb-3 ${score.percentage >= 70 ? 'text-primary' : score.percentage >= 50 ? 'text-accent' : 'text-destructive'}`} />
          <h2 className="text-2xl font-bold">Resultado</h2>
          <p className="text-4xl font-bold mt-2">
            <span className={score.percentage >= 70 ? 'text-primary' : score.percentage >= 50 ? 'text-accent' : 'text-destructive'}>
              {score.percentage}%
            </span>
          </p>
          <p className="text-muted-foreground mt-1">
            {score.correct} de {score.total} questões corretas
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-4 py-4">
          <div className="space-y-3 max-w-xl mx-auto">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correctAnswer;
              const wasAnswered = userAnswer !== undefined;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setShowResults(false);
                    setCurrentIndex(i);
                    setRevealedQuestions(prev => new Set(prev).add(i));
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-accent/10 ${
                    wasAnswered
                      ? isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'
                      : 'border-border/30 bg-muted/20'
                  }`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    wasAnswered
                      ? isCorrect ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.tema || `Questão ${q.number}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {wasAnswered ? `Resposta: ${userAnswer} | Gabarito: ${q.correctAnswer}` : 'Não respondida'}
                    </p>
                  </div>
                  {wasAnswered && (
                    isCorrect
                      ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      : <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t border-border/30 shrink-0">
          <Button variant="outline" onClick={resetExam} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            Refazer
          </Button>
          <Button variant="outline" onClick={onExit} className="flex-1">
            Ver Completa
          </Button>
        </div>
      </div>
    );
  }

  // Waiting for next question screen
  if (isWaitingForQuestion) {
    return (
      <div className="flex flex-col h-full">
        {/* Progress */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Questão {currentIndex + 1}
            </span>
            <span className="text-xs text-muted-foreground">
              {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div>
            <p className="text-foreground font-medium">Aguarde um momento...</p>
            <p className="text-sm text-muted-foreground mt-1">
              A próxima questão ainda está sendo gerada.
            </p>
          </div>
        </div>

        {/* Navigation — only back button */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">Gerando...</span>
        </div>
      </div>
    );
  }

  // Question view
  const isRevealed = revealedQuestions.has(currentIndex);
  const userAnswer = answers[currentIndex];
  const canGoNext = currentIndex < totalQuestions - 1 || (isGenerating && currentIndex === totalQuestions - 1);
  const isLastAvailable = currentIndex === totalQuestions - 1;
  const showFinishButton = isLastAvailable && isComplete && answeredCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Questão {currentIndex + 1} de {isComplete ? totalQuestions : `${totalQuestions}+`}
          </span>
          <span className="text-xs text-muted-foreground">
            {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
            {isGenerating && (
              <span className="ml-2 text-primary">
                • Gerando...
              </span>
            )}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pr-2">
          {/* Metadata */}
          {(currentQ.type || currentQ.tema) && (
            <div className="flex items-center gap-2 flex-wrap">
              {currentQ.type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {currentQ.type}
                </span>
              )}
              {currentQ.tema && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  {currentQ.tema}
                </span>
              )}
            </div>
          )}

          {/* Enunciado */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={currentQ.enunciado} />
          </div>

          {/* Alternatives */}
          <div className="space-y-2">
            {currentQ.alternatives.map((alt) => {
              const isSelected = userAnswer === alt.letter;
              const isCorrectAlt = alt.letter === currentQ.correctAnswer;
              const showFeedback = isRevealed && userAnswer;

              return (
                <button
                  key={alt.letter}
                  onClick={() => selectAnswer(alt.letter)}
                  disabled={isRevealed}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    showFeedback
                      ? isCorrectAlt
                        ? 'border-primary/50 bg-primary/10'
                        : isSelected ? 'border-destructive/50 bg-destructive/10' : 'border-border/30 bg-background/40 opacity-60'
                      : isSelected
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/30 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
                  } disabled:cursor-default`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      showFeedback
                        ? isCorrectAlt ? 'bg-primary/20 text-primary' : isSelected ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                        : isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {alt.letter}
                    </span>
                    <span className="text-sm flex-1">{alt.text}</span>
                    {showFeedback && isCorrectAlt && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                    {showFeedback && isSelected && !isCorrectAlt && <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reveal / Explanation */}
          {userAnswer && (
            <div className="pt-2 space-y-3">
              {!isRevealed ? (
                <Button variant="outline" size="sm" onClick={toggleReveal} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Gabarito
                </Button>
              ) : (
                <>
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">Gabarito: {currentQ.correctAnswer}</span>
                      <Button variant="ghost" size="sm" onClick={toggleReveal} className="gap-1 h-7 text-xs">
                        <EyeOff className="h-3 w-3" />
                        Ocultar
                      </Button>
                    </div>
                    {currentQ.explanation && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <MarkdownRenderer content={currentQ.explanation} />
                      </div>
                    )}
                  </div>
                  {/* Prominent next button after explanation */}
                  {currentIndex < totalQuestions - 1 && (
                    <Button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
                      size="sm"
                    >
                      Próxima Questão
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  {currentIndex === totalQuestions - 1 && isGenerating && (
                    <Button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      variant="outline"
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguardando próxima questão...
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation — always visible, outside ScrollArea */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        {showFinishButton ? (
          <Button
            size="sm"
            onClick={finishExam}
            className="gap-1 bg-gradient-to-r from-primary to-primary/80"
          >
            <Trophy className="h-4 w-4" />
            Finalizar ({answeredCount}/{totalQuestions})
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={isLastAvailable && !isGenerating}
            className="gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SimulationView;
