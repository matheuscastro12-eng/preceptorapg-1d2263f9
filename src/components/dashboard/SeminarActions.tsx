import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Timer, ChevronDown, ChevronUp, Presentation, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SeminarActionsProps {
  resultado: string;
  tema?: string;
}

const SeminarActions = ({ resultado, tema }: SeminarActionsProps) => {
  const { toast } = useToast();
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  const [sendingToManus, setSendingToManus] = useState(false);

  // Estimate presentation time based on content
  const estimatedTime = useMemo(() => {
    const lines = resultado.split('\n');
    let totalWords = 0;
    const slideTimings: { title: string; minutes: number }[] = [];
    let currentSlideTitle = '';
    let currentSlideWords = 0;

    for (const line of lines) {
      const sectionMatch = line.match(/^##\s*\d+\.\s*(.+)/i) || line.match(/^##\s*(.+)/i);
      if (sectionMatch) {
        if (currentSlideTitle && currentSlideWords > 0) {
          const mins = Math.max(1, Math.round(currentSlideWords / 130));
          slideTimings.push({ title: currentSlideTitle, minutes: mins });
        }
        currentSlideTitle = sectionMatch[1].trim();
        currentSlideWords = 0;
        continue;
      }

      if (line.trim()) {
        const words = line.trim().split(/\s+/).length;
        totalWords += words;
        currentSlideWords += words;
      }
    }

    if (currentSlideTitle && currentSlideWords > 0) {
      const mins = Math.max(1, Math.round(currentSlideWords / 130));
      slideTimings.push({ title: currentSlideTitle, minutes: mins });
    }

    const totalMinutes = Math.max(1, Math.round(totalWords / 130));
    return { totalMinutes, slideTimings };
  }, [resultado]);

  const handleSendToManus = async () => {
    setSendingToManus(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-to-manus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ content: resultado, tema }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar para o Manus');
      }

      const data = await response.json();

      if (data.task_url) {
        window.open(data.task_url, '_blank');
        toast({
          title: 'Enviado para o Manus! 🎉',
          description: 'A apresentação está sendo criada. Acompanhe na aba que foi aberta.',
        });
      } else {
        throw new Error('URL da tarefa não retornada pelo Manus');
      }
    } catch (error) {
      console.error('Manus error:', error);
      toast({
        title: 'Erro ao gerar slides',
        description: error instanceof Error ? error.message : 'Não foi possível enviar para o Manus. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSendingToManus(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border/20">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendToManus}
          disabled={sendingToManus}
          className="gap-1.5 border-accent/40 bg-accent/5 hover:bg-accent/15 hover:text-accent hover:border-accent/60 text-accent transition-all"
        >
          {sendingToManus ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Presentation className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {sendingToManus ? 'Criando slides...' : 'Gerar Slides com Manus'}
          </span>
          <span className="sm:hidden">
            {sendingToManus ? 'Criando...' : 'Slides'}
          </span>
          {!sendingToManus && <ExternalLink className="h-3 w-3 opacity-60" />}
        </Button>

        <button
          onClick={() => setShowTimeDetails(!showTimeDetails)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-secondary/40 hover:bg-secondary/60 border border-border/30 transition-all"
        >
          <Timer className="h-4 w-4 text-accent" />
          <span className="font-medium">~{estimatedTime.totalMinutes} min</span>
          {showTimeDetails ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {showTimeDetails && estimatedTime.slideTimings.length > 0 && (
        <div className="rounded-lg bg-secondary/20 border border-border/20 p-3 space-y-1.5 text-xs animate-in slide-in-from-top-2 duration-200">
          <p className="font-medium text-muted-foreground mb-2">Tempo estimado por seção:</p>
          {estimatedTime.slideTimings.map((slide, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-foreground/80 truncate max-w-[200px]">{slide.title}</span>
              <span className="text-accent font-medium ml-2 shrink-0">~{slide.minutes} min</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/20 font-medium">
            <span>Total estimado</span>
            <span className="text-accent">~{estimatedTime.totalMinutes} min</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeminarActions;
