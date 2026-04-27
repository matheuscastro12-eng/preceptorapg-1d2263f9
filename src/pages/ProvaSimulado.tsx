import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProvaQuestoes,
  type Prova,
  type ProvaQuestao,
} from "@/hooks/useProvas";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

type Phase = "intro" | "running" | "result";

const ProvaSimulado = () => {
  const { id: provaId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prova, setProva] = useState<Prova | null>(null);
  const [questoes, setQuestoes] = useState<ProvaQuestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Carrega dados
  useEffect(() => {
    if (!provaId || !user) return;
    let alive = true;
    void (async () => {
      const { data: p } = await supabase
        .from("provas_importadas")
        .select("*")
        .eq("id", provaId)
        .maybeSingle();
      if (!alive) return;
      if (!p) {
        toast({ title: "Prova não encontrada", variant: "destructive" });
        navigate("/provas");
        return;
      }
      setProva(p as Prova);
      const qs = await fetchProvaQuestoes(provaId);
      if (alive) {
        // So questoes aprovadas/editadas viram simulado
        const aprovadas = qs.filter(
          (q) => q.status === "approved" || q.status === "edited",
        );
        setQuestoes(aprovadas);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [provaId, user, navigate, toast]);

  // Timer
  useEffect(() => {
    if (phase !== "running") return;
    intervalRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [phase]);

  if (authLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!prova) return null;

  if (questoes.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 px-6 text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center mb-4">
            <Flag className="w-7 h-7 text-amber-700" />
          </div>
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Sem questões aprovadas
          </h1>
          <p className="text-sm text-[#4a5568] mb-6 leading-relaxed">
            Vá pra tela de revisão e aprove ao menos uma questão pra rodar o
            simulado.
          </p>
          <button
            onClick={() => navigate(`/provas/${provaId}/review`)}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir pra revisão
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const startSimulado = () => {
    startedAt.current = Date.now();
    setElapsed(0);
    setAnswers({});
    setCurrentIdx(0);
    setPhase("running");
  };

  const setAnswer = (questaoId: string, letra: string) => {
    setAnswers((a) => ({ ...a, [questaoId]: letra }));
  };

  const finishSimulado = async () => {
    setSubmitting(true);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    const correct = questoes.filter(
      (q) => answers[q.id] === q.gabarito,
    ).length;
    const pct = (correct / questoes.length) * 100;
    try {
      await supabase.from("prova_attempts").insert({
        user_id: user.id,
        prova_id: provaId,
        total_questions: questoes.length,
        correct_answers: correct,
        percentage: pct,
        answers,
        duration_seconds: elapsed,
        finished_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Falha ao salvar tentativa:", e);
    }
    setSubmitting(false);
    setPhase("result");
  };

  // ─────────────────────────── INTRO
  if (phase === "intro") {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-12 px-6">
          <button
            onClick={() => navigate("/provas")}
            className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#191C1D] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(25,28,29,0.04)]">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="p-8">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 mb-3">
                <span className="w-5 h-px bg-[#C9A84C]" />
                Simulado online
              </p>
              <h1 className="font-['Manrope'] font-bold text-3xl text-[#191C1D] tracking-[-0.02em] mb-2">
                {prova.titulo}
              </h1>
              <p className="text-sm text-[#4a5568] leading-relaxed mb-6">
                Resolva no seu ritmo. Ao final você vê o desempenho por questão
                com o gabarito comentado.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <Stat label="Questões" value={questoes.length} />
                <Stat label="Alternativas" value={`A–${String.fromCharCode(64 + prova.num_alternativas)}`} />
                <Stat label="Tempo" value="Livre" />
              </div>

              <button
                onClick={startSimulado}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-['Manrope'] font-bold text-base shadow-[0_8px_24px_-8px_rgba(0,109,91,0.45)]"
              >
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                Começar simulado
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────── RESULT
  if (phase === "result") {
    const correct = questoes.filter((q) => answers[q.id] === q.gabarito).length;
    const pct = Math.round((correct / questoes.length) * 100);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-10 px-6">
          {/* Score header */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-6 shadow-[0_4px_20px_rgba(25,28,29,0.04)]">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="p-8 text-center">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-[#005344]" />
              </div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-2">
                Resultado · {prova.titulo}
              </p>
              <div className="font-['Manrope'] font-bold text-6xl text-[#191C1D] tracking-[-0.03em] mb-1">
                {pct}%
              </div>
              <p className="text-sm text-[#4a5568]">
                <strong>{correct}</strong> de {questoes.length} corretas · tempo{" "}
                <strong>{m}:{String(s).padStart(2, "0")}</strong>
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={startSimulado}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-[#4a5568] hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refazer
                </button>
                <button
                  onClick={() => navigate("/provas")}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar pra Provas
                </button>
              </div>
            </div>
          </div>

          {/* Per-question feedback */}
          <h2 className="font-['Manrope'] font-bold text-lg text-[#191C1D] mb-3">
            Revisão das questões
          </h2>
          <div className="space-y-3">
            {questoes.map((q) => {
              const userAns = answers[q.id];
              const correto = userAns === q.gabarito;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border-2 ${
                    correto ? "border-emerald-200" : "border-red-200"
                  } overflow-hidden`}
                >
                  <div
                    className={`px-5 py-2.5 flex items-center gap-2 ${
                      correto ? "bg-emerald-50" : "bg-red-50"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-[#191C1D]">
                      Q{String(q.numero).padStart(2, "0")}
                    </span>
                    {correto ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acertou
                      </span>
                    ) : userAns ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                        <XCircle className="w-3.5 h-3.5" /> Errou (você marcou{" "}
                        <strong>{userAns}</strong>, correto:{" "}
                        <strong>{q.gabarito}</strong>)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                        <Flag className="w-3.5 h-3.5" /> Em branco (correto:{" "}
                        <strong>{q.gabarito}</strong>)
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-[#191C1D] leading-relaxed whitespace-pre-wrap mb-3">
                      {q.enunciado}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {q.alternativas.map((alt, i) => {
                        const letra = String.fromCharCode(65 + i);
                        const isCorrect = letra === q.gabarito;
                        const isUser = letra === userAns;
                        return (
                          <div
                            key={i}
                            className={`flex gap-2 px-2.5 py-1.5 rounded-lg text-sm ${
                              isCorrect
                                ? "bg-emerald-50 border border-emerald-200"
                                : isUser
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-slate-50 border border-slate-100"
                            }`}
                          >
                            <span
                              className={`shrink-0 font-mono text-xs font-bold w-6 ${
                                isCorrect
                                  ? "text-emerald-700"
                                  : isUser
                                    ? "text-red-700"
                                    : "text-[#94a3b8]"
                              }`}
                            >
                              {letra}
                            </span>
                            <span className="text-[#191C1D] leading-relaxed flex-1">
                              {alt}
                            </span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            {isUser && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {q.justificativa && (
                      <details className="mt-3 group">
                        <summary className="cursor-pointer text-xs font-semibold text-[#005344] inline-flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
                          {q.justificativa_origem === "ia"
                            ? "Justificativa (gerada por IA)"
                            : "Justificativa (do PDF)"}
                        </summary>
                        <div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border-l-3 border-[#C9A84C] text-sm text-[#191C1D] leading-relaxed whitespace-pre-wrap">
                          {q.justificativa}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────── RUNNING
  const q = questoes[currentIdx];
  const total = questoes.length;
  const answered = Object.keys(answers).length;
  const pctProgress = (answered / total) * 100;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  return (
    <DashboardLayout hideFooter>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (confirm("Encerrar simulado? Suas respostas serão perdidas.")) {
                navigate("/provas");
              }
            }}
            className="w-9 h-9 rounded-lg text-[#4a5568] hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-['Manrope'] font-bold text-base text-[#191C1D] truncate">
              {prova.titulo}
            </h1>
            <div className="flex items-center gap-3 text-xs text-[#4a5568]">
              <span className="font-mono">
                {currentIdx + 1}/{total}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {m}:{String(s).padStart(2, "0")}
              </span>
              <span>· {answered} respondidas</span>
            </div>
          </div>
          <button
            onClick={finishSimulado}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#C9A84C] text-[#191C1D] text-sm font-bold hover:brightness-105 disabled:opacity-60"
          >
            <Flag className="w-4 h-4" />
            Encerrar
          </button>
        </header>

        {/* Progress */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-[#005344] to-[#C9A84C] transition-all"
            style={{ width: `${pctProgress}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-[#005344]">
                  Q{String(q.numero).padStart(2, "0")}
                </span>
                <span className="text-[10.5px] text-[#94a3b8]">
                  de {prova.titulo}
                </span>
              </div>
              <p className="text-base text-[#191C1D] leading-relaxed whitespace-pre-wrap mb-6 font-['DM_Sans']">
                {q.enunciado}
              </p>
              <div className="space-y-2">
                {q.alternativas.map((alt, i) => {
                  const letra = String.fromCharCode(65 + i);
                  const selected = answers[q.id] === letra;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(q.id, letra)}
                      className={`w-full text-left flex gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                        selected
                          ? "border-[#005344] bg-[#005344]/5 shadow-[0_2px_8px_-2px_rgba(0,109,91,0.2)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg font-mono font-bold text-sm flex items-center justify-center ${
                          selected
                            ? "bg-[#005344] text-white"
                            : "bg-slate-100 text-[#4a5568]"
                        }`}
                      >
                        {letra}
                      </span>
                      <span className="text-sm text-[#191C1D] leading-relaxed flex-1">
                        {alt}
                      </span>
                      {selected && (
                        <Check className="w-5 h-5 text-[#005344] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-[#4a5568] hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto px-2 max-w-full">
              {questoes.map((_, i) => {
                const isAnswered = !!answers[questoes[i].id];
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`shrink-0 w-7 h-7 rounded-md text-[11px] font-mono font-bold border ${
                      isCurrent
                        ? "bg-[#191C1D] text-white border-[#191C1D]"
                        : isAnswered
                          ? "bg-[#005344]/10 text-[#005344] border-[#005344]/30"
                          : "bg-white text-[#94a3b8] border-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {currentIdx < total - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishSimulado}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold disabled:opacity-60"
              >
                <Flag className="w-4 h-4" />
                Encerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProvaSimulado;

// ─────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
      <div className="font-['Manrope'] font-bold text-xl text-[#191C1D]">
        {value}
      </div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#4a5568] mt-0.5">
        {label}
      </div>
    </div>
  );
}
