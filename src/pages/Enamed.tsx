import { useState, useRef, useMemo, useEffect } from 'react';

import PageSkeleton from '@/components/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useEnamedBank, type EnamedArea, AREA_LABELS } from '@/hooks/useEnamedBank';
import { useEnamedGenerator } from '@/hooks/useEnamedGenerator';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import EnamedBankSimulation from '@/components/enamed/EnamedBankSimulation';
import SimulationView from '@/components/exam/SimulationView';
import ContextChat from '@/components/ContextChat';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';

type EnamedMode = 'menu' | 'completo' | 'revisao' | 'ia_completo' | 'ia_area';
type EnamedSource = 'banco' | 'ia';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

const AREA_OPTIONS: { value: EnamedArea; label: string; icon: string; desc: string; iconBg: string; iconColor: string }[] = [
  { value: 'clinica_medica', label: 'Clínica Médica', icon: 'cardiology', desc: '20 Questões • Médio', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { value: 'cirurgia', label: 'Cirurgia', icon: 'surgical', desc: '20 Questões • Médio', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { value: 'ginecologia_obstetricia', label: 'GO', icon: 'pregnant_woman', desc: '20 Questões • Fácil', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { value: 'pediatria', label: 'Pediatria', icon: 'child_care', desc: '20 Questões • Difícil', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { value: 'saude_coletiva', label: 'Saúde Coletiva', icon: 'groups', desc: '20 Questões • Médio', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
];

const Enamed = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);

  const { questions, loading: bankLoading, fetchQuestions, saveAttempt } = useEnamedBank();
  const { resultado, generating, hasStartedReceiving, isComplete, generate, reset } = useEnamedGenerator();

  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<EnamedMode>(searchParams.get('area') === 'true' ? 'ia_area' : 'menu');
  const [selectedArea, setSelectedArea] = useState<EnamedArea | null>(null);
  const [source, setSource] = useState<EnamedSource>('banco');

  // Sync mode with URL params when navigating between ENAMED and Simulado por Área
  useEffect(() => {
    const isArea = searchParams.get('area') === 'true';
    if (isArea && mode === 'menu') setMode('ia_area');
    if (!isArea && mode === 'ia_area' && !generating) setMode('menu');
  }, [searchParams]);
  const [userStats, setUserStats] = useState({ avg: 0, trend: 0, simCount: 0, topArea: '' });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('enamed_attempts').select('percentage, correct_answers, total_questions, created_at, modo').order('created_at', { ascending: true });
      if (!data || data.length === 0) return;
      const total = data.reduce((s, a) => s + (a.total_questions || 0), 0);
      const correct = data.reduce((s, a) => s + (a.correct_answers || 0), 0);
      const avg = total > 0 ? Math.round((correct / total) * 100) : 0;
      const recent = data.slice(-5);
      const previous = data.slice(-10, -5);
      const recentAvg = recent.length > 0 ? recent.reduce((s, a) => s + (a.percentage || 0), 0) / recent.length : 0;
      const prevAvg = previous.length > 0 ? previous.reduce((s, a) => s + (a.percentage || 0), 0) / previous.length : 0;
      setUserStats({ avg, trend: Math.round(recentAvg - prevAvg), simCount: data.length, topArea: '' });
    })();
  }, [user]);

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

  const startBankMode = async (m: 'completo' | 'revisao', area?: EnamedArea) => {
    setSource('banco');
    setMode(m);
    setSelectedArea(area || null);

    const opts: { area?: EnamedArea; limit?: number; shuffle?: boolean } = {};
    if (m === 'revisao') { opts.shuffle = true; opts.limit = 20; }
    await fetchQuestions(opts);
  };

  const startIaMode = async (m: 'ia_completo' | 'ia_area', area?: EnamedArea) => {
    setSource('ia');
    setMode(m);
    setSelectedArea(area || null);
    reset();
    await generate({
      quantidade: m === 'ia_completo' ? 50 : 20,
      area: area || undefined,
    });
  };

  const handleFinishBank = (score: { correct: number; total: number; percentage: number; answers: Record<string, string> }) => {
    saveAttempt({
      modo: mode === 'completo' ? 'completo' : 'revisao',
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
  };

  const isSimulationMode = source === 'banco' && (mode === 'completo' || mode === 'revisao');
  const isIaMode = mode === 'ia_completo' || mode === 'ia_area';

  return (
    <DashboardLayout mainClassName="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="w-full">

        {/* ═══════════════════════ MENU ═══════════════════════ */}
        {mode === 'menu' && (
          <div className="w-full">
            {/* Hero Header */}
            <section className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-2">
                Prepare-se para o ENAMED
              </h1>
              <p className="text-brand-ink-2 text-sm sm:text-base max-w-2xl leading-relaxed">
                Banco de questões oficiais e simulados gerados por IA no padrão INEP.
              </p>
            </section>

            {/* Stats row */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 sm:mb-10">
              {/* Performance card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-brand-ink-2">Seu desempenho</p>
                  {userStats.simCount > 0 && (
                    <span className={`text-xs font-semibold ${userStats.trend >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>
                      {userStats.trend >= 0 ? '+' : ''}{userStats.trend}% vs anterior
                    </span>
                  )}
                </div>
                {userStats.simCount > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-brand-ink">{userStats.avg}%</span>
                      <span className="text-sm text-brand-ink-2">acerto médio · {userStats.simCount} {userStats.simCount === 1 ? 'simulado' : 'simulados'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary rounded-full" style={{ width: `${userStats.avg}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-brand-ink-2 mt-1">Faça seu primeiro simulado para ver estatísticas.</p>
                )}
              </div>

              {/* AI Insight card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <p className="text-xs font-semibold text-brand-ink-2 mb-2 inline-flex items-center gap-1.5">
                  <MI name="auto_awesome" fill className="text-[14px] text-brand-primary" />
                  Insight
                </p>
                <p className="text-sm text-brand-ink leading-relaxed">
                  {userStats.simCount > 2
                    ? `Sua média está em ${userStats.avg}%. ${userStats.trend > 0 ? 'Continue nesse ritmo.' : 'Foque nas áreas com mais erros nas próximas sessões.'}`
                    : 'Comece seus simulados para receber insights personalizados sobre seu desempenho.'
                  }
                </p>
              </div>
            </section>

            {/* Primary actions — 2 cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 sm:mb-10">
              {/* Banco INEP — primary */}
              <button
                type="button"
                onClick={() => startBankMode('completo')}
                className="text-left rounded-xl bg-brand-primary-dark hover:bg-brand-primary-darker text-white p-6 sm:p-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <span className="inline-block px-2.5 py-0.5 bg-white/15 rounded text-[10px] font-semibold mb-4">Banco oficial</span>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Simulado completo</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Questões oficiais anteriores do ENAMED com comentário editorial, nas 5 grandes áreas.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  Iniciar simulado
                  <MI name="arrow_forward" className="text-[16px]" />
                </span>
              </button>

              {/* Simulado IA 50q */}
              <button
                type="button"
                onClick={() => startIaMode('ia_completo')}
                className="text-left rounded-xl bg-white border border-slate-200 hover:border-brand-primary/40 hover:shadow-sm transition-all p-6 sm:p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <span className="inline-block px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary-dark rounded text-[10px] font-semibold mb-4">Gerado por IA</span>
                <h3 className="text-xl sm:text-2xl font-bold text-brand-ink mb-2">Simulado IA — 50 questões</h3>
                <p className="text-brand-ink-2 text-sm leading-relaxed mb-6">
                  Questões inéditas no padrão INEP, calibradas na distribuição histórica de temas.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                  Gerar agora
                  <MI name="arrow_forward" className="text-[16px]" />
                </span>
              </button>
            </section>

            {/* Secondary actions */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 sm:mb-10">
              <button
                type="button"
                onClick={() => startBankMode('revisao')}
                className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-primary/40 hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <div className="bg-brand-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <MI name="flash_on" fill className="text-[20px] text-brand-primary" />
                </div>
                <h4 className="font-bold text-brand-ink mb-1 group-hover:text-brand-primary transition-colors">Revisão rápida</h4>
                <p className="text-sm text-brand-ink-2">20 questões aleatórias — ~15 min.</p>
              </button>

              <button
                type="button"
                onClick={() => setMode('ia_area')}
                className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-primary/40 hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <div className="bg-brand-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <MI name="category" fill className="text-[20px] text-brand-primary" />
                </div>
                <h4 className="font-bold text-brand-ink mb-1 group-hover:text-brand-primary transition-colors">Estudo por área</h4>
                <p className="text-sm text-brand-ink-2">20 questões geradas por IA em uma especialidade.</p>
              </button>
            </section>

            {/* Área list */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-brand-ink">Por especialidade</h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {AREA_OPTIONS.map(({ value, label, icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => startIaMode('ia_area', value)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <MI name={icon} fill className="text-[18px] text-brand-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-brand-ink group-hover:text-brand-primary transition-colors">{label}</p>
                        <p className="text-xs text-brand-ink-2">{desc}</p>
                      </div>
                    </div>
                    <MI name="chevron_right" className="text-[18px] text-slate-400" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════ AREA SELECTION ═══════════════════════ */}
        {mode === 'ia_area' && !generating && !resultado && (
          <div className="w-full">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-up">
              <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-[#006D5B] transition-colors active:scale-95">
                <ArrowLeft className="h-4 w-4" /> ENAMED
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm font-semibold text-[#191c1d]">Escolha a Área</span>
            </div>

            <div className="mb-6 sm:mb-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="font-['Manrope'] text-xl sm:text-3xl font-extrabold text-[#191c1d] mb-2 tracking-tight">
                Selecione a <span className="text-[#006D5B]">Especialidade</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#3e4945]/70">20 questões inéditas geradas por IA na área escolhida.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {AREA_OPTIONS.map(({ value, label, icon, desc, iconBg, iconColor }, i) => (
                <button
                  key={value}
                  onClick={() => startIaMode('ia_area', value)}
                  className="text-left bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,109,91,0.1)] hover:border-[#006D5B]/20 transition-all duration-300 cursor-pointer group animate-fade-up"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}>
                    <MI name={icon} fill className={`text-[28px] ${iconColor}`} />
                  </div>
                  <h3 className="font-['Manrope'] font-bold text-lg text-[#191c1d] group-hover:text-[#006D5B] transition-colors mb-1">
                    {label}
                  </h3>
                  <p className="text-xs text-[#6e7975] uppercase tracking-wider font-medium mb-5">{desc}</p>
                  <div className="flex items-center text-[#006D5B] text-sm font-semibold">
                    Iniciar
                    <MI name="arrow_forward" className="text-[18px] ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════ BANK SIMULATION ═══════════════════════ */}
        {isSimulationMode && (
          <>
            <div className="flex items-center gap-3 mb-4 animate-fade-up">
              <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-[#006D5B] transition-colors active:scale-95">
                <ArrowLeft className="h-4 w-4" /> ENAMED
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm font-semibold text-[#191c1d]">
                {mode === 'completo' ? 'Simulado Completo' : 'Revisão Rápida'}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 min-h-[50vh] lg:h-[calc(100vh-10rem)]">
              <div className="flex-1 min-w-0 rounded-xl bg-white border border-slate-200/60 p-4 sm:p-8 flex flex-col overflow-hidden">
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
          </>
        )}

        {/* ═══════════════════════ IA GENERATION MODE ═══════════════════════ */}
        {isIaMode && (generating || resultado || isComplete) && (
          <>
            <div className="flex items-center gap-3 mb-4 animate-fade-up">
              <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-[#006D5B] transition-colors active:scale-95">
                <ArrowLeft className="h-4 w-4" /> ENAMED
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm font-semibold text-[#191c1d]">
                ENAMED IA {selectedArea ? `— ${AREA_LABELS[selectedArea]}` : '— Simulado'}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 min-h-[50vh] lg:h-[calc(100vh-10rem)]">
              <div className="flex-1 min-w-0 rounded-xl bg-white border border-slate-200/60 p-4 sm:p-8 flex flex-col overflow-hidden">
                <SimulationView
                  resultado={resultado}
                  onExit={handleBackToMenu}
                  isGenerating={generating}
                  isComplete={isComplete}
                />
              </div>

              {resultado && (
                <ContextChat
                  context={resultado}
                  contextLabel="simulado ENAMED IA"
                  suggestions={enamedChatSuggestions}
                />
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Enamed;
