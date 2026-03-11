import { RefObject, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeminarActions from './SeminarActions';
import type { GenerationMode } from './ModeToggle';
import { Loader2, Copy, Download, Save, Sparkles, FileText, CheckCircle2, Presentation, GraduationCap } from 'lucide-react';

/** Strip AI preamble/closing from raw markdown text */
const stripMarkdownPreamble = (md: string): string => {
  const lines = md.split('\n');
  
  // Strip leading preamble lines
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) { startIdx = i + 1; continue; }
    // Keep headings, lists, tables, hrs
    if (/^#{1,6}\s/.test(trimmed) || /^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^\|/.test(trimmed) || /^---/.test(trimmed)) break;
    // Check preamble patterns
    const isPreamble = [
      /^(com certeza|claro|certo|ok|perfeito|vamos|aqui est[áa]|segue|pronto|elabor)/i,
      /^(como (monitor|preceptor|coordenador|professor|solicitado|seu))/i,
      /^(este (caso|material|conte[úu]do|fechamento|semin[áa]rio|documento))/i,
      /^(a seguir|abaixo|conforme solicitado|conforme pedido)/i,
      /^(apresento|segue abaixo|seguem|vou (apresentar|elaborar|gerar))/i,
      /^(entendido|com base|baseado|de acordo)/i,
      /^(ol[áa]|boa noite|bom dia|boa tarde)/i,
      /^(preparei|elaborei|criei|gerei|montei|organizei|estruturei)/i,
      /^(com prazer|sem problemas|sem d[úu]vida|[ée] um prazer|[ée] uma honra)/i,
      /^(prezad[oa]s?\s+(estudantes?|alunos?|colegas?))/i,
      /^(vamos [àa] explora[çc][ãa]o|vamos explorar|vamos come[çc]ar|vamos dissecar|vamos ao)/i,
    ].some(p => p.test(trimmed));
    if (isPreamble) { startIdx = i + 1; continue; }
    // Short intro paragraph before any heading
    if (trimmed.length < 400 && !trimmed.startsWith('#')) { startIdx = i + 1; continue; }
    break;
  }
  
  return lines.slice(startIdx).join('\n').trim();
};

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
  resultado,
  generating,
  saving,
  exporting,
  resultRef,
  modo,
  tema,
  onSave,
  onCopy,
  onExportPDF,
  onGenerateExam,
}: ResultPanelProps) => {
  const showActions = resultado && !generating;
  const isSeminario = modo === 'seminario';

  return (
    <div 
      className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden" 
      ref={resultRef}
    >
      {/* Decorative gradient */}
      <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${isSeminario ? 'from-accent/10' : 'from-accent/10'} to-transparent rounded-br-full pointer-events-none`} />
      
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-br ${isSeminario ? 'from-accent/20 to-accent/5 ring-accent/20' : 'from-accent/20 to-accent/5 ring-accent/20'} p-2.5 ring-1`}>
            {isSeminario ? (
              <Presentation className="h-5 w-5 text-accent" />
            ) : (
              <FileText className="h-5 w-5 text-accent" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {isSeminario ? 'Roteiro de Slides' : 'Resultado'}
            </h2>
            {generating && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {isSeminario ? 'Montando roteiro...' : 'Escrevendo...'}
              </p>
            )}
            {showActions && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                Concluído
              </p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSave}
              disabled={saving}
              className="gap-1.5 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Salvar</span>
            </Button>
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
            {onGenerateExam && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onGenerateExam}
                className="gap-1.5 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Gerar Prova</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        {resultado ? (
          <>
            <MarkdownRenderer 
              content={resultado} 
              isTyping={generating && resultado.length > 0}
            />
            {/* Disclaimer after result */}
            {!generating && resultado && (
              <div className="mt-6 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-destructive/80">⚠️ Aviso:</strong> Este conteúdo foi gerado por Inteligência Artificial para fins exclusivamente educacionais. 
                  Pode conter imprecisões ou informações desatualizadas. Sempre valide com fontes primárias (livros-texto, artigos científicos, protocolos institucionais). 
                  Não substitui orientação médica profissional. Conforme Resolução CFM nº 2.338/2023, a responsabilidade pelo uso é do usuário.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 opacity-50 animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center ring-1 ring-border/30">
                {isSeminario ? (
                  <Presentation className="h-10 w-10 text-muted-foreground/40" />
                ) : (
                  <Sparkles className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground/80 mb-2">
              {isSeminario ? 'Nenhum roteiro gerado' : 'Nenhum fechamento gerado'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {isSeminario 
                ? 'Insira um tema e clique em "Gerar Roteiro de Slides" para criar seu seminário'
                : 'Insira um tema médico e clique em "Gerar Fechamento" para começar'}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Seminar-specific actions */}
      {showActions && isSeminario && (
        <SeminarActions resultado={resultado} tema={tema} />
      )}
    </div>
  );
};

export default ResultPanel;
