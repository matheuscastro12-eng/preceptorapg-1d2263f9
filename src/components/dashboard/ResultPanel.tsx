import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeminarActions from './SeminarActions';
import type { GenerationMode } from './ModeToggle';
import { Loader2, Copy, Download, Save, Sparkles, FileText, CheckCircle2, Presentation, GraduationCap } from 'lucide-react';

interface ResultPanelProps {
  resultado: string;
  generating: boolean;
  saving: boolean;
  exporting: boolean;
  resultRef: RefObject<HTMLDivElement>;
  modo: GenerationMode;
  tema?: string;
  onSave: () => void;
  onCopy: () => void;
  onExportPDF: () => void;
  onGenerateExam?: () => void;
}

const ResultPanel = ({
  resultado, generating, saving, exporting,
  resultRef, modo, tema, onSave, onCopy, onExportPDF, onGenerateExam,
}: ResultPanelProps) => {
  const showActions = resultado && !generating;
  const isSeminario = modo === 'seminario';

  return (
    <div className="rounded-lg border border-border/50 bg-card flex flex-col h-full" ref={resultRef}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isSeminario
            ? <Presentation className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            : <FileText className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          }
          <span className="text-[13px] font-medium text-muted-foreground">
            {isSeminario ? 'Roteiro de Slides' : 'Resultado'}
          </span>
          {generating && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {isSeminario ? 'Montando roteiro...' : 'Escrevendo...'}
            </span>
          )}
          {showActions && (
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              Concluído
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1 shrink-0">
            {[
              { icon: saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'Salvar', onClick: onSave, disabled: saving },
              { icon: <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'Copiar', onClick: onCopy, disabled: false },
              { icon: exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'PDF', onClick: onExportPDF, disabled: exporting },
            ].map(({ icon, label, onClick, disabled }) => (
              <button
                key={label}
                onClick={onClick}
                disabled={disabled}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            {onGenerateExam && (
              <button
                onClick={onGenerateExam}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-all duration-200 active:scale-95"
              >
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Gerar Prova</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-6 py-6">
        {resultado ? (
          <>
            <MarkdownRenderer content={resultado} isTyping={generating && resultado.length > 0} />
            {!generating && (
              <p className="mt-8 text-[11px] text-muted-foreground/50 leading-relaxed border-t border-border/30 pt-4">
                Conteúdo gerado por IA para fins educacionais. Pode conter imprecisões — valide com fontes primárias. Não substitui orientação médica. (CFM 2.338/2023)
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
            <div className="animate-float">
              {isSeminario
                ? <Presentation className="h-10 w-10 text-slate-200" strokeWidth={1} />
                : <Sparkles className="h-10 w-10 text-slate-200" strokeWidth={1} />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isSeminario ? 'Nenhum roteiro gerado' : 'Nenhum resumo gerado'}
              </p>
              <p className="text-[12px] text-slate-300 mt-1 max-w-[200px] leading-relaxed">
                {isSeminario
                  ? 'Insira um tema e gere o roteiro'
                  : 'Insira um tema médico e gere o resumo'}
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      {showActions && isSeminario && (
        <SeminarActions resultado={resultado} tema={tema} />
      )}
    </div>
  );
};

export default ResultPanel;
