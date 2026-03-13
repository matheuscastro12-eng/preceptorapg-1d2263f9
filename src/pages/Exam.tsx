import { useState, useRef, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useExamGenerator, type ExamConfig, type PracticeMode } from '@/hooks/useExamGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, BookOpen, PanelLeftOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import ExamConfigPanel from '@/components/exam/ExamConfigPanel';
import SimulationView from '@/components/exam/SimulationView';
import ContextChat from '@/components/ContextChat';
import { exportToPDF } from '@/utils/pdfExport';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';

const examTourSteps: TourStep[] = [
  {
    target: '[data-tour="content-selector"]',
    title: 'Selecione o Conteúdo',
    description: 'Escolha um ou mais fechamentos da sua biblioteca. As questões serão baseadas nesse material.',
    placement: 'right',
  },
  {
    target: '[data-tour="exam-config"]',
    title: 'Configure a Prova',
    description: 'Defina a quantidade de questões e o nível de dificuldade (Ciclo Básico ou Residência).',
    placement: 'right',
  },
  {
    target: '[data-tour="generate-exam-btn"]',
    title: 'Gerar Prova',
    description: 'Clique para a IA elaborar as questões no modo simulação.',
    placement: 'right',
  },
];

function hasParseableQuestion(text: string): boolean {
  const blocks = text.split(/(?=##\s*Questão\s+\d+)/i);
  for (const block of blocks) {
    if (!block.match(/##\s*Questão\s+\d+/i)) continue;
    const altRegex = /\*\*([A-E])\)\*\*\s*(.+)/g;
    const alts: string[] = [];
    let m;
    while ((m = altRegex.exec(block)) !== null) {
      if (!alts.includes(m[1])) alts.push(m[1]);
    }
    if (alts.length >= 4) return true;
  }
  return false;
}

const Exam = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as PracticeMode | null;
  const lockedMode = modeFromUrl === 'caso_clinico' || modeFromUrl === 'prova' ? modeFromUrl : null;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<ExamConfig>({
    quantidade: 30,
    nivel: 'residencia',
    simulationMode: true, // Always true now
    practiceMode: lockedMode || 'prova',
  });
  const [exporting, setExporting] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lockedMode && config.practiceMode !== lockedMode) {
      setConfig(prev => ({ ...prev, practiceMode: lockedMode }));
    }
  }, [lockedMode]);

  // Force simulationMode to always be true
  useEffect(() => {
    if (!config.simulationMode) {
      setConfig(prev => ({ ...prev, simulationMode: true }));
    }
  }, [config.simulationMode]);

  const {
    resultado,
    generating,
    hasStartedReceiving,
    isComplete,
    currentConfig,
    generate,
    saveToLibrary,
    reset,
  } = useExamGenerator();

  // Progressive activation: enter simulation as soon as we have at least 1 complete question
  // For prova: wait for parseable question; for caso_clinico: show as soon as content arrives
  useEffect(() => {
    if (showSimulation) return;
    if (!hasStartedReceiving || !resultado) return;

    if (config.practiceMode === 'prova' && hasParseableQuestion(resultado)) {
      setShowSimulation(true);
    } else if (config.practiceMode === 'caso_clinico' && resultado.length > 100) {
      setShowSimulation(true);
    }
  }, [hasStartedReceiving, resultado, config.practiceMode, showSimulation]);

  if (authLoading || subLoading || adminLoading) {
    return <PageSkeleton variant="exam" />;
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
    setExamStarted(true);

    await generate(conteudo, config);
  };

  const handleBackToMenu = () => {
    setExamStarted(false);
    setShowSimulation(false);
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

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <OnboardingTour steps={examTourSteps} tourKey="exam" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {examStarted ? (
              <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
                <PanelLeftOpen className="h-4 w-4" />
                Voltar ao Menu
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient-medical">PreceptorMED</span>
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
        {examStarted ? (
          /* Full-screen simulation with chat sidebar */
          <div className="flex gap-4 lg:h-[calc(100vh-8rem)]">
            <div className="flex-1 min-w-0 relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
              {showSimulation && isProva ? (
                <SimulationView
                  resultado={resultado}
                  onExit={handleBackToMenu}
                  isGenerating={generating}
                  isComplete={isComplete}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                  <div className="h-10 w-10 text-primary animate-spin border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-muted-foreground">Gerando as questões... aguarde um momento.</p>
                </div>
              )}
            </div>

            {/* Chat sidebar for exam */}
            {resultado && (
              <ContextChat
                context={resultado}
                contextLabel="simulado"
                suggestions={[
                  'Por que a alternativa correta está certa?',
                  'Quais são os diagnósticos diferenciais?',
                  'Explique a fisiopatologia envolvida',
                  'Que pegadinhas comuns caem sobre esse tema?',
                ]}
              />
            )}
          </div>
        ) : (
          /* Config panel - single column */
          <div className="max-w-2xl mx-auto lg:h-[calc(100vh-8rem)]">
            <ExamConfigPanel
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              config={config}
              onConfigChange={(c) => setConfig({ ...c, simulationMode: true })}
              generating={generating}
              hasStartedReceiving={hasStartedReceiving}
              isComplete={isComplete}
              onGenerate={handleGenerate}
              lockedMode={lockedMode}
            />
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Exam;
