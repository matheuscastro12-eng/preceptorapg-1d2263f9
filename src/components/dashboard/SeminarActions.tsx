import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Timer, ChevronDown, ChevronUp } from 'lucide-react';

interface SeminarActionsProps {
  resultado: string;
}

const SeminarActions = ({ resultado }: SeminarActionsProps) => {
  const { toast } = useToast();
  const [showTimeDetails, setShowTimeDetails] = useState(false);

  // Extract slide visual content for "Copy for Slides"
  const slideVisualContent = useMemo(() => {
    const lines = resultado.split('\n');
    const slides: { title: string; content: string[] }[] = [];
    let currentSlide: { title: string; content: string[] } | null = null;
    let isVisualSection = false;

    for (const line of lines) {
      // Detect slide headers (## Slide X: Title)
      const slideMatch = line.match(/^##\s*Slide\s*\d+\s*:\s*(.+)/i);
      if (slideMatch) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = { title: slideMatch[1].trim(), content: [] };
        isVisualSection = false;
        continue;
      }

      // Detect visual content section
      if (line.match(/conteúdo visual|o que colocar no slide/i)) {
        isVisualSection = true;
        continue;
      }

      // Stop visual section at next section header
      if (line.match(/^###\s*(🎤|Script|💡|Clinical)/i)) {
        isVisualSection = false;
        continue;
      }

      if (isVisualSection && currentSlide && line.trim()) {
        currentSlide.content.push(line);
      }
    }
    if (currentSlide) slides.push(currentSlide);

    return slides;
  }, [resultado]);

  // Estimate presentation time based on script content
  const estimatedTime = useMemo(() => {
    const lines = resultado.split('\n');
    let totalWords = 0;
    let isScriptSection = false;
    const slideTimings: { title: string; minutes: number }[] = [];
    let currentSlideTitle = '';
    let currentSlideWords = 0;

    for (const line of lines) {
      const slideMatch = line.match(/^##\s*Slide\s*\d+\s*:\s*(.+)/i);
      if (slideMatch) {
        if (currentSlideTitle && currentSlideWords > 0) {
          const mins = Math.max(1, Math.round(currentSlideWords / 130)); // ~130 words/min spoken
          slideTimings.push({ title: currentSlideTitle, minutes: mins });
        }
        currentSlideTitle = slideMatch[1].trim();
        currentSlideWords = 0;
        isScriptSection = false;
        continue;
      }

      if (line.match(/script do orador|o que falar/i)) {
        isScriptSection = true;
        continue;
      }

      if (line.match(/^###\s*(📊|💡|Clinical|Conteúdo Visual)/i)) {
        isScriptSection = false;
        continue;
      }

      if (isScriptSection && line.trim()) {
        const words = line.trim().split(/\s+/).length;
        totalWords += words;
        currentSlideWords += words;
      }
    }

    // Push last slide
    if (currentSlideTitle && currentSlideWords > 0) {
      const mins = Math.max(1, Math.round(currentSlideWords / 130));
      slideTimings.push({ title: currentSlideTitle, minutes: mins });
    }

    const totalMinutes = Math.max(1, Math.round(totalWords / 130));
    return { totalMinutes, slideTimings };
  }, [resultado]);

  const handleCopySlides = () => {
    if (slideVisualContent.length === 0) {
      toast({
        title: 'Nenhum slide encontrado',
        description: 'O conteúdo não contém slides formatados.',
        variant: 'destructive',
      });
      return;
    }

    const text = slideVisualContent
      .map(slide => `${slide.title}\n${slide.content.join('\n')}`)
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text);
    toast({
      title: 'Conteúdo dos slides copiado!',
      description: 'Cole diretamente no PowerPoint ou Canva.',
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border/20">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopySlides}
          className="gap-1.5 border-border/40 hover:bg-accent/10 hover:text-accent hover:border-accent/40 transition-all"
        >
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Copiar para Slides</span>
          <span className="sm:hidden">Slides</span>
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
          <p className="font-medium text-muted-foreground mb-2">Tempo estimado por slide:</p>
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
