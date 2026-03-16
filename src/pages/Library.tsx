import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import FechamentoLibrary from '@/components/FechamentoLibrary';
import type { Fechamento } from '@/components/FechamentoLibrary';
import ProfileDropdown from '@/components/ProfileDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ContextChat from '@/components/ContextChat';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';

const Library = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFechamento, setSelectedFechamento] = useState<Fechamento | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleExportPDF = async () => {
    if (!selectedFechamento) return;
    setExporting(true);
    try {
      const contentElement = document.getElementById('fechamento-content');
      if (!contentElement) throw new Error('Content not found');
      await exportToPDF({ tema: selectedFechamento.tema, contentElement });
      toast({ title: 'PDF exportado!', description: 'O resumo foi salvo como PDF.' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Erro ao exportar', description: 'Não foi possível exportar o PDF.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleGoToExam = () => {
    if (!selectedFechamento) return;
    const mode = selectedFechamento.tipo === 'caso_clinico' ? 'caso_clinico' : 'prova';
    navigate(`/exam?mode=${mode}`);
  };

  // Full-page detail view
  if (selectedFechamento) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl safe-area-top">
          <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFechamento(null)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Biblioteca</span>
              </Button>
              <div className="h-6 w-px bg-border/50 hidden sm:block" />
              <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                {selectedFechamento.tema}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleGoToExam} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fazer Prova</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
                {exporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                PDF
              </Button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          </div>
        </header>

        {/* Content + Chat */}
        <div className="flex-1 flex">
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-[calc(100vh-4rem)]">
              <div id="fechamento-content" className="container mx-auto px-4 sm:px-8 py-8 max-w-4xl">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={selectedFechamento.resultado} />
                </div>
              </div>
            </ScrollArea>
          </div>
          <ContextChat context={selectedFechamento.resultado} contextLabel="resumo" />
        </div>
      </PageTransition>
    );
  }

  // Grid view
  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <span className="text-base sm:text-lg font-bold text-gradient-medical">PreceptorMED</span>
            </div>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <FechamentoLibrary onSelect={setSelectedFechamento} />
        </div>
      </main>
    </PageTransition>
  );
};

export default Library;
