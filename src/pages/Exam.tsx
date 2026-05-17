import { useState, useRef, useEffect } from 'react';
import PageSkeleton from '@/components/PageSkeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useExamGenerator, type ExamConfig, type PracticeMode, type ExamPdf } from '@/hooks/useExamGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import GenerationProgress from '@/components/GenerationProgress';
import ExamConfigPanel from '@/components/exam/ExamConfigPanel';
import CustomExamInput from '@/components/exam/CustomExamInput';
import { BookOpen, PenLine } from 'lucide-react';
import SimulationView from '@/components/exam/SimulationView';
import ContextChat from '@/components/ContextChat';
import { exportToPDF } from '@/utils/pdfExport';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
    description: 'Defina a quantidade de questões e o nível de dificuldade.',
    placement: 'right',
  },
  {
    target: '[data-tour="generate-exam-btn"]',
    title: 'Gerar Prova',
    description: 'Clique para o PreceptorMED elaborar as questões no modo simulação.',
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
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as PracticeMode | null;
  const lockedMode = modeFromUrl === 'caso_clinico' || modeFromUrl === 'prova' ? modeFromUrl : null;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'biblioteca' | 'topicos'>('biblioteca');
  const [materias, setMaterias] = useState('');
  const [examPdfs, setExamPdfs] = useState<ExamPdf[]>([]);
  const [config, setConfig] = useState<ExamConfig>({
    quantidade: 20,
    nivel: 'residencia',
    simulationMode: true,
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

    // Smart content extraction — keep headings + key paragraphs from each topic
    // This preserves quality while fitting within API limits
    const MAX_TOTAL = 180000;
    const maxPerItem = Math.floor(MAX_TOTAL / data.length);

    const conteudo = data
      .map(f => {
        let resultado = f.resultado;
        if (resultado.length > maxPerItem) {
          // Extract structure: keep all headings (##, ###) + first paragraph after each
          const lines = resultado.split('\n');
          const extracted: string[] = [];
          let charCount = 0;
          let keepNext = true; // keep first paragraph always

          for (const line of lines) {
            const isHeading = /^#{1,4}\s/.test(line);
            const isBullet = /^\s*[-*•]\s/.test(line);
            const isEmpty = line.trim() === '';

            if (isHeading) {
              extracted.push(line);
              charCount += line.length;
              keepNext = true; // keep content after headings
            } else if (keepNext && !isEmpty) {
              extracted.push(line);
              charCount += line.length;
              if (!isBullet) keepNext = false; // keep bullet lists entirely
            } else if (isEmpty) {
              extracted.push('');
            }

            if (charCount > maxPerItem) break;
          }
          resultado = extracted.join('\n');
        }
        return `## ${f.tema}\n\n${resultado}`;
      })
      .join('\n\n---\n\n');

    setShowSimulation(false);
    setExamStarted(true);

    await generate(conteudo, config);
  };

  const handleGenerateCustom = async () => {
    const materiasList = materias.split('\n').map(s => s.trim()).filter(Boolean);
    if (materiasList.length === 0 && examPdfs.length === 0) {
      toast({
        title: 'Adicione conteúdo',
        description: 'Digite ao menos uma matéria ou anexe um PDF.',
        variant: 'destructive',
      });
      return;
    }
    setShowSimulation(false);
    setExamStarted(true);
    await generate('', config, { materias: materiasList, pdfs: examPdfs });
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
        ? `Caso Clínico - ${config.nivel === 'basico' ? 'Residente' : 'Especialista'}`
        : `Prova - ${config.nivel === 'basico' ? 'Residente' : 'Especialista'} (${config.quantidade}Q)`;
      await exportToPDF({ tema: title, contentElement: resultRef.current });
      toast({ title: 'PDF exportado!', description: 'Conteúdo salvo como PDF.' });
    } catch (error) {
      toast({ title: 'Erro ao exportar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const isProva = config.practiceMode === 'prova';
  return (
    <DashboardLayout mainClassName="pb-4 px-4 sm:px-6">
      <OnboardingTour steps={examTourSteps} tourKey="exam" />

      <div className="max-w-5xl mx-auto">
        {examStarted ? (
          <div className="flex flex-col gap-4">
            {/* Back button + Save */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToMenu}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#006D5B] transition-colors active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" /> Nova Configuração
                </button>
                <span className="text-xs text-slate-400">{isProva ? 'Simulado' : 'Caso Clínico'}</span>
              </div>
              {hasStartedReceiving && resultado && (
                <button
                  onClick={async () => {
                    const tema = window.prompt(
                      `Nome para salvar ${isProva ? 'este simulado' : 'este caso clínico'}:`,
                      `${isProva ? 'Simulado' : 'Caso clínico'} ${new Date().toLocaleDateString('pt-BR')}`
                    );
                    if (tema?.trim()) {
                      await saveToLibrary(tema.trim());
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary-dark bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/20 rounded-lg transition-colors"
                  title="Salvar na biblioteca"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bookmark_add</span>
                  Salvar na biblioteca
                </button>
              )}
            </div>

            {/* Exam content area */}
            <div className="flex flex-col lg:flex-row gap-4 min-h-[50vh] lg:min-h-[calc(100vh-10rem)]">
              <div className="flex-1 min-w-0 rounded-xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(25,28,29,0.06)] p-4 sm:p-6 flex flex-col overflow-hidden">
                {showSimulation && isProva ? (
                  <SimulationView
                    resultado={resultado}
                    onExit={handleBackToMenu}
                    isGenerating={generating}
                    isComplete={isComplete}
                  />
                ) : showSimulation && !isProva ? (
                  <div className="flex-1 overflow-y-auto">
                    <div ref={resultRef} className="prose prose-sm max-w-none prose-headings:text-[#191c1d]">
                      <MarkdownRenderer content={resultado} isTyping={generating} />
                    </div>
                    {generating && (
                      <div className="flex items-center gap-2 mt-4 text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Elaborando caso clínico...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-6 max-w-md mx-auto">
                    <GenerationProgress
                      isGenerating={generating}
                      hasStartedReceiving={hasStartedReceiving}
                      isComplete={isComplete}
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">
                        {isProva ? 'Elaborando questões...' : 'Elaborando caso clínico...'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {hasStartedReceiving
                          ? 'Recebendo conteúdo — as questões aparecerão automaticamente.'
                          : 'Conectando com o PreceptorMED, aguarde um momento.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
          </div>
        ) : (
          /* ── Config Page ── */
          <div className="py-4 sm:py-8 space-y-5">
            {/* Toggle entre fonte do conteudo */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl max-w-md mx-auto">
              <button
                onClick={() => setInputMode('biblioteca')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'biblioteca'
                    ? 'bg-white text-[#005344] shadow-[0_2px_6px_-2px_rgba(0,83,68,0.25)]'
                    : 'text-[#4a5568] hover:text-[#191c1d]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Da biblioteca
              </button>
              <button
                onClick={() => setInputMode('topicos')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-bold inline-flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'topicos'
                    ? 'bg-white text-[#005344] shadow-[0_2px_6px_-2px_rgba(0,83,68,0.25)]'
                    : 'text-[#4a5568] hover:text-[#191c1d]'
                }`}
              >
                <PenLine className="w-4 h-4" />
                Tópicos livres
              </button>
            </div>

            {inputMode === 'biblioteca' ? (
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
            ) : (
              <CustomExamInput
                materias={materias}
                setMaterias={setMaterias}
                pdfs={examPdfs}
                setPdfs={setExamPdfs}
                config={config}
                setConfig={setConfig}
                generating={generating}
                hasStartedReceiving={hasStartedReceiving}
                isComplete={isComplete}
                onGenerate={handleGenerateCustom}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Exam;
