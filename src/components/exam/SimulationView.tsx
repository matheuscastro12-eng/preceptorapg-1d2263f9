import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PostSimulationFeedback from '@/components/exam/PostSimulationFeedback';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Eye, EyeOff, Loader2 } from 'lucide-react';

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
      questions.push({ number, enunciado, alternatives, explanation: explanationPart, correctAnswer, type, tema });
    }
  }

  return questions;
}

const SimulationView = ({ resultado, onExit, isGenerating = false, isComplete = true }: SimulationViewProps) => {
  const navigate = useNavigate();
  const questions = useMemo(() => parseQuestions(resultado), [resultado]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
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

  const wrongTopics = useMemo(() => {
    if (!showResults) return [];
    const topics: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] !== questions[i].correctAnswer && questions[i].tema) {
        if (!topics.includes(questions[i].tema!)) topics.push(questions[i].tema!);
      }
    }
    return topics;
  }, [showResults, answers, questions]);

  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
        <p className="text-muted-foreground text-sm">Não foi possível analisar as questões para o modo simulação.</p>
        <button
          onClick={onExit}
          className="h-9 px-4 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-95"
        >
          Voltar para visualização completa
        </button>
      </div>
    );
  }

  if (questions.length === 0 && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-foreground font-medium text-sm">Gerando as questões...</p>
          <p className="text-xs text-muted-foreground mt-1">Aguarde um momento.</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <ScrollArea className="flex-1 min-h-0 px-2 py-4">
        <PostSimulationFeedback
          score={score}
          wrongTopics={wrongTopics}
          onGoToFlashcards={() => navigate('/flashcards')}
          onGoToTopics={() => navigate('/flashcards')}
          onGoToEvolution={() => navigate('/profile')}
          onRetry={resetExam}
          onExit={onExit}
        />
      </ScrollArea>
    );
  }

  // Waiting for next question
  if (isWaitingForQuestion) {
    return (
      <div className="flex flex-col h-full">
        {/* Progress bar */}
        <div className="mb-4 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Questão {currentIndex + 1}</span>
            <span className="text-xs text-muted-foreground">{answeredCount} respondida{answeredCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">Aguarde um momento...</p>
            <p className="text-xs text-muted-foreground mt-1">A próxima questão ainda está sendo gerada.</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-xs text-muted-foreground">Gerando...</span>
        </div>
      </div>
    );
  }

  // Question view
  const isRevealed = revealedQuestions.has(currentIndex);
  const userAnswer = answers[currentIndex];
  const isLastAvailable = currentIndex === totalQuestions - 1;
  const showFinishButton = isLastAvailable && isComplete && answeredCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="mb-4 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">
            Questão {currentIndex + 1} de {isComplete ? totalQuestions : `${totalQuestions}+`}
          </span>
          <span className="text-xs text-muted-foreground">
            {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
            {isGenerating && <span className="ml-2 text-emerald-600 font-medium">• Gerando...</span>}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pr-2">
          {/* Tags */}
          {(currentQ.type || currentQ.tema) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentQ.type && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  {currentQ.type}
                </span>
              )}
              {currentQ.tema && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                  {currentQ.tema}
                </span>
              )}
            </div>
          )}

          {/* Question text */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed">
            <MarkdownRenderer content={currentQ.enunciado} />
          </div>

          {/* Alternatives */}
          <div className="space-y-2">
            {currentQ.alternatives.map((alt) => {
              const isSelected = userAnswer === alt.letter;
              const isCorrectAlt = alt.letter === currentQ.correctAnswer;
              const showFeedback = isRevealed && userAnswer;

              let altClass = 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40';
              let badgeClass = 'bg-slate-100 text-slate-500';
              let opacity = '';

              if (showFeedback) {
                if (isCorrectAlt) {
                  altClass = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                  badgeClass = 'bg-emerald-100 text-emerald-700';
                } else if (isSelected) {
                  altClass = 'border-red-300 bg-red-50 text-red-800';
                  badgeClass = 'bg-red-100 text-red-600';
                } else {
                  altClass = 'border-slate-100 bg-slate-50 text-slate-400';
                  opacity = 'opacity-60';
                }
              } else if (isSelected) {
                altClass = 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm';
                badgeClass = 'bg-emerald-100 text-emerald-700';
              }

              return (
                <button
                  key={alt.letter}
                  onClick={() => selectAnswer(alt.letter)}
                  disabled={isRevealed}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl border-2 transition-all duration-150 active:scale-[0.99] disabled:cursor-default ${altClass} ${opacity}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ${badgeClass}`}>
                      {alt.letter}
                    </span>
                    <span className="text-sm flex-1 pt-0.5">{alt.text}</span>
                    {showFeedback && isCorrectAlt && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {showFeedback && isSelected && !isCorrectAlt && (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Gabarito / Reveal */}
          {userAnswer && (
            <div className="pt-2 space-y-3">
              {!isRevealed ? (
                <button
                  onClick={toggleReveal}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all duration-200 active:scale-95"
                >
                  <Eye className="h-4 w-4" /> Ver Gabarito
                </button>
              ) : (
                <>
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Gabarito: {currentQ.correctAnswer}
                      </span>
                      <button
                        onClick={toggleReveal}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-all duration-200 active:scale-95"
                      >
                        <EyeOff className="h-3 w-3" /> Ocultar
                      </button>
                    </div>
                    {currentQ.explanation && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm border-t border-emerald-200/40 pt-3">
                        <MarkdownRenderer content={currentQ.explanation} />
                      </div>
                    )}
                  </div>
                  {currentIndex < totalQuestions - 1 && (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #126b62, #005e56)' }}
                    >
                      Próxima Questão <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  {currentIndex === totalQuestions - 1 && isGenerating && (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      disabled
                      className="w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-slate-200 text-slate-400 bg-slate-50"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" /> Aguardando próxima questão...
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 shrink-0 gap-2 mt-2">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
          <span className="sm:hidden">Ant.</span>
        </button>

        {/* Question dots — only show on sm+ if few questions */}
        {totalQuestions <= 10 && (
          <div className="hidden sm:flex items-center gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? 'w-5 bg-emerald-500'
                    : answers[i]
                      ? 'w-2 bg-emerald-200'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}

        {showFinishButton ? (
          <button
            onClick={finishExam}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 active:scale-95 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #126b62, #005e56)' }}
          >
            <Trophy className="h-4 w-4" />
            <span>Finalizar ({answeredCount}/{totalQuestions})</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={isLastAvailable && !isGenerating}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Próxima</span>
            <span className="sm:hidden">Próx.</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SimulationView;
