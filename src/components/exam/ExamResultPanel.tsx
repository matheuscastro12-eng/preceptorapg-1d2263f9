import { RefObject, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import InteractiveQuestion, { parseQuestionsFromMarkdown } from '@/components/exam/InteractiveQuestion';
import { Loader2, Copy, Download, Sparkles, FileQuestion, CheckCircle2, Stethoscope, Save } from 'lucide-react';

interface ExamResultPanelProps {
  resultado: string;
  generating: boolean;
  exporting: boolean;
  resultRef: RefObject<HTMLDivElement>;
  onCopy: () => void;
  onExportPDF: () => void;
  onSave?: (tema: string) => Promise<void>;
  title?: string;
  generatingLabel?: string;
}

const ExamResultPanel = ({
  resultado,
  generating,
  exporting,
  resultRef,
  onCopy,
  onExportPDF,
  onSave,
  title = 'Prova Gerada',
  generatingLabel = 'Elaborando questões...',
}: ExamResultPanelProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTema, setSaveTema] = useState('');
  const [saving, setSaving] = useState(false);

  const showActions = resultado && !generating;
  const isProva = !title.includes('Caso');

  const parsedQuestions = useMemo(() => {
    if (!isProva || !resultado) return [];
    return parseQuestionsFromMarkdown(resultado);
  }, [resultado, isProva]);

  const handleSave = async () => {
    if (!onSave || !saveTema.trim()) return;
    
    setSaving(true);
    try {
      await onSave(saveTema);
      setSaveDialogOpen(false);
      setSaveTema('');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setSaving(false);
    }
  };

  const hasInteractiveQuestions = isProva && parsedQuestions.length > 0;

  return (
    <>
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-destructive/10 to-transparent rounded-br-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 p-2.5 ring-1 ring-destructive/20">
            {title.includes('Caso') ? (
              <Stethoscope className="h-5 w-5 text-accent" />
            ) : (
              <FileQuestion className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {generating && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {generatingLabel}
              </p>
            )}
            {showActions && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                Concluído — {hasInteractiveQuestions ? `${parsedQuestions.length} questões interativas` : 'Pronto'}
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
            {onSave && (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border/40 hover:bg-green-50 hover:text-green-700 hover:border-green-400/40 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Salvar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Salvar na Biblioteca</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Nome para identificar..."
                      value={saveTema}
                      onChange={(e) => setSaveTema(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSaveDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={!saveTema.trim() || saving}
                      >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={exporting}
              className="gap-1.5 border-border/40 hover:bg-accent/10 hover:text-accent hover:border-accent/40 transition-all"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4" ref={resultRef}>
        {resultado ? (
          hasInteractiveQuestions ? (
            <div className="space-y-5 pb-4">
              {parsedQuestions.map((q, i) => (
                <InteractiveQuestion key={q.number} question={q} index={i} />
              ))}
              {generating && (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">Gerando mais questões...</span>
                </div>
              )}
            </div>
          ) : (
            <MarkdownRenderer content={resultado} isTyping={generating && resultado.length > 0} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-destructive/20 to-accent/20 blur-2xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center ring-1 ring-border/30">
                <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground/80 mb-2">Nenhum conteúdo gerado</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Selecione conteúdo da biblioteca, configure e clique em gerar
            </p>
          </div>
        )}
      </ScrollArea>
    </>
  );
};

export default ExamResultPanel;
