import { useState, useRef, useMemo } from 'react';

import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useEnamedBank, type EnamedArea, AREA_LABELS } from '@/hooks/useEnamedBank';
import { useEnamedGenerator } from '@/hooks/useEnamedGenerator';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, GraduationCap, ClipboardList, Zap, Target, Shuffle, LayoutList, Brain, Stethoscope, Baby, Scissors, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import EnamedBankSimulation from '@/components/enamed/EnamedBankSimulation';
import ExamResultPanel from '@/components/exam/ExamResultPanel';
import SimulationView from '@/components/exam/SimulationView';
import GenerationProgress from '@/components/GenerationProgress';
import ContextChat from '@/components/ContextChat';

type EnamedMode = 'menu' | 'completo' | 'area' | 'revisao' | 'ia_completo' | 'ia_area';
type EnamedSource = 'banco' | 'ia';

const AREA_OPTIONS: { value: EnamedArea; label: string; icon: React.ReactNode }[] = [
  { value: 'clinica_medica', label: 'Clínica Médica', icon: <HeartPulse className="h-5 w-5" /> },
  { value: 'cirurgia', label: 'Cirurgia', icon: <Scissors className="h-5 w-5" /> },
  { value: 'ginecologia_obstetricia', label: 'GO', icon: <Stethoscope className="h-5 w-5" /> },
  { value: 'pediatria', label: 'Pediatria', icon: <Baby className="h-5 w-5" /> },
  { value: 'saude_coletiva', label: 'Saúde Coletiva', icon: <Target className="h-5 w-5" /> },
];

const Enamed = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const resultRef = useRef<HTMLDivElement>(null);

  const { questions, loading: bankLoading, fetchQuestions, saveAttempt } = useEnamedBank();
  const { resultado, generating, hasStartedReceiving, isComplete, generate, reset } = useEnamedGenerator();

  const [mode, setMode] = useState<EnamedMode>('menu');
  const [selectedArea, setSelectedArea] = useState<EnamedArea | null>(null);
  const [source, setSource] = useState<EnamedSource>('banco');
  const [showIaSimulation, setShowIaSimulation] = useState(false);

  const bankQuestionsContext = useMemo(() => {
    if (!questions || questions.length === 0) return '';
    return questions.map((q, i) => {
      return `## Questão ${i + 1} (${AREA_LABELS[q.area] || q.area} — ENAMED ${q.ano})\n\n${q.enunciado}\n\n**A)** ${q.alternativa_a}\n**B)** ${q.alternativa_b}\n**C)** ${q.alternativa_c}\n**D)** ${q.alternativa_d}\n\n**Gabarito:** ${q.gabarito}${q.explicacao ? `\n**Explicação:** ${q.explicacao}` : ''}`;
    }).join('\n\n---\n\n');
  }, [questions]);

  const enamedChatSuggestions = useMemo(() => [
    'Por que a alternativa correta está certa?',
    'Quais são os diagnósticos diferenciais?',
    'Explique a fisiopatologia envolvida',
    'Que pegadinhas comuns caem sobre esse tema?',
  ], []);

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="exam" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const startBankMode = async (m: 'completo' | 'area' | 'revisao', area?: EnamedArea) => {
    setSource('banco');
    setMode(m);
    setSelectedArea(area || null);

    const opts: { area?: EnamedArea; limit?: number; shuffle?: boolean } = {};
    if (m === 'area' && area) opts.area = area;
    if (m === 'revisao') { opts.shuffle = true; opts.limit = 20; }
    await fetchQuestions(opts);
  };

  const startIaMode = async (m: 'ia_completo' | 'ia_area', area?: EnamedArea) => {
    setSource('ia');
    setMode(m);
    setSelectedArea(area || null);
    setShowIaSimulation(false);
    reset();
    await generate({
      quantidade: m === 'ia_completo' ? 50 : 20,
      area: area || undefined,
    });
  };

  const handleFinishBank = (score: { correct: number; total: number; percentage: number; answers: Record<string, string> }) => {
    saveAttempt({
      modo: mode === 'completo' ? 'completo' : mode === 'area' ? 'area' : 'revisao',
      area_filter: selectedArea || undefined,
      total_questions: score.total,
      correct_answers: score.correct,
      percentage: score.percentage,
      answers: score.answers,
      source: 'banco',
    });
    toast({ title: 'Resultado salvo!', description: `${score.percentage}% de acerto — ${score.correct}/${score.total}` });
  };

  const handleBackToMenu = () => {
    setMode('menu');
    setSelectedArea(null);
    reset();
    setShowIaSimulation(false);
  };

  // Check if IA result has parseable questions for simulation mode
  const hasIaQuestions = resultado && resultado.includes('## Questão');

  // Menu view
  if (mode === 'menu') {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Voltar
              </Button>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">ENAMED</span>
              </div>
            </div>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </header>

        <main className="flex-1 container relative py-6 sm:py-10 px-4">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Preparatório ENAMED</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Estudo <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">ENAMED</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Questões no padrão INEP — vinhetas clínicas, 4 alternativas, raciocínio diagnóstico e conduta
            </p>
          </div>

          {/* Banco de Questões Section */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600">Banco de Questões ENAMED</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Simulado Completo */}
              <button
                onClick={() => startBankMode('completo')}
                className="group relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-5 text-left transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_hsl(45_100%_50%/0.15)]"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LayoutList className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Simulado Completo</h3>
                <p className="text-xs text-muted-foreground">Todas as questões do banco, todas as áreas</p>
                <div className="flex items-center gap-1 mt-3 text-amber-600 text-xs font-medium">
                  Iniciar <Sparkles className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Por Área */}
              <button
                onClick={() => setMode('area')}
                className="group relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Por Área</h3>
                <p className="text-xs text-muted-foreground">Foque em uma especialidade específica</p>
                <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium">
                  Escolher <Sparkles className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Revisão Rápida */}
              <button
                onClick={() => startBankMode('revisao')}
                className="group relative rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-5 text-left transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)]"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shuffle className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Revisão Rápida</h3>
                <p className="text-xs text-muted-foreground">20 questões aleatórias para treino rápido</p>
                <div className="flex items-center gap-1 mt-3 text-accent text-xs font-medium">
                  Iniciar <Sparkles className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>

            {/* IA Section */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Questões Geradas por IA</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">NOVO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => startIaMode('ia_completo')}
                  className="group relative rounded-2xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10 p-5 text-left transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Simulado IA (50q)</h3>
                      <p className="text-xs text-muted-foreground">Todas as áreas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    Gerar <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </button>

                {AREA_OPTIONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => startIaMode('ia_area', value)}
                    className="group relative rounded-2xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10 p-5 text-left transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform text-accent">
                        {icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{label}</h3>
                        <p className="text-xs text-muted-foreground">20 questões IA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent text-xs font-medium">
                      Gerar <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }


  // Area selection view (for both banco and ia)
  if (mode === 'area') {
    const isIa = mode === 'ia_area';
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Voltar
              </Button>
              <div className="h-6 w-px bg-border/50" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">ENAMED</span>
            </div>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </header>

        <main className="flex-1 container relative py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Escolha a Área</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isIa ? 'A IA gerará 20 questões ENAMED na área escolhida' : 'Questões do banco filtradas por área'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {AREA_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => isIa ? startIaMode('ia_area', value) : startBankMode('area', value)}
                className="group rounded-2xl border border-border/40 bg-gradient-to-br from-muted/30 to-transparent p-6 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-primary">
                  {icon}
                </div>
                <h3 className="text-base font-bold">{label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{isIa ? '20 questões IA' : 'Questões do banco'}</p>
              </button>
            ))}
          </div>
        </main>
      </PageTransition>
    );
  }

  // Bank simulation modes

  if (source === 'banco' && (mode === 'completo' || mode === 'revisao' || (mode as string).startsWith('area'))) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Voltar
              </Button>
              <div className="h-6 w-px bg-border/50" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                ENAMED {mode === 'completo' ? '— Simulado' : mode === 'revisao' ? '— Revisão' : `— ${AREA_LABELS[selectedArea || ''] || ''}`}
              </span>
            </div>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </header>

        <main className="flex-1 container relative py-6 px-4">
          <div className="flex gap-4 lg:h-[calc(100vh-8rem)]">
            <div className="flex-1 min-w-0 rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
              <EnamedBankSimulation
                questions={questions}
                onFinish={handleFinishBank}
                onExit={handleBackToMenu}
                loading={bankLoading}
              />
            </div>

            {bankQuestionsContext && (
              <ContextChat
                context={bankQuestionsContext}
                contextLabel="simulado ENAMED"
                suggestions={enamedChatSuggestions}
              />
            )}
          </div>
        </main>
      </PageTransition>
    );
  }

  // IA generation modes
  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Voltar
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              ENAMED IA {selectedArea ? `— ${AREA_LABELS[selectedArea]}` : '— Simulado'}
            </span>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container relative py-6 px-4">
        <div className="flex gap-4 lg:h-[calc(100vh-8rem)]">
          <div className="flex-1 min-w-0 rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
            {showIaSimulation && hasIaQuestions ? (
              <SimulationView
                resultado={resultado}
                onExit={() => setShowIaSimulation(false)}
                isGenerating={generating}
                isComplete={isComplete}
              />
            ) : (
              <>
                <ExamResultPanel
                  resultado={resultado}
                  generating={generating}
                  exporting={false}
                  resultRef={resultRef}
                  onCopy={() => {
                    navigator.clipboard.writeText(resultado);
                    toast({ title: 'Copiado!' });
                  }}
                  onExportPDF={async () => {}}
                  title="Questões ENAMED (IA)"
                  generatingLabel="Gerando questões ENAMED..."
                />

                {isComplete && hasIaQuestions && (
                  <div className="pt-3 border-t border-border/20 mt-3 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIaSimulation(true)}
                      className="w-full gap-2 border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Entrar no Modo Simulação
                    </Button>
                  </div>
                )}

                <GenerationProgress
                  isGenerating={generating}
                  hasStartedReceiving={hasStartedReceiving}
                  isComplete={isComplete}
                />
              </>
            )}
          </div>

          {resultado && (
            <ContextChat
              context={resultado}
              contextLabel="simulado ENAMED IA"
              suggestions={enamedChatSuggestions}
            />
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default Enamed;
