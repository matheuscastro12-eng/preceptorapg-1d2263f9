import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Sparkles, Brain, FileText, CheckCircle } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
}

const statusMessages = [
  { min: 0, max: 15, message: 'Analisando tema...', icon: Brain },
  { min: 15, max: 40, message: 'Pesquisando literatura médica...', icon: FileText },
  { min: 40, max: 70, message: 'Gerando conteúdo técnico...', icon: Sparkles },
  { min: 70, max: 95, message: 'Finalizando estrutura...', icon: FileText },
  { min: 95, max: 100, message: 'Concluído!', icon: CheckCircle },
];

const GenerationProgress = ({ isGenerating, hasStartedReceiving, isComplete }: GenerationProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      if (isComplete) {
        setProgress(100);
      } else {
        setProgress(0);
      }
      return;
    }

    // Initial fast progress (0-20% in 3 seconds)
    const initialTimer = setTimeout(() => {
      setProgress(20);
    }, 100);

    // Gradual progress (20-75% over time)
    const gradualInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 75) return prev;
        return prev + 0.8;
      });
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(gradualInterval);
    };
  }, [isGenerating, isComplete]);

  // Accelerate when receiving data
  useEffect(() => {
    if (hasStartedReceiving && progress < 80) {
      setProgress(80);
    }
  }, [hasStartedReceiving, progress]);

  // Increment while receiving chunks
  useEffect(() => {
    if (hasStartedReceiving && isGenerating) {
      const chunkInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.3, 95));
      }, 200);
      return () => clearInterval(chunkInterval);
    }
  }, [hasStartedReceiving, isGenerating]);

  // Complete when done
  useEffect(() => {
    if (isComplete) {
      // Small delay for smooth visual transition to 100%
      const timer = setTimeout(() => setProgress(100), 200);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Safety: if generating stops without isComplete, force complete
  useEffect(() => {
    if (!isGenerating && !isComplete && hasStartedReceiving) {
      const timer = setTimeout(() => setProgress(100), 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, isComplete, hasStartedReceiving]);

  // Smooth display transition
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.5) return progress;
        return prev + diff * 0.15;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [progress]);

  const currentStatus = statusMessages.find(
    s => displayProgress >= s.min && displayProgress < s.max
  ) || statusMessages[statusMessages.length - 1];

  const StatusIcon = currentStatus.icon;

  if (!isGenerating && !isComplete) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <StatusIcon className={cn(
            "h-4 w-4",
            isGenerating && "animate-pulse text-primary"
          )} />
          <span className="font-medium">{currentStatus.message}</span>
        </div>
        <span className="font-mono text-xs font-bold text-primary">
          {Math.round(displayProgress)}%
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={displayProgress} 
          className="h-2 bg-secondary/50" 
        />
        {/* Glow effect */}
        <div 
          className="absolute top-0 left-0 h-2 rounded-full bg-primary/50 blur-sm transition-all duration-300"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
};

export default GenerationProgress;
