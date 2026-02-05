import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import GenerationProgress from '@/components/GenerationProgress';
import { Loader2, Sparkles, Brain, Target, Lightbulb } from 'lucide-react';

interface InputPanelProps {
  tema: string;
  setTema: (value: string) => void;
  objetivos: string;
  setObjetivos: (value: string) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
}

const InputPanel = ({
  tema,
  setTema,
  objetivos,
  setObjetivos,
  generating,
  hasStartedReceiving,
  isComplete,
  onGenerate,
}: InputPanelProps) => {
  const suggestions = [
    'Insuficiência Cardíaca',
    'Diabetes Mellitus Tipo 2',
    'Hipertensão Arterial',
    'TDAH',
  ];

  return (
    <div className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 ring-1 ring-primary/20">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Novo Fechamento</h2>
          <p className="text-sm text-muted-foreground">
            Crie conteúdo educacional com IA
          </p>
        </div>
      </div>

      <div className="space-y-5 flex-1 relative">
        <div className="space-y-2.5">
          <Label htmlFor="tema" className="text-sm font-medium flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            Tema Central <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tema"
            placeholder="Ex: Insuficiência Cardíaca Congestiva"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            disabled={generating}
            className="h-12 bg-background/60 border-border/40 focus:border-primary/60 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
          
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
        
        <div className="space-y-2.5 flex-1">
          <Label htmlFor="objetivos" className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-accent" />
            Objetivos 
            <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="objetivos"
            placeholder="Ex: Compreender a fisiopatologia, identificar sinais e sintomas, entender o tratamento..."
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
            disabled={generating}
            className="min-h-[140px] resize-none bg-background/60 border-border/40 focus:border-primary/60 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="space-y-4 mt-6 relative">
        <Button 
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 group" 
          onClick={onGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando conteúdo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Gerar Fechamento
            </>
          )}
        </Button>

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
