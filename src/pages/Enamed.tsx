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
            <section className="mb-8 sm:mb-12 animate-fade-up">
              <h1 className="font-['Manrope'] text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#191c1d] mb-2">
                Prepare-se para o ENAMED
              </h1>
              <p className="text-[#3e4945]/70 text-sm sm:text-base max-w-2xl leading-relaxed">
                Bem-vindo à sua central de excelência clínica. Aqui, a precisão editorial encontra a tecnologia para potencializar sua aprovação no Exame Nacional de Médicos.
              </p>
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">

              {/* ─── Banco de Questões INEP (Hero Card) ─── */}
              <button
                onClick={() => startBankMode('completo')}
                className="col-span-1 lg:col-span-8 text-left group animate-fade-up"
                style={{ animationDelay: '0.05s' }}
              >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#005344] to-[#006d5b] p-6 sm:p-10 text-white h-full flex flex-col justify-between min-h-[220px] sm:min-h-[260px] shadow-[0_12px_40px_rgba(0,83,68,0.15)] group-hover:shadow-[0_16px_48px_rgba(0,83,68,0.25)] transition-all duration-300 group-active:scale-[0.99]">
                  <div className="absolute top-0 right-0 opacity-[0.06] scale-150 rotate-12 pointer-events-none">
                    <MI name="history_edu" className="text-[180px] sm:text-[200px]" />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-3 sm:mb-4">Acesso Oficial</span>
                    <h2 className="font-['Manrope'] text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">Banco de Questões INEP</h2>
                    <p className="text-white/70 text-sm sm:text-base max-w-md leading-relaxed">Explore todas as questões das provas oficiais anteriores com comentários editoriais de especialistas.</p>
                  </div>
                  <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="bg-white text-[#005344] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-['Manrope'] font-bold text-xs sm:text-sm uppercase tracking-tight group-hover:bg-[#9df3dc] transition-colors">
                      Acessar Banco Completo
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium opacity-70">Mais de 15.000 questões disponíveis</span>
                  </div>
                </div>
              </button>

              {/* ─── Stats + AI Insight Sidebar ─── */}
              <div className="col-span-1 lg:col-span-4 flex flex-row lg:flex-col gap-4 sm:gap-6 lg:gap-8">
                {/* Performance card */}
                <div className="flex-1 bg-white rounded-xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-[#bec9c4]/10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 bg-[#c8eade] rounded-lg">
                      <MI name="trending_up" fill className="text-[20px] text-[#005344]" />
                    </div>
                    {userStats.simCount > 0 && (
                      <span className={`text-[10px] sm:text-xs font-bold ${userStats.trend >= 0 ? 'text-[#006D5B]' : 'text-red-500'}`}>
                        {userStats.trend >= 0 ? '+' : ''}{userStats.trend}% vs anterior
                      </span>
                    )}
                  </div>
                  <p className="text-[#6e7975] text-[10px] sm:text-xs uppercase font-bold tracking-widest mb-1">Seu Desempenho</p>
                  {userStats.simCount > 0 ? (
                    <>
                      <h3 className="font-['Manrope'] text-xl sm:text-2xl font-extrabold text-[#191c1d]">
                        {userStats.avg}% <span className="text-xs sm:text-sm font-medium text-[#6e7975]">acerto médio</span>
                      </h3>
                      <div className="mt-3 sm:mt-4 h-2 w-full bg-[#e7e8e9] rounded-full overflow-hidden">
                        <div className="h-full bg-[#006D5B] rounded-full transition-all duration-700" style={{ width: `${userStats.avg}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#6e7975] mt-1">Faça simulados para ver suas estatísticas</p>
                  )}
                </div>

                {/* AI Insight card */}
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-[#006D5B]/15 relative overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
                  <div className="absolute -right-4 -bottom-4 text-[#006D5B]/5 pointer-events-none">
                    <MI name="psychology" className="text-[80px]" />
                  </div>
                  <h4 className="text-[#006D5B] font-['Manrope'] font-bold text-xs sm:text-sm mb-2 flex items-center relative z-10">
                    <MI name="auto_awesome" fill className="text-[14px] sm:text-[16px] mr-1.5" />
                    Insight da IA
                  </h4>
                  <p className="text-[#3e4945] text-xs sm:text-sm italic leading-relaxed relative z-10">
                    {userStats.simCount > 2
                      ? `"Sua média está em ${userStats.avg}%. ${userStats.trend > 0 ? 'Continue nesse ritmo!' : 'Recomendamos focar nas áreas com mais erros nas próximas sessões.'}`
                      : `"Comece seus simulados para receber insights personalizados sobre seu desempenho."`
                    }
                  </p>
                </div>
              </div>

              {/* ─── Simulado Completo ─── */}
              <button
                onClick={() => startBankMode('completo')}
                className="col-span-1 md:col-span-1 lg:col-span-6 text-left group animate-fade-up"
                style={{ animationDelay: '0.12s' }}
              >
                <div className="bg-white rounded-xl p-5 sm:p-8 shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-[#bec9c4]/10 group-hover:bg-[#006D5B]/[0.03] transition-all duration-300 h-full">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-[#006D5B]/10 rounded-2xl">
                      <MI name="inventory" fill className="text-[24px] sm:text-[28px] text-[#006D5B]" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#006D5B] uppercase bg-[#9df3dc]/30 px-2 py-1 rounded">5 Grandes Áreas</span>
                  </div>
                  <h3 className="font-['Manrope'] text-lg sm:text-2xl font-extrabold mb-1.5 sm:mb-2 group-hover:text-[#006D5B] transition-colors">Simulado Completo</h3>
                  <p className="text-[#3e4945]/70 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">Prova estruturada com tempo controlado, simulando a experiência real do ENAMED em todas as especialidades.</p>
                  <div className="flex items-center justify-end">
                    <span className="flex items-center text-[#006D5B] font-bold text-xs sm:text-sm">
                      Iniciar Agora
                      <MI name="arrow_forward" className="text-[18px] ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>

              {/* ─── Revisão Rápida ─── */}
              <button
                onClick={() => startBankMode('revisao')}
                className="col-span-1 md:col-span-1 lg:col-span-6 text-left group animate-fade-up"
                style={{ animationDelay: '0.16s' }}
              >
                <div className="bg-white rounded-xl p-5 sm:p-8 shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-[#bec9c4]/10 group-hover:bg-[#006D5B]/[0.03] transition-all duration-300 h-full">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-[#c8eade]/50 rounded-2xl">
                      <MI name="flash_on" fill className="text-[24px] sm:text-[28px] text-[#46645c]" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#46645c] uppercase bg-[#c8eade]/50 px-2 py-1 rounded">20 Questões</span>
                  </div>
                  <h3 className="font-['Manrope'] text-lg sm:text-2xl font-extrabold mb-1.5 sm:mb-2 group-hover:text-[#46645c] transition-colors">Revisão Rápida</h3>
                  <p className="text-[#3e4945]/70 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">Treino diário de alta intensidade. Ideal para manter o ritmo de estudo entre turnos e plantões.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-[#6e7975]">Tempo estimado: 15 min</span>
                    <span className="flex items-center text-[#46645c] font-bold text-xs sm:text-sm">
                      Praticar
                      <MI name="bolt" fill className="text-[18px] ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>

              {/* ─── Simulado IA 50q (Dark Card) ─── */}
              <div className="col-span-1 lg:col-span-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <button onClick={() => startIaMode('ia_completo')} className="w-full text-left group">
                  <div className="h-full bg-[#191c1d] p-6 sm:p-10 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.15)] relative overflow-hidden flex flex-col justify-between min-h-[260px] sm:min-h-[320px] group-hover:shadow-[0_16px_48px_rgba(25,28,29,0.25)] transition-all duration-300 group-active:scale-[0.99]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#006D5B]/30 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <MI name="auto_awesome" fill className="text-[18px] text-[#9df3dc]" />
                        <span className="text-[#9df3dc] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Inovação Editorial</span>
                      </div>
                      <h3 className="font-['Manrope'] text-2xl sm:text-3xl font-extrabold text-white mb-3 sm:mb-4">Simulado IA 50q</h3>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">Questões inéditas geradas por nossa inteligência artificial proprietária, treinada nos padrões de cobrança mais recentes do ENAMED.</p>
                    </div>
                    <div className="relative z-10 w-full bg-[#9df3dc] text-[#005344] py-3 sm:py-4 rounded-lg font-['Manrope'] font-extrabold text-xs sm:text-sm uppercase tracking-tight text-center group-hover:bg-white transition-colors">
                      Gerar Questões Inéditas
                    </div>
                  </div>
                </button>
              </div>

              {/* ─── Estudo por Área (List View) ─── */}
              <div className="col-span-1 lg:col-span-7 animate-fade-up" style={{ animationDelay: '0.24s' }}>
                <div className="bg-[#f3f4f5] rounded-xl p-5 sm:p-8 h-full">
                  <div className="flex items-center justify-between mb-5 sm:mb-8">
                    <h3 className="font-['Manrope'] text-base sm:text-xl font-extrabold text-[#191c1d]">Estudo por Área</h3>
                    <button
                      onClick={() => setMode('ia_area')}
                      className="text-[#006D5B] text-[10px] sm:text-xs font-bold uppercase hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                  <div className="space-y-2.5 sm:space-y-4">
                    {AREA_OPTIONS.map(({ value, label, icon, desc, iconBg, iconColor }) => (
                      <button
                        key={value}
                        onClick={() => startIaMode('ia_area', value)}
                        className="w-full bg-white p-3 sm:p-4 rounded-xl flex items-center justify-between hover:translate-x-1 transition-transform cursor-pointer group/item"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                            <MI name={icon} fill className={`text-[18px] sm:text-[20px] ${iconColor}`} />
                          </div>
                          <div className="text-left">
                            <p className="font-['Manrope'] font-bold text-xs sm:text-sm text-[#191c1d] group-hover/item:text-[#006D5B] transition-colors">{label}</p>
                            <p className="text-[9px] sm:text-[10px] text-[#6e7975] uppercase tracking-tight">{desc}</p>
                          </div>
                        </div>
                        <MI name="chevron_right" className="text-[20px] text-[#6e7975] group-hover/item:text-[#006D5B] transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ AREA SELECTION ═══════════════════════ */}
        {mode === 'ia_area' && !generating && !resultado && (
          <div>
            <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-up">
              <button onClick={handleBackToMenu} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-[#006D5B] transition-colors active:scale-95">
                <ArrowLeft className="h-4 w-4" /> ENAMED
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm font-semibold text-[#191c1d]">Escolha a Área</span>
            </div>

            <div className="mb-6 sm:mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="font-['Manrope'] text-xl sm:text-3xl font-extrabold text-[#191c1d] mb-2 tracking-tight">
                Selecione a <span className="text-[#006D5B]">Especialidade</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#3e4945]/70">20 questões inéditas geradas por IA na área escolhida.</p>
            </div>

            <div className="bg-[#f3f4f5] rounded-xl p-4 sm:p-8">
              <div className="space-y-2.5 sm:space-y-4">
                {AREA_OPTIONS.map(({ value, label, icon, desc, iconBg, iconColor }, i) => (
                  <button
                    key={value}
                    onClick={() => startIaMode('ia_area', value)}
                    className="w-full bg-white p-4 sm:p-5 rounded-xl flex items-center justify-between hover:translate-x-1 transition-all cursor-pointer group animate-fade-up"
                    style={{ animationDelay: `${0.1 + i * 0.04}s` }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                        <MI name={icon} fill className={`text-[20px] sm:text-[24px] ${iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-['Manrope'] font-bold text-sm sm:text-base text-[#191c1d] group-hover:text-[#006D5B] transition-colors">{label}</p>
                        <p className="text-[10px] sm:text-xs text-[#6e7975] uppercase tracking-tight">{desc}</p>
                      </div>
                    </div>
                    <MI name="chevron_right" className="text-[22px] text-[#6e7975] group-hover:text-[#006D5B] transition-colors shrink-0" />
                  </button>
                ))}
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
              <div className="flex-1 min-w-0 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_32px_0_rgba(44,52,52,0.06)] p-4 sm:p-6 flex flex-col overflow-hidden">
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
              <div className="flex-1 min-w-0 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_32px_0_rgba(44,52,52,0.06)] p-4 sm:p-6 flex flex-col overflow-hidden">
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
