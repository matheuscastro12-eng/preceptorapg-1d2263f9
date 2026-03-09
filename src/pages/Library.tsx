import { useEffect, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import FechamentoLibrary from '@/components/FechamentoLibrary';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';

interface Fechamento {
  id: string;
  tema: string;
  objetivos: string | null;
  resultado: string;
  favorito: boolean;
  created_at: string;
  tipo: 'fechamento' | 'prova' | 'caso_clinico';
  exam_config: { quantidade: number; nivel: string; simulationMode: boolean } | null;
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
      const contentElement = document.getElementById('fechamento-content');
      if (!contentElement) throw new Error('Content not found');
      
      await exportToPDF({
        tema: selectedFechamento.tema,
        contentElement
      });
      
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
    <PageTransition className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/menu')}
              className="gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <span className="text-base sm:text-lg font-bold text-gradient-medical">PreceptorIA</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Biblioteca</span>
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
        <DialogContent className="max-w-4xl h-[95vh] sm:h-[85vh] w-[95vw] sm:w-full flex flex-col p-0">
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
    </PageTransition>
  );
};

export default Library;
