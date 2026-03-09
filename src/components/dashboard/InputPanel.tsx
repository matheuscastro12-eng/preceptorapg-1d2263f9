import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import GenerationProgress from '@/components/GenerationProgress';
import ModeToggle, { type GenerationMode } from './ModeToggle';
import { Loader2, Sparkles, Brain, Target, Lightbulb, Presentation, AlertTriangle, Timer } from 'lucide-react';

interface InputPanelProps {
  tema: string;
  setTema: (value: string) => void;
  objetivos: string;
  setObjetivos: (value: string) => void;
  modo: GenerationMode;
  setModo: (value: GenerationMode) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
  canGenerate?: boolean;
  cooldown?: boolean;
}

const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;

const InputPanel = ({
  tema,
  setTema,
  objetivos,
  setObjetivos,
  modo,
  setModo,
  generating,
  hasStartedReceiving,
  isComplete,
  onGenerate,
  canGenerate = true,
  cooldown = false,
}: InputPanelProps) => {
  const suggestions = [
    'Insuficiência Cardíaca',
    'Diabetes Mellitus Tipo 2',
    'Hipertensão Arterial',
    'TDAH',
  ];

  const isSeminario = modo === 'seminario';

  return (
    <div className="relative rounded-2xl border border-border/30 bg-card p-6 flex flex-col overflow-hidden">
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${isSeminario ? 'from-accent/10' : 'from-primary/10'} to-transparent rounded-bl-full pointer-events-none transition-colors duration-500`} />
      
      <div className="flex items-center gap-3 mb-5 relative">
        <div className={`rounded-xl bg-gradient-to-br ${isSeminario ? 'from-accent/20 to-accent/5 ring-accent/20' : 'from-primary/20 to-primary/5 ring-primary/20'} p-2.5 ring-1 transition-colors duration-500`}>
          {isSeminario ? (
            <Presentation className="h-5 w-5 text-accent" />
          ) : (
            <Brain className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {isSeminario ? 'Roteiro de Seminário' : 'Novo Fechamento'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSeminario 
              ? 'Crie slides com script e clinical pearls'
              : 'Crie conteúdo educacional com IA'}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-5 relative" data-tour="mode-toggle">
        <ModeToggle mode={modo} onChange={setModo} disabled={generating} />
      </div>

      <div className="space-y-5 flex-1 relative">
        <div className="space-y-2.5" data-tour="tema-input">
          <Label htmlFor="tema" className="text-sm font-medium flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            Tema Central <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tema"
            placeholder="Ex: Insuficiência Cardíaca Congestiva"
            value={tema}
            onChange={(e) => setTema(e.target.value.slice(0, MAX_TEMA_LENGTH))}
            maxLength={MAX_TEMA_LENGTH}
            disabled={generating}
            className="h-12 bg-background/60 border-border/40 focus:border-primary/60 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
          {tema.length > MAX_TEMA_LENGTH * 0.8 && (
            <p className="text-[10px] text-muted-foreground text-right">{tema.length}/{MAX_TEMA_LENGTH}</p>
          )}
          
          {/* Quick suggestions */}
          {!tema && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setTema(suggestion)}
                  disabled={generating}
                  className="px-3 py-1 text-xs rounded-full bg-secondary/60 hover:bg-primary/20 hover:text-primary border border-border/30 transition-all disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2.5 flex-1" data-tour="objetivos-input">
          <Label htmlFor="objetivos" className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-accent" />
            Objetivos 
            <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="objetivos"
            placeholder={isSeminario
              ? "Ex: Focar na fisiopatologia e tratamento farmacológico para apresentação de 20 minutos..."
              : "Ex: Compreender a fisiopatologia, identificar sinais e sintomas, entender o tratamento..."
            }
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value.slice(0, MAX_OBJETIVOS_LENGTH))}
            maxLength={MAX_OBJETIVOS_LENGTH}
            disabled={generating}
            className="min-h-[140px] resize-none bg-background/60 border-border/40 focus:border-primary/60 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] text-muted-foreground/60 leading-tight flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Restrinja-se a objetivos médicos/acadêmicos. Conteúdos fora do escopo biomédico serão ignorados.
            </p>
            {objetivos.length > MAX_OBJETIVOS_LENGTH * 0.5 && (
              <p className="text-[10px] text-muted-foreground shrink-0">{objetivos.length}/{MAX_OBJETIVOS_LENGTH}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6 relative">
        <Button 
          className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 group ${
            isSeminario
              ? 'bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-accent/20 hover:shadow-accent/30'
              : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-primary/20 hover:shadow-primary/30'
          }`}
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isSeminario ? 'Gerando roteiro...' : 'Gerando conteúdo...'}
            </>
          ) : cooldown ? (
            <>
              <Timer className="mr-2 h-5 w-5" />
              Aguarde antes de gerar novamente...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              {isSeminario ? 'Gerar Roteiro de Slides' : 'Gerar Fechamento'}
            </>
          )}
        </Button>

        {generating && (
          <p className="text-[10px] text-destructive/70 text-center flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Não feche ou atualize a página durante a geração.
          </p>
        )}

        <GenerationProgress 
          isGenerating={generating}
          hasStartedReceiving={hasStartedReceiving}
          isComplete={isComplete}
        />
      </div>
    </div>
  );
};

export default InputPanel;
