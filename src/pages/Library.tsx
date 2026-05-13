import { useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download, Loader2, Play, Layers, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import FechamentoLibrary from '@/components/FechamentoLibrary';
import type { Fechamento } from '@/components/FechamentoLibrary';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ContextChat from '@/components/ContextChat';
import AnnotationLayer from '@/components/dashboard/AnnotationLayer';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';
import { supabase } from '@/integrations/supabase/client';
import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const MindMapView = lazy(() => import('@/components/mindmap/MindMapView'));

/** Split markdown into sections by ## headings (mesma logica do Dashboard) */
function splitIntoSections(markdown: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const parts = markdown.split(/(?=^## )/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(/^## (.+)/);
    if (headingMatch) {
      sections.push({ title: headingMatch[1].trim(), content: trimmed });
    } else if (trimmed.length > 20) {
      sections.push({ title: '', content: trimmed });
    }
  }
  return sections;
}

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFechamento, setSelectedFechamento] = useState<Fechamento | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
            <span className="text-sm font-semibold text-emerald-900 truncate max-w-[200px] sm:max-w-xs" style={{ fontFamily: 'var(--font-display)' }}>
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
                <div id="fechamento-content" ref={contentRef} className="mx-auto px-4 sm:px-6 py-8 max-w-4xl">
                  {(() => {
                    const isSeminario = selectedFechamento.tipo === 'caso_clinico' || /seminari/i.test(selectedFechamento.resultado);
                    const readingTime = Math.max(1, Math.ceil(selectedFechamento.resultado.split(/\s+/).length / 200));
                    const sections = splitIntoSections(selectedFechamento.resultado);
                    return (
                      <article className="pmed-summary animate-fade-up">
                        <header className="pmed-summary__head">
                          <p className="pmed-eyebrow">
                            {isSeminario ? 'Roteiro de seminário' : 'Resumo da biblioteca'}
                          </p>
                          <h1 className="pmed-editorial-title" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>
                            {selectedFechamento.tema}
                          </h1>
                          <div className="pmed-summary__meta">
                            <span>
                              <span className="material-symbols-outlined">schedule</span>
                              {readingTime} min de leitura
                            </span>
                            <span>
                              <span className="material-symbols-outlined">calendar_today</span>
                              {formatDate(selectedFechamento.created_at)}
                            </span>
                            <span>
                              <span className="material-symbols-outlined">category</span>
                              {isSeminario ? 'Seminário acadêmico' : 'Fechamento de PBL'}
                            </span>
                            <span>
                              <span className="material-symbols-outlined">auto_awesome</span>
                              Gerado por PreceptorMED
                            </span>
                          </div>
                        </header>

                        <div className="pmed-summary__body">
                          {sections.length <= 1 ? (
                            <MarkdownRenderer content={selectedFechamento.resultado} />
                          ) : (
                            sections.map((section, i) => (
                              <MarkdownRenderer key={i} content={section.content} />
                            ))
                          )}
                        </div>

                        <footer className="pmed-summary__foot">
                          <div className="flex gap-2 flex-wrap">
                            <span className="pmed-ref-chip">
                              <span className="material-symbols-outlined">menu_book</span>
                              Harrison
                            </span>
                            <span className="pmed-ref-chip">
                              <span className="material-symbols-outlined">menu_book</span>
                              Guyton
                            </span>
                            <span className="pmed-ref-chip">
                              <span className="material-symbols-outlined">menu_book</span>
                              UpToDate
                            </span>
                          </div>
                          <span style={{ color: 'rgb(var(--brand-primary-dark))', fontWeight: 600 }}>
                            Exporte em PDF acima ↑
                          </span>
                        </footer>
                      </article>
                    );
                  })()}

                  {/* Dica de marca-texto */}
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-brand-gold/10 border border-brand-gold/30 rounded-lg mt-6">
                    <span className="material-symbols-outlined text-brand-gold text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>ink_highlighter</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-brand-ink">Selecione um trecho para grifar ou comentar</p>
                      <p className="text-[11px] text-brand-ink-2 leading-snug">Arraste o mouse sobre qualquer texto pra abrir a paleta de cores. Suas anotações ficam salvas e aparecem sempre que você reabrir este resumo.</p>
                    </div>
                  </div>

                  {/* Annotation layer — marca-texto */}
                  {user && (
                    <AnnotationLayer
                      fechamentoId={selectedFechamento.id}
                      containerRef={contentRef}
                      userId={user.id}
                    />
                  )}
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
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900" style={{ fontFamily: 'var(--font-display)' }}>
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
