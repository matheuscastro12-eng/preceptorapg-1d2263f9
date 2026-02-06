import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Loader2, Copy, Download, Sparkles, FileQuestion, CheckCircle2 } from 'lucide-react';

interface ExamResultPanelProps {
  resultado: string;
  generating: boolean;
  exporting: boolean;
  resultRef: RefObject<HTMLDivElement>;
  onCopy: () => void;
  onExportPDF: () => void;
}

const ExamResultPanel = ({
  resultado,
  generating,
  exporting,
  resultRef,
  onCopy,
  onExportPDF,
}: ExamResultPanelProps) => {
  const showActions = resultado && !generating;

  return (
    <div
      className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden"
      ref={resultRef}
    >
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-destructive/10 to-transparent rounded-br-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 p-2.5 ring-1 ring-destructive/20">
            <FileQuestion className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Prova Gerada</h2>
            {generating && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Elaborando questões...
              </p>
            )}
            {showActions && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                Prova concluída
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="gap-1.5 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={exporting}
              className="gap-1.5 border-border/40 hover:bg-accent/10 hover:text-accent hover:border-accent/40 transition-all"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        {resultado ? (
          <MarkdownRenderer
            content={resultado}
            isTyping={generating && resultado.length > 0}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-destructive/20 to-accent/20 blur-2xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center ring-1 ring-border/30">
                <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground/80 mb-2">
              Nenhuma prova gerada
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Selecione conteúdo da biblioteca, configure a prova e clique em "Gerar Prova"
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ExamResultPanel;
