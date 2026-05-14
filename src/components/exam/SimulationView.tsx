import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PostSimulationFeedback from '@/components/exam/PostSimulationFeedback';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Eye, EyeOff,
  Loader2, Sparkles, BookOpen,
} from 'lucide-react';

/* ─── Tipos ─── */

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

/* ─── Parser de markdown gerado pelo modelo ─── */

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
      if (!alternatives.find(a => a.letter === altMatch![1])) {
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

/* ─── Componente ─── */

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

  /* ─── Loading enquanto questões aparecem ─── */
  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
        <BookOpen className="h-10 w-10 text-[#94a3b8] opacity-50" strokeWidth={1.2} />
        <p className="text-[13px] text-[#4a5568] font-semibold">Não conseguimos identificar questões</p>
        <button
          onClick={onExit}
          className="h-9 px-4 rounded-lg text-[12.5px] font-bold border-2 border-slate-200 text-[#4a5568] hover:border-[#005344] hover:text-[#005344] transition-all"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (questions.length === 0 && isGenerating) {
    return <LoadingState eyebrow="Preparando" title="Elaborando primeira questão" hint="Isso leva alguns segundos." />;
  }

  /* ─── Tela de resultados ─── */
  if (showResults) {
    return (
      <ScrollArea className="flex-1 min-h-0">
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

  /* ─── Aguardando próxima questão chegar do stream ─── */
  if (isWaitingForQuestion) {
    return (
      <div className="flex flex-col h-full">
        <ProgressHeader currentIndex={currentIndex} totalQuestions={totalQuestions} answeredCount={answeredCount} progress={progress} isComplete={isComplete} isGenerating={isGenerating} />
        <LoadingState eyebrow="Aguarde" title="Próxima questão chegando" hint="O modelo está finalizando a redação." compact />
        <FooterNav
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          isLastAvailable
          showFinishButton={false}
          isGenerating={isGenerating}
          onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          onNext={() => { /* desabilitado */ }}
          onFinish={() => { /* nao aparece */ }}
          questions={questions}
          answers={answers}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
    );
  }

  /* ─── Tela da questão atual ─── */
  const isRevealed = revealedQuestions.has(currentIndex);
  const userAnswer = answers[currentIndex];
  const isLastAvailable = currentIndex === totalQuestions - 1;
  const showFinishButton = isLastAvailable && isComplete && answeredCount > 0;

  return (
    <div className="flex flex-col h-full">
      <ProgressHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        progress={progress}
        isComplete={isComplete}
        isGenerating={isGenerating}
      />

      <ScrollArea className="flex-1 min-h-0">
        <article className="space-y-5 pr-2 pb-4">
          {/* Tags */}
          {(currentQ.type || currentQ.tema) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentQ.type && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-md bg-slate-100 text-[#4a5568] border border-slate-200">
                  {currentQ.type}
                </span>
              )}
              {currentQ.tema && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-md text-[#005344]" style={{ background: 'rgba(0,109,91,0.08)', border: '1px solid rgba(0,109,91,0.25)' }}>
                  {currentQ.tema}
                </span>
              )}
            </div>
          )}

          {/* Enunciado */}
          <div className="prose prose-sm max-w-none text-[14px] leading-[1.7] text-[#3E4945] prose-strong:text-[#191C1D] prose-headings:font-['Manrope'] prose-headings:text-[#191C1D]">
            <MarkdownRenderer content={currentQ.enunciado} />
          </div>

          {/* Alternativas */}
          <div className="space-y-2.5">
            {currentQ.alternatives.map((alt) => {
              const isSelected = userAnswer === alt.letter;
              const isCorrectAlt = alt.letter === currentQ.correctAnswer;
              const showFeedback = isRevealed && userAnswer;

              // estados visuais
              let style: React.CSSProperties = {
                background: '#fff',
                borderColor: '#e2e8f0',
                color: '#3E4945',
              };
              let badgeBg = '#f1f5f9';
              let badgeColor = '#64748b';
              let opacity = 1;

              if (showFeedback) {
                if (isCorrectAlt) {
                  style = { background: 'rgba(0,109,91,0.06)', borderColor: '#005344', color: '#003D32' };
                  badgeBg = '#005344'; badgeColor = '#fff';
                } else if (isSelected) {
                  style = { background: 'rgba(220,38,38,0.04)', borderColor: '#fca5a5', color: '#991b1b' };
                  badgeBg = '#fee2e2'; badgeColor = '#dc2626';
                } else {
                  opacity = 0.5;
                }
              } else if (isSelected) {
                style = { background: 'rgba(0,109,91,0.04)', borderColor: '#005344', color: '#003D32', boxShadow: '0 0 0 4px rgba(0,109,91,0.06)' };
                badgeBg = '#005344'; badgeColor = '#fff';
              }

              return (
                <button
                  key={alt.letter}
                  onClick={() => selectAnswer(alt.letter)}
                  disabled={isRevealed}
                  style={{ ...style, opacity }}
                  className="w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-150 active:scale-[0.995] disabled:cursor-default group"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-[13px] font-['Manrope'] font-bold transition-all"
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      {alt.letter}
                    </span>
                    <span className="text-[13.5px] leading-relaxed flex-1 pt-1">{alt.text}</span>
                    {showFeedback && isCorrectAlt && (
                      <CheckCircle2 className="h-5 w-5 text-[#005344] shrink-0 mt-1" />
                    )}
                    {showFeedback && isSelected && !isCorrectAlt && (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reveal / Gabarito */}
          {userAnswer && (
            <div className="pt-1 space-y-3">
              {!isRevealed ? (
                <button
                  onClick={toggleReveal}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12.5px] font-bold border-2 text-[#005344] transition-all hover:bg-[#005344]/05"
                  style={{ borderColor: 'rgba(0,109,91,0.25)', background: 'rgba(0,109,91,0.04)' }}
                >
                  <Eye className="h-4 w-4" /> Ver gabarito + explicação
                </button>
              ) : (
                <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'rgba(0,109,91,0.2)' }}>
                  <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] to-[#C9A84C]" />
                  <div className="px-4 sm:px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#005344] inline-flex items-center gap-2">
                        <span className="w-5 h-px bg-[#C9A84C]" />
                        Gabarito · {currentQ.correctAnswer}
                      </p>
                      <button
                        onClick={toggleReveal}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold text-[#94a3b8] hover:text-[#4a5568] hover:bg-slate-50 transition-colors"
                      >
                        <EyeOff className="h-3 w-3" /> Ocultar
                      </button>
                    </div>
                    {currentQ.explanation && (
                      <div className="prose prose-sm max-w-none text-[12.5px] leading-relaxed text-[#3E4945] prose-strong:text-[#191C1D] prose-headings:font-['Manrope']">
                        <MarkdownRenderer content={currentQ.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Próxima */}
              {isRevealed && currentIndex < totalQuestions - 1 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="w-full h-11 rounded-xl font-['Manrope'] text-[13.5px] font-bold text-white inline-flex items-center justify-center gap-2 transition-all group relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)',
                    boxShadow: '0 6px 18px -6px rgba(0,109,91,0.45)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative inline-flex items-center gap-2">
                    Próxima questão <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              )}
              {isRevealed && currentIndex === totalQuestions - 1 && isGenerating && (
                <button
                  disabled
                  className="w-full h-11 rounded-xl text-[12.5px] font-bold border-2 border-slate-200 text-[#94a3b8] bg-slate-50 inline-flex items-center justify-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> Próxima questão chegando…
                </button>
              )}
            </div>
          )}
        </article>
      </ScrollArea>

      <FooterNav
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        isLastAvailable={isLastAvailable}
        showFinishButton={showFinishButton}
        isGenerating={isGenerating}
        onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        onNext={() => setCurrentIndex(currentIndex + 1)}
        onFinish={finishExam}
        questions={questions}
        answers={answers}
        setCurrentIndex={setCurrentIndex}
      />
    </div>
  );
};

export default SimulationView;

/* ─── Subcomponentes ─── */

function ProgressHeader({
  currentIndex, totalQuestions, answeredCount, progress, isComplete, isGenerating,
}: {
  currentIndex: number; totalQuestions: number; answeredCount: number;
  progress: number; isComplete: boolean; isGenerating: boolean;
}) {
  return (
    <header className="shrink-0 mb-4 space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 leading-none mb-1">
            <span className="w-5 h-px bg-[#C9A84C]" />
            Questão {currentIndex + 1} de {isComplete ? totalQuestions : `${totalQuestions}+`}
          </p>
          <p className="text-[11.5px] text-[#4a5568] inline-flex items-center gap-2 leading-none">
            <span>{answeredCount} respondida{answeredCount !== 1 ? 's' : ''}</span>
            {isGenerating && (
              <span className="inline-flex items-center gap-1 text-[#8a6f26] font-bold">
                <Sparkles className="h-3 w-3" /> Gerando…
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #005344, #006D5B, #C9A84C)',
          }}
        />
      </div>
    </header>
  );
}

function LoadingState({ eyebrow, title, hint, compact }: { eyebrow: string; title: string; hint: string; compact?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'} space-y-3`}>
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#003D32] to-[#006D5B] flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(0,109,91,0.5)]">
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        </div>
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#C9A84C] ring-2 ring-white animate-pulse" />
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2">
        <span className="w-5 h-px bg-[#C9A84C]" />
        {eyebrow}
      </p>
      <p className="font-['Manrope'] font-bold text-[16px] text-[#191C1D] tracking-[-0.01em] leading-tight">{title}</p>
      <p className="text-[12px] text-[#4a5568] max-w-[36ch]">{hint}</p>
    </div>
  );
}

function FooterNav({
  currentIndex, totalQuestions, answeredCount, isLastAvailable, showFinishButton, isGenerating,
  onPrev, onNext, onFinish,
  questions, answers, setCurrentIndex,
}: {
  currentIndex: number; totalQuestions: number; answeredCount: number;
  isLastAvailable: boolean; showFinishButton: boolean; isGenerating: boolean;
  onPrev: () => void; onNext: () => void; onFinish: () => void;
  questions: ParsedQuestion[]; answers: Record<number, string>;
  setCurrentIndex: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 shrink-0 gap-2 mt-2">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12px] font-bold border-2 border-slate-200 text-[#4a5568] hover:border-[#005344] hover:text-[#005344] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
        <span className="sm:hidden">Ant.</span>
      </button>

      {totalQuestions <= 12 && (
        <div className="hidden sm:flex items-center gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="transition-all duration-150"
              style={{
                height: 6,
                width: i === currentIndex ? 22 : 8,
                borderRadius: 9999,
                background: i === currentIndex
                  ? '#005344'
                  : answers[i]
                    ? 'rgba(0,109,91,0.35)'
                    : '#e2e8f0',
              }}
              aria-label={`Ir para questão ${i + 1}`}
            />
          ))}
        </div>
      )}

      {showFinishButton ? (
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg font-['Manrope'] text-[12.5px] font-bold text-white transition-all group relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)',
            boxShadow: '0 4px 14px -4px rgba(0,109,91,0.45)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Trophy className="h-4 w-4 relative" />
          <span className="relative">Finalizar ({answeredCount}/{totalQuestions})</span>
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={isLastAvailable && !isGenerating}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12px] font-bold border-2 border-slate-200 text-[#4a5568] hover:border-[#005344] hover:text-[#005344] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Próxima</span>
          <span className="sm:hidden">Próx.</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
