import { BookOpen, Presentation } from 'lucide-react';

export type GenerationMode = 'fechamento' | 'seminario';

interface ModeToggleProps {
  mode: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  disabled?: boolean;
}

const ModeToggle = ({ mode, onChange, disabled = false }: ModeToggleProps) => {
  return (
    <div className="flex rounded-xl bg-secondary/40 p-1 border border-border/30">
      <button
        onClick={() => onChange('fechamento')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex-1 justify-center ${
          mode === 'fechamento'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <BookOpen className="h-4 w-4" />
        <span>Resumo</span>
      </button>
      <button
        onClick={() => onChange('seminario')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex-1 justify-center ${
          mode === 'seminario'
            ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Presentation className="h-4 w-4" />
        <span>Seminário</span>
      </button>
    </div>
  );
};

export default ModeToggle;
