import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download, Loader2, Play, Layers, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import FechamentoLibrary from '@/components/FechamentoLibrary';
import type { Fechamento } from '@/components/FechamentoLibrary';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ContextChat from '@/components/ContextChat';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';
import { supabase } from '@/integrations/supabase/client';
import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const MindMapView = lazy(() => import('@/components/mindmap/MindMapView'));

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFechamento, setSelectedFechamento] = useState<Fechamento | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleExportPDF = async () => {
    if (!selectedFechamento) return;
    setExporting(true);
    try {
      const contentElement = document.getElementById('fechamento-content');
      if (!contentElement) throw new Error('Content not found');
      await exportToPDF({ tema: selectedFechamento.tema, contentElement });
      toast({ title: 'PDF exportado!', description: 'O resumo foi salvo como PDF.' });
    } catch {
      toast({ title: 'Erro ao exportar', description: 'Não foi possível exportar o PDF.', variant: 'destructive' });
    } finally { setExporting(false); }
  };

  const handleGoToExam = () => {
    if (!selectedFechamento) return;
    navigate(`/exam?mode=${selectedFechamento.tipo === 'caso_clinico' ? 'caso_clinico' : 'prova'}`);
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedFechamento) return;
    setGeneratingFlashcards(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ content: selectedFechamento.resultado, source_id: selectedFechamento.id, source_type: 'resumo' }) }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao gerar flashcards');
      toast({ title: 'Flashcards criados!', description: `${result.count} flashcards gerados a partir deste resumo.` });
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Não foi possível gerar flashcards.', variant: 'destructive' });
    } finally { setGeneratingFlashcards(false); }
  };

  // Detail view
  if (selectedFechamento) {
    const isResumo = selectedFechamento.tipo === 'fechamento';
    return (
      <DashboardLayout mainClassName="pb-0 px-0 min-h-[calc(100vh-4rem)] flex flex-col">
        {/* In-content toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedFechamento(null); setShowMindMap(false); }}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-sm font-semibold text-emerald-900 truncate max-w-[200px] sm:max-w-xs" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {selectedFechamento.tema}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isResumo && (
              <Button variant={showMindMap ? 'default' : 'outline'} size="sm" onClick={() => setShowMindMap(!showMindMap)} className="gap-1.5 text-xs h-8">
                <Network className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mapa Mental</span>
              </Button>
            )}
            {isResumo && (
              <Button variant="outline" size="sm" onClick={handleGenerateFlashcards} disabled={generatingFlashcards} className="gap-1.5 text-xs h-8">
                {generatingFlashcards ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{generatingFlashcards ? 'Gerando...' : 'Flashcards'}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleGoToExam} className="gap-1.5 text-xs h-8">
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fazer Prova</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-1.5 text-xs h-8">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PDF
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-0">
            {showMindMap ? (
              <div className="h-full p-4">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                  <MindMapView content={selectedFechamento.resultado} topic={selectedFechamento.tema} />
                </Suspense>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div id="fechamento-content" className="mx-auto px-6 sm:px-12 py-8 max-w-4xl">
                  <h1 className="text-2xl font-bold text-emerald-900 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {selectedFechamento.tema}
                  </h1>
                  <div className="prose prose-sm max-w-none prose-headings:font-headline prose-headings:text-emerald-900">
                    <MarkdownRenderer content={selectedFechamento.resultado} />
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
          {!showMindMap && <ContextChat context={selectedFechamento.resultado} contextLabel="resumo" />}
        </div>
      </DashboardLayout>
    );
  }

  // Grid view
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Biblioteca <span className="italic" style={{ color: '#126b62' }}>Digital</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Todos os seus resumos, provas e casos clínicos salvos.</p>
        </div>
        <FechamentoLibrary onSelect={setSelectedFechamento} />
      </div>
    </DashboardLayout>
  );
};

export default Library;
