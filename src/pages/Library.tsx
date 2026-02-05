import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import FechamentoLibrary from '@/components/FechamentoLibrary';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';

interface Fechamento {
  id: string;
  tema: string;
  objetivos: string | null;
  resultado: string;
  favorito: boolean;
  created_at: string;
}

const Library = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFechamento, setSelectedFechamento] = useState<Fechamento | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleSelectFechamento = (fechamento: Fechamento) => {
    setSelectedFechamento(fechamento);
  };

  const handleExportPDF = async () => {
    if (!selectedFechamento) return;
    
    setExporting(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const pdfContainer = document.createElement('div');
      pdfContainer.innerHTML = document.getElementById('fechamento-content')?.innerHTML || '';
      
      pdfContainer.style.cssText = `
        background: white !important;
        color: #1a1a1a !important;
        padding: 20px 30px !important;
        font-family: 'Georgia', 'Times New Roman', serif !important;
        font-size: 11pt !important;
        line-height: 1.5 !important;
        width: 100% !important;
        max-width: none !important;
        overflow: visible !important;
      `;
      
      const allElements = pdfContainer.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.color = '#1a1a1a';
        htmlEl.style.background = 'transparent';
        htmlEl.style.maxHeight = 'none';
        htmlEl.style.overflow = 'visible';
      });
      
      // H1 - Título principal (capa)
      const h1s = pdfContainer.querySelectorAll('h1');
      h1s.forEach((h1, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = index === 0 
          ? 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 200px; text-align: center; margin-bottom: 30px;'
          : 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 200px; text-align: center; margin-bottom: 30px; page-break-before: always;';
        (h1 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 24pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 2px !important; border-bottom: 3px solid #0d5c4d !important; padding-bottom: 15px !important; margin: 0 !important;';
        h1.parentNode?.insertBefore(wrapper, h1);
        wrapper.appendChild(h1);
      });
      
      // H2 - Seções principais (capa de seção)
      const h2s = pdfContainer.querySelectorAll('h2');
      h2s.forEach((h2) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 180px; text-align: center; margin-bottom: 25px; page-break-before: always;';
        (h2 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 20pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; border-bottom: 2px solid #0d5c4d !important; padding-bottom: 12px !important; margin: 0 !important;';
        h2.parentNode?.insertBefore(wrapper, h2);
        wrapper.appendChild(h2);
      });
      
      // H3 - Subseções (não quebra página, mas destaca)
      const h3s = pdfContainer.querySelectorAll('h3');
      h3s.forEach((h3) => {
        (h3 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 14pt !important; margin-top: 20px !important; margin-bottom: 10px !important; font-weight: bold !important; border-left: 4px solid #0d5c4d !important; padding-left: 12px !important; page-break-after: avoid !important;';
      });
      
      const strongs = pdfContainer.querySelectorAll('strong');
      strongs.forEach((strong) => {
        (strong as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-weight: bold !important;';
      });

      const paragraphs = pdfContainer.querySelectorAll('p');
      paragraphs.forEach((p) => {
        (p as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 8px !important; text-align: justify !important;';
      });

      const lists = pdfContainer.querySelectorAll('ul, ol');
      lists.forEach((list) => {
        (list as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-left: 20px !important; margin-bottom: 10px !important;';
      });

      const listItems = pdfContainer.querySelectorAll('li');
      listItems.forEach((li) => {
        (li as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 4px !important;';
      });

      const spans = pdfContainer.querySelectorAll('span, em, code, a');
      spans.forEach((span) => {
        (span as HTMLElement).style.cssText = 'color: #1a1a1a !important;';
      });
      
      const opt = {
        margin: [10, 12, 10, 12] as [number, number, number, number],
        filename: `fechamento-${selectedFechamento.tema.trim().toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'] as ('avoid-all' | 'css' | 'legacy')[],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['h1', 'h2', 'h3', 'h4', 'tr']
        }
      };
      
      await html2pdf().set(opt).from(pdfContainer).save();
      
      toast({
        title: 'PDF exportado!',
        description: 'O fechamento foi salvo como PDF.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient-medical">PreceptorAPG</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Biblioteca de Fechamentos</span>
            </div>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <FechamentoLibrary onSelect={handleSelectFechamento} />
        </div>
      </main>

      {/* Modal de Visualização */}
      <Dialog open={!!selectedFechamento} onOpenChange={(open) => !open && setSelectedFechamento(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gradient-medical">
                {selectedFechamento?.tema}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            <div id="fechamento-content" className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={selectedFechamento?.resultado || ''} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
