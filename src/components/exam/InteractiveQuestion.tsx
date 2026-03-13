import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export interface ParsedQuestion {
  number: number;
  enunciado: string;
  alternatives: { letter: string; text: string }[];
  explanation: string;
  correctAnswer: string;
  type?: string;
  tema?: string;
}

interface InteractiveQuestionProps {
  question: ParsedQuestion;
  index: number;
}

const defaultLetterStyle = 'from-muted/50 to-muted/30 text-muted-foreground';

const InteractiveQuestion = ({ question, index }: InteractiveQuestionProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (letter: string) => {
    if (revealed) return;
    setSelected(letter);
  };

  const handleReveal = () => setRevealed(true);
  const handleHide = () => setRevealed(false);

  const isCorrect = selected === question.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-border/30 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/20">
          {question.number}
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {question.type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
              {question.type}
            </span>
          )}
          {question.tema && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              {question.tema}
            </span>
          )}
        </div>
        {revealed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="shrink-0"
          >
            {isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
          </motion.div>
        )}
      </div>

      {/* Enunciado */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownRenderer content={question.enunciado} />
      </div>

      {/* Alternatives */}
      <div className="space-y-2">
        {question.alternatives.map((alt, altIdx) => {
          const isSelected = selected === alt.letter;
          const isCorrectAlt = alt.letter === question.correctAnswer;
          const showFeedback = revealed && selected;

          return (
            <motion.button
              key={alt.letter}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 + altIdx * 0.04 }}
              onClick={() => handleSelect(alt.letter)}
              disabled={revealed}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group ${
                showFeedback
                  ? isCorrectAlt
                    ? 'border-primary/50 bg-primary/10 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]'
                    : isSelected
                      ? 'border-destructive/50 bg-destructive/10 shadow-[0_0_12px_-4px_hsl(var(--destructive)/0.3)]'
                      : 'border-border/20 bg-background/30 opacity-50'
                  : isSelected
                    ? 'border-primary/50 bg-primary/10 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.2)]'
                    : 'border-border/30 bg-background/40 hover:bg-accent/10 hover:border-accent/30 hover:shadow-sm'
              } disabled:cursor-default`}
            >
              <div className="flex items-start gap-3">
                <motion.span
                  animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br transition-all duration-300 ${
                    showFeedback
                      ? isCorrectAlt
                        ? 'from-primary/30 to-primary/10 text-primary ring-2 ring-primary/30'
                        : isSelected
                          ? 'from-destructive/30 to-destructive/10 text-destructive ring-2 ring-destructive/30'
                          : 'from-muted/50 to-muted/30 text-muted-foreground'
                      : isSelected
                        ? 'from-primary/30 to-primary/10 text-primary ring-2 ring-primary/30'
                        : `${defaultLetterStyle} group-hover:ring-1 group-hover:ring-accent/30`
                  }`}
                >
                  {alt.letter}
                </motion.span>
                <span className="text-sm flex-1 pt-1">{alt.text}</span>
                <AnimatePresence>
                  {showFeedback && isCorrectAlt && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    </motion.div>
                  )}
                  {showFeedback && isSelected && !isCorrectAlt && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Reveal / Explanation */}
      <AnimatePresence mode="wait">
        {selected && !revealed && (
          <motion.div
            key="reveal-btn"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Button variant="outline" size="sm" onClick={handleReveal} className="gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary">
              <Eye className="h-4 w-4" />
              Ver Gabarito
            </Button>
          </motion.div>
        )}

        {revealed && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-border/30 bg-secondary/20 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Gabarito: {question.correctAnswer}
                {isCorrect && <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">Correto!</span>}
                {!isCorrect && selected && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Incorreto</span>}
              </span>
              <Button variant="ghost" size="sm" onClick={handleHide} className="gap-1 h-7 text-xs">
                <EyeOff className="h-3 w-3" />
                Ocultar
              </Button>
            </div>
            {question.explanation && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <MarkdownRenderer content={question.explanation} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveQuestion;

// Re-export the parser so ExamResultPanel can use it
export function parseQuestionsFromMarkdown(markdown: string): ParsedQuestion[] {
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
