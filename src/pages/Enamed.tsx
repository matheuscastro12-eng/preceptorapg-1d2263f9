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
  // Filtro do banco: ENAMED INEP, Revalida ou ambos. A banca eh a mesma
  // (INEP/MEC) — Revalida usa o mesmo padrao tecnico.
  const [bankSource, setBankSource] = useState<'all' | 'enamed' | 'revalida'>('all');

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

    const opts: { area?: EnamedArea; limit?: number; shuffle?: boolean; source?: 'all' | 'enamed' | 'revalida' } = {
      source: bankSource,
    };
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
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
              {/* Top accent — verde + ouro */}
              <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />

              <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-9">
                {/* Header editorial */}
                <header>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
                    <span className="w-6 h-px bg-[#C9A84C]" />
                    Central ENAMED
                  </p>
                  <h1 className="font-['Manrope'] font-bold text-[28px] sm:text-[34px] tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
                    Prepare-se para o<br />
                    Exame{' '}
                    <em className="not-italic font-medium text-[#8a6f26]">
                      Nacional de Médicos
                    </em>
                    .
                  </h1>
                  <p className="text-sm text-[#4a5568] mt-3 max-w-[52ch] leading-relaxed">
                    Banco oficial INEP, simulado completo cronometrado e questões inéditas
                    geradas por PreceptorMED — tudo num só lugar.
                  </p>
                </header>

                {/* ── Desempenho ── */}
                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                      ① Seu desempenho
                    </label>
                    {userStats.simCount > 0 && (
                      <span className={`text-[10.5px] font-bold inline-flex items-center gap-1.5 ${userStats.trend >= 0 ? 'text-[#005344]' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${userStats.trend >= 0 ? 'bg-[#005344]' : 'bg-red-500'}`} />
                        {userStats.trend >= 0 ? '+' : ''}{userStats.trend}% vs anterior
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50/60 border-2 border-slate-200 rounded-xl px-5 py-5">
                    {userStats.simCount > 0 ? (
                      <>
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="font-['Manrope'] text-[40px] font-black text-[#005344] tabular-nums leading-none">
                              {userStats.avg}<span className="text-[20px] text-[#94a3b8]">%</span>
                            </p>
                            <p className="text-[11px] text-[#94a3b8] mt-1">acerto médio · {userStats.simCount} simulado{userStats.simCount === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#005344] to-[#C9A84C] rounded-full transition-all duration-700" style={{ width: `${userStats.avg}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-[#4a5568]">Faça seu primeiro simulado para ver estatísticas aqui.</p>
                    )}
                  </div>
                </section>

                {/* ── Banco oficial INEP ── */}
                <section>
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
                      ② Banco oficial INEP
                      <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
                        questões reais com gabarito comentado
                      </span>
                    </label>

                    {/* Toggle ENAMED / Revalida / Ambos */}
                    <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                      {([
                        { v: 'all',      label: 'Ambos' },
                        { v: 'enamed',   label: 'ENAMED' },
                        { v: 'revalida', label: 'Revalida' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => setBankSource(opt.v)}
                          className={`px-3 h-7 rounded-md text-[11px] font-bold transition-all ${
                            bankSource === opt.v
                              ? 'bg-white text-[#005344] shadow-[0_1px_3px_rgba(0,83,68,0.15)]'
                              : 'text-[#4a5568] hover:text-[#191C1D]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nota explicativa */}
                  <div className="mb-3 px-3 py-2 rounded-lg bg-[#C9A84C]/08 border border-[#C9A84C]/25 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#8a6f26] text-[16px] mt-0.5">info</span>
                    <p className="text-[11.5px] leading-snug text-[#4a5568]">
                      <strong className="text-[#191C1D]">ENAMED e Revalida</strong> são organizados pela <strong>mesma banca (INEP/MEC)</strong> com o mesmo padrão técnico. As duas provas testam o mesmo conjunto de competências clínicas — por isso usar as questões em conjunto amplia muito sua base de estudo sem perder qualidade.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => startBankMode('completo')}
                      className="text-left p-5 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005344] hover:bg-[#005344]/[0.02] transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-[#005344] text-white flex items-center justify-center shrink-0">
                          <MI name="inventory" fill className="text-[18px]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-['Manrope'] font-bold text-[14px] text-[#191C1D]">Simulado completo</h4>
                          <p className="text-[11px] text-[#94a3b8] mt-0.5">5 grandes áreas · padrão prova</p>
                        </div>
                      </div>
                      <p className="text-[12px] leading-relaxed text-[#4a5568] mb-3">
                        Prova estruturada cronometrada, igual à experiência real do ENAMED.
                      </p>
                      <span className="text-[11px] font-bold text-[#005344] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Iniciar agora <MI name="arrow_forward" className="text-[14px]" />
                      </span>
                    </button>

                    <button
                      onClick={() => startBankMode('revisao')}
                      className="text-left p-5 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005344] hover:bg-[#005344]/[0.02] transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-[#C9A84C] text-white flex items-center justify-center shrink-0">
                          <MI name="flash_on" fill className="text-[18px]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-['Manrope'] font-bold text-[14px] text-[#191C1D]">Revisão rápida</h4>
                          <p className="text-[11px] text-[#94a3b8] mt-0.5">20 questões · ~15 min</p>
                        </div>
                      </div>
                      <p className="text-[12px] leading-relaxed text-[#4a5568] mb-3">
                        Bateria curta de alta intensidade. Ideal para manter o ritmo entre plantões.
                      </p>
                      <span className="text-[11px] font-bold text-[#8a6f26] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Praticar <MI name="arrow_forward" className="text-[14px]" />
                      </span>
                    </button>
                  </div>
                </section>

                {/* ── Questões inéditas PreceptorMED ── */}
                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
                      ③ Questões inéditas PreceptorMED
                      <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
                        geradas por Gemini 2.5
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={() => startIaMode('ia_completo')}
                    className="w-full text-left p-5 rounded-xl border-2 border-[#005344] bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white relative overflow-hidden group hover:shadow-[0_8px_24px_-8px_rgba(0,109,91,0.45)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-11 h-11 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <MI name="auto_awesome" fill className="text-[22px] text-[#C9A84C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-['Manrope'] font-bold text-[15px]">Simulado PreceptorMED · 50 questões</h4>
                        <p className="text-[12px] text-white/70 mt-0.5">
                          Inéditas, padrão ENAMED/Revalida — diversidade real de cenários.
                        </p>
                      </div>
                      <MI name="arrow_forward" className="text-[20px] opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </section>

                {/* ── Por área ── */}
                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
                      ④ Estudo por área
                      <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
                        20 questões PreceptorMED na especialidade
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AREA_OPTIONS.map(({ value, label, icon, iconBg, iconColor }) => (
                      <button
                        key={value}
                        onClick={() => startIaMode('ia_area', value)}
                        className="text-left p-3.5 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005344] hover:bg-[#005344]/[0.02] transition-all flex items-center gap-3 group"
                      >
                        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                          <MI name={icon} fill className={`text-[18px] ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-['Manrope'] font-bold text-[13px] text-[#191C1D] truncate">{label}</p>
                          <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">20 q · PreceptorMED</p>
                        </div>
                        <MI name="chevron_right" className="text-[18px] text-[#94a3b8] group-hover:text-[#005344] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ AREA SELECTION ═══════════════════════ */}
        {mode === 'ia_area' && !generating && !resultado && (
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />

              <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-9">
                <div className="flex items-center gap-3 -mb-4">
                  <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] transition-colors active:scale-95">
                    <ArrowLeft className="h-3.5 w-3.5" /> ENAMED
                  </button>
                </div>

                <header>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
                    <span className="w-6 h-px bg-[#C9A84C]" />
                    Simulado por área
                  </p>
                  <h1 className="font-['Manrope'] font-bold text-[28px] sm:text-[34px] tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
                    Foque numa{' '}
                    <em className="not-italic font-medium text-[#8a6f26]">
                      especialidade
                    </em>
                    <br />de cada vez.
                  </h1>
                  <p className="text-sm text-[#4a5568] mt-3 max-w-[52ch] leading-relaxed">
                    20 questões inéditas geradas por PreceptorMED, calibradas para o padrão ENAMED da
                    área escolhida.
                  </p>
                </header>

                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                      ① Especialidade
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AREA_OPTIONS.map(({ value, label, icon, desc, iconBg, iconColor }) => (
                      <button
                        key={value}
                        onClick={() => startIaMode('ia_area', value)}
                        className="text-left p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005344] hover:bg-[#005344]/[0.02] transition-all flex items-center gap-3 group"
                      >
                        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                          <MI name={icon} fill className={`text-[20px] ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-['Manrope'] font-bold text-[14px] text-[#191C1D]">{label}</p>
                          <p className="text-[10.5px] text-[#94a3b8] uppercase tracking-wider mt-0.5">{desc}</p>
                        </div>
                        <MI name="arrow_forward" className="text-[18px] text-[#94a3b8] group-hover:text-[#005344] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
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

        {/* ═══════════════════════ PreceptorMED GENERATION MODE ═══════════════════════ */}
        {isIaMode && (generating || resultado || isComplete) && (
          <>
            <div className="flex items-center gap-3 mb-4 animate-fade-up">
              <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-[#006D5B] transition-colors active:scale-95">
                <ArrowLeft className="h-4 w-4" /> ENAMED
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm font-semibold text-[#191c1d]">
                ENAMED PreceptorMED {selectedArea ? `— ${AREA_LABELS[selectedArea]}` : '— Simulado'}
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
                  contextLabel="simulado ENAMED PreceptorMED"
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
