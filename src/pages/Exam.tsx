import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useExamGenerator, type ExamConfig } from '@/hooks/useExamGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft, Sparkles, BookOpen, ToggleLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import ExamConfigPanel from '@/components/exam/ExamConfigPanel';
import ExamResultPanel from '@/components/exam/ExamResultPanel';
import SimulationView from '@/components/exam/SimulationView';
import { exportToPDF } from '@/utils/pdfExport';

const Exam = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<ExamConfig>({
    quantidade: 30,
    nivel: 'residencia',
    simulationMode: false,
    practiceMode: 'prova',
  });
  const [exporting, setExporting] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    resultado,
    generating,
    hasStartedReceiving,
    isComplete,
    generate,
    reset,
  } = useExamGenerator();

  // Auto-scroll
  useEffect(() => {
    if (resultRef.current && generating) {
      const scrollArea = resultRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [resultado, generating]);

  // Auto-enter simulation mode when generation is complete and mode is active
  useEffect(() => {
    if (isComplete && config.simulationMode && config.practiceMode === 'prova' && resultado) {
      setShowSimulation(true);
    }
  }, [isComplete, config.simulationMode, config.practiceMode, resultado]);

  if (authLoading || subLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Stethoscope className="relative h-12 w-12 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const handleGenerate = async () => {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('tema, resultado')
      .in('id', selectedIds);

    if (error || !data || data.length === 0) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o conteúdo selecionado.',
        variant: 'destructive',
      });
      return;
    }

    const conteudo = data
      .map(f => `## ${f.tema}\n\n${f.resultado}`)
      .join('\n\n---\n\n');

    setShowSimulation(false);
    await generate(conteudo, config);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    toast({ title: 'Copiado!', description: 'Conteúdo copiado para a área de transferência.' });
  };

  const handleExportPDF = async () => {
    if (!resultRef.current || !resultado) return;
    setExporting(true);
    try {
      const title = config.practiceMode === 'caso_clinico'
        ? `Caso Clínico - ${config.nivel === 'basico' ? 'Ciclo Básico' : 'Residência'}`
        : `Prova - ${config.nivel === 'basico' ? 'Ciclo Básico' : 'Residência'} (${config.quantidade}Q)`;
      await exportToPDF({ tema: title, contentElement: resultRef.current });
      toast({ title: 'PDF exportado!', description: 'Conteúdo salvo como PDF.' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Erro ao exportar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const isProva = config.practiceMode === 'prova';
  const resultTitle = isProva ? 'Prova Gerada' : 'Caso Clínico';
  const generatingLabel = isProva ? 'Elaborando questões...' : 'Elaborando caso clínico...';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/library')}
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </Button>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </div>
      </header>

      <main className="flex-1 container relative py-6 px-4">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          <ExamConfigPanel
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            config={config}
            onConfigChange={setConfig}
            generating={generating}
            hasStartedReceiving={hasStartedReceiving}
            isComplete={isComplete}
            onGenerate={handleGenerate}
          />

          {/* Right panel */}
          <div className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
            {showSimulation && isComplete && isProva ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold">Modo Simulação</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowSimulation(false)} className="text-xs">
                    Ver Completa
                  </Button>
                </div>
                <SimulationView resultado={resultado} onExit={() => setShowSimulation(false)} />
              </>
            ) : (
              <ExamResultPanel
                resultado={resultado}
                generating={generating}
                exporting={exporting}
                resultRef={resultRef}
                onCopy={handleCopy}
                onExportPDF={handleExportPDF}
                title={resultTitle}
                generatingLabel={generatingLabel}
              />
            )}

            {/* Toggle simulation button — prova mode only */}
            {isComplete && resultado && !showSimulation && isProva && (
              <div className="pt-3 border-t border-border/20 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSimulation(true)}
                  className="w-full gap-2 border-accent/40 hover:bg-accent/10 hover:text-accent"
                >
                  <ToggleLeft className="h-4 w-4" />
                  Entrar no Modo Simulação
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exam;
