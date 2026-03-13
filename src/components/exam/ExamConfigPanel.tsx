import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import GenerationProgress from '@/components/GenerationProgress';
import ContentSelector from './ContentSelector';
import type { ExamConfig, PracticeMode } from '@/hooks/useExamGenerator';
import { Loader2, Sparkles, GraduationCap, Brain, Target, FileQuestion, Stethoscope, Dumbbell, FlaskConical } from 'lucide-react';

interface ExamConfigPanelProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  config: ExamConfig;
  onConfigChange: (config: ExamConfig) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
  lockedMode?: PracticeMode | null;
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
  lockedMode,
}: ExamConfigPanelProps) => {
  const isProva = config.practiceMode === 'prova';
  const isCasoClin = config.practiceMode === 'caso_clinico';

  return (
    <div className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 sm:p-6 flex flex-col overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-destructive/10 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-center gap-3 mb-5 relative">
        <div className={`rounded-xl bg-gradient-to-br ${isCasoClin ? 'from-accent/20 to-accent/5 ring-accent/20' : 'from-destructive/20 to-destructive/5 ring-destructive/20'} p-2.5 ring-1`}>
          {isCasoClin ? <FlaskConical className="h-5 w-5 text-accent" /> : <Dumbbell className="h-5 w-5 text-destructive" />}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{isCasoClin ? 'Casos Clínicos IA' : 'Gerador de Simulados IA'}</h2>
          <p className="text-sm text-muted-foreground">
            {isCasoClin ? 'Casos clínicos elaborados com base nos seus estudos' : 'Questões no estilo residência com modo simulado'}
          </p>
        </div>
      </div>

      <div className="space-y-5 flex-1 relative overflow-y-auto">
        {/* Practice Mode Toggle — only show when not locked */}
        {!lockedMode && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" />
              Tipo de Prática
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onConfigChange({ ...config, practiceMode: 'prova' })}
                disabled={generating}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  isProva
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-border/40 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
                } disabled:opacity-50`}
              >
                <FileQuestion className="h-5 w-5" />
                <span className="text-xs font-medium">Prova</span>
                <span className="text-[10px] text-muted-foreground">Questões objetivas</span>
              </button>
              <button
                onClick={() => onConfigChange({ ...config, practiceMode: 'caso_clinico' })}
                disabled={generating}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  isCasoClin
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border/40 bg-background/40 hover:bg-accent/10 hover:border-accent/30'
                } disabled:opacity-50`}
              >
                <Stethoscope className="h-5 w-5" />
                <span className="text-xs font-medium">Caso Clínico</span>
                <span className="text-[10px] text-muted-foreground">Caso integrador</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Selector */}
        <div data-tour="content-selector">
          <ContentSelector
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            disabled={generating}
          />
        </div>

        {/* Question Count — only for prova mode */}
        {isProva && (
          <div className="space-y-3" data-tour="exam-config">
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
        )}

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

      </div>

      <div className="space-y-4 mt-6 relative" data-tour="generate-exam-btn">
        <Button
          className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 group ${
            isCasoClin
              ? 'bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-accent/20'
              : 'bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-destructive/20'
          }`}
          onClick={onGenerate}
          disabled={generating || selectedIds.length === 0}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isProva ? 'Gerando prova...' : 'Gerando caso clínico...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              {isProva ? `Gerar Prova (${config.quantidade} questões)` : 'Gerar Caso Clínico'}
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
