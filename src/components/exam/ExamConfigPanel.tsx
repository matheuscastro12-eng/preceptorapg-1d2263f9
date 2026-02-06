import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import GenerationProgress from '@/components/GenerationProgress';
import ContentSelector from './ContentSelector';
import type { DifficultyLevel, ExamConfig } from '@/hooks/useExamGenerator';
import { Loader2, Sparkles, GraduationCap, Brain, Target, ToggleLeft, FileQuestion } from 'lucide-react';

interface ExamConfigPanelProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  config: ExamConfig;
  onConfigChange: (config: ExamConfig) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
}

const ExamConfigPanel = ({
  selectedIds,
  onSelectionChange,
  config,
  onConfigChange,
  generating,
  hasStartedReceiving,
  isComplete,
  onGenerate,
}: ExamConfigPanelProps) => {
  return (
    <div className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-destructive/10 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-center gap-3 mb-5 relative">
        <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 p-2.5 ring-1 ring-destructive/20">
          <FileQuestion className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Gerador de Provas</h2>
          <p className="text-sm text-muted-foreground">
            Crie provas com casos clínicos e questões conceituais
          </p>
        </div>
      </div>

      <div className="space-y-5 flex-1 relative overflow-y-auto">
        {/* Content Selector */}
        <ContentSelector
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          disabled={generating}
        />

        {/* Question Count */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            Quantidade de Questões
            <span className="ml-auto text-primary font-semibold">{config.quantidade}</span>
          </Label>
          <Slider
            value={[config.quantidade]}
            onValueChange={([v]) => onConfigChange({ ...config, quantidade: v })}
            min={5}
            max={60}
            step={5}
            disabled={generating}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
            <span>30</span>
            <span>60</span>
          </div>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-accent" />
            Nível de Dificuldade
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConfigChange({ ...config, nivel: 'basico' })}
              disabled={generating}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                config.nivel === 'basico'
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/40 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
              } disabled:opacity-50`}
            >
              <Brain className="h-5 w-5" />
              <span className="text-xs font-medium">Ciclo Básico</span>
            </button>
            <button
              onClick={() => onConfigChange({ ...config, nivel: 'residencia' })}
              disabled={generating}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                config.nivel === 'residencia'
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/40 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
              } disabled:opacity-50`}
            >
              <GraduationCap className="h-5 w-5" />
              <span className="text-xs font-medium">Residência</span>
            </button>
          </div>
        </div>

        {/* Simulation Mode */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background/40">
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-accent" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">Modo Simulação</Label>
              <p className="text-xs text-muted-foreground">Gabaritos ocultos, uma questão por vez</p>
            </div>
          </div>
          <Switch
            checked={config.simulationMode}
            onCheckedChange={(v) => onConfigChange({ ...config, simulationMode: v })}
            disabled={generating}
          />
        </div>
      </div>

      <div className="space-y-4 mt-6 relative">
        <Button
          className="w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 group bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-destructive/20 hover:shadow-destructive/30"
          onClick={onGenerate}
          disabled={generating || selectedIds.length === 0}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando prova...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Gerar Prova ({config.quantidade} questões)
            </>
          )}
        </Button>

        {selectedIds.length === 0 && !generating && (
          <p className="text-xs text-center text-muted-foreground">
            Selecione pelo menos um conteúdo da biblioteca acima
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

export default ExamConfigPanel;
