import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useActiveStudyPlan, toggleAtividadeConcluida, type Atividade, type StudyPlanDay } from "@/hooks/useStudyPlan";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, ArrowRight, Check, Clock, FileText, Sparkles, BookOpen, RefreshCw, Brain,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TIPO_ICON: Record<Atividade["tipo"], typeof FileText> = {
  fechamento: FileText,
  flashcards: Brain,
  questoes: Sparkles,
  revisao_flash: RefreshCw,
  leitura: BookOpen,
};

const TIPO_LABEL: Record<Atividade["tipo"], string> = {
  fechamento: "Fechamento de PBL",
  flashcards: "Criar flashcards",
  questoes: "Simulado ENAMED",
  revisao_flash: "Revisar flashcards",
  leitura: "Leitura dirigida",
};

const TIPO_COR: Record<Atividade["tipo"], string> = {
  fechamento: "bg-emerald-50 text-emerald-700 border-emerald-200",
  flashcards: "bg-violet-50 text-violet-700 border-violet-200",
  questoes: "bg-blue-50 text-blue-700 border-blue-200",
  revisao_flash: "bg-amber-50 text-amber-700 border-amber-200",
  leitura: "bg-slate-50 text-slate-700 border-slate-200",
};

const FASE_LABEL: Record<string, string> = {
  aprendizado: "Aprendizado",
  consolidacao: "Consolidação",
  revisao_final: "Revisão final",
  descanso: "Descanso",
};

export default function CronogramaDia() {
  const { date } = useParams<{ date: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { plan, days, loading, reload } = useActiveStudyPlan();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState<number | null>(null);

  if (authLoading || subLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }
  if (!plan) return <Navigate to="/cronograma" replace />;

  const dia = days.find((d) => d.data === date);
  if (!dia) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <p className="font-['Manrope'] font-bold text-xl text-[#191C1D]">Dia não encontrado no plano</p>
          <button
            onClick={() => navigate("/cronograma")}
            className="mt-4 inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#005344] text-white text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const isHoje = dia.data === todayISO;
  const isPassado = dia.data < todayISO;
  const isFuturo = dia.data > todayISO;

  const idx = days.findIndex((d) => d.id === dia.id);
  const anterior = idx > 0 ? days[idx - 1] : null;
  const proximo = idx < days.length - 1 ? days[idx + 1] : null;

  const handleToggle = async (i: number) => {
    setToggling(i);
    try {
      await toggleAtividadeConcluida(dia.id, i);
      await reload();
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const handleStart = (a: Atividade, i: number) => {
    // Deep link: passa contexto pra cada feature
    const ctx = `?planDay=${dia.id}&actIdx=${i}&tema=${encodeURIComponent(a.tema)}`;
    if (a.tipo === "fechamento") {
      navigate(`/dashboard${ctx}`);
    } else if (a.tipo === "flashcards") {
      navigate(`/flashcards${ctx}&action=create`);
    } else if (a.tipo === "questoes") {
      navigate(`/exam${ctx}&n=${a.quantidade ?? 5}`);
    } else if (a.tipo === "revisao_flash") {
      navigate(`/flashcards${ctx}&action=review`);
    } else {
      // leitura: abre AI chat com o tema
      navigate(`/ai-chat${ctx}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/cronograma")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cronograma
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-2 flex items-center gap-2">
            <span className="w-6 h-px bg-[#C9A84C]" />
            {isHoje ? "Hoje" : isPassado ? "Dia anterior" : "Dia futuro"}
            <span className="text-[#94a3b8] font-mono">·</span>
            <span className="text-[#4a5568]">
              {new Date(dia.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </span>
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] leading-tight">
            {dia.topico_principal ?? "—"}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#4a5568]">
              {FASE_LABEL[dia.fase]}
            </span>
            <span className="text-xs text-[#4a5568]">
              {dia.atividades.length} {dia.atividades.length === 1 ? "atividade" : "atividades"} · ~
              {dia.atividades.reduce((s, a) => s + (a.estimativa_min ?? 0), 0)} min
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568]">Progresso do dia</p>
            <p className="text-sm font-['Manrope'] font-bold text-[#191C1D]">{dia.concluido_pct}%</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#005344] to-[#C9A84C] transition-all duration-500"
              style={{ width: `${dia.concluido_pct}%` }}
            />
          </div>
        </div>

        {/* Atividades */}
        <div className="space-y-3">
          {dia.atividades.map((a, i) => {
            const Icon = TIPO_ICON[a.tipo];
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  a.concluida ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 hover:border-[#005344]/30"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(i)}
                      disabled={toggling === i}
                      className={`shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        a.concluida
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300 hover:border-[#005344] hover:bg-[#005344]/5"
                      } disabled:opacity-50`}
                    >
                      {a.concluida && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${TIPO_COR[a.tipo]}`}>
                          <Icon className="w-3 h-3" />
                          {TIPO_LABEL[a.tipo]}
                        </span>
                        <span className="text-[10.5px] text-[#94a3b8] flex items-center gap-1">
                          <Clock className="w-3 h-3" />~{a.estimativa_min} min
                        </span>
                        {a.quantidade && (
                          <span className="text-[10.5px] text-[#94a3b8]">
                            {a.quantidade} {a.tipo === "questoes" ? "questões" : "cards"}
                          </span>
                        )}
                      </div>
                      <p className={`font-['Manrope'] font-bold text-base leading-snug mb-1 ${a.concluida ? "text-[#4a5568] line-through" : "text-[#191C1D]"}`}>
                        {a.tema}
                      </p>
                      <p className={`text-sm leading-relaxed ${a.concluida ? "text-[#94a3b8]" : "text-[#4a5568]"}`}>
                        {a.descricao}
                      </p>

                      {/* Botão começar */}
                      {!a.concluida && (
                        <button
                          onClick={() => handleStart(a, i)}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#005344] text-white text-xs font-bold hover:bg-[#003D32] transition-colors"
                        >
                          Começar atividade
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {a.concluida && a.completed_at && (
                        <p className="mt-2 text-[11px] text-emerald-700">
                          ✓ Concluído em {new Date(a.completed_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navegação dias */}
        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-200">
          {anterior ? (
            <button
              onClick={() => navigate(`/cronograma/dia/${anterior.data}`)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-xs font-semibold text-[#4a5568] hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {new Date(anterior.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </button>
          ) : (
            <span />
          )}
          {proximo ? (
            <button
              onClick={() => navigate(`/cronograma/dia/${proximo.data}`)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-xs font-semibold text-[#4a5568] hover:bg-slate-100 transition-colors"
            >
              {new Date(proximo.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
