import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { useActiveStudyPlan, diasAteProva, progressoPlano, getTodayDay, abandonActivePlan } from "@/hooks/useStudyPlan";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import { Calendar, Flame, Trophy, Target, ArrowRight, RefreshCw, Snowflake, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const FASE_LABEL: Record<string, string> = {
  aprendizado: "Aprendizado",
  consolidacao: "Consolidação",
  revisao_final: "Revisão final",
  descanso: "Descanso",
};

const FASE_COR: Record<string, string> = {
  aprendizado: "text-emerald-700 bg-emerald-50",
  consolidacao: "text-amber-700 bg-amber-50",
  revisao_final: "text-orange-700 bg-orange-50",
  descanso: "text-slate-600 bg-slate-100",
};

export default function Cronograma() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { hasFeature } = useFeatureAccess("core");
  const { plan, days, loading, reload } = useActiveStudyPlan();
  const navigate = useNavigate();
  const [abandonando, setAbandonando] = useState(false);

  if (authLoading || subLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  // Gate: cronograma SÓ pra pago. Trial não tem acesso.
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-[#005344]" />
            </div>
            <h1 className="font-['Manrope'] font-bold text-3xl text-[#191C1D] mb-2">
              Cronograma personalizado
            </h1>
            <p className="text-base text-[#4a5568] leading-relaxed max-w-md mx-auto">
              Coloque sua próxima prova e tópicos. A IA monta um plano dia-a-dia que liga fechamentos,
              flashcards e simulados — você só executa.
            </p>
          </div>
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }

  // Sem plano ativo
  if (!plan) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-5">
              <Target className="w-8 h-8 text-[#005344]" />
            </div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-3">
              Cronograma de estudo
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.02em] text-[#191C1D] mb-3">
              Pra qual prova você está estudando?
            </h1>
            <p className="text-base text-[#4a5568] leading-relaxed max-w-xl mx-auto">
              Em 30 segundos a IA monta um plano dia-a-dia ligando fechamentos, flashcards e questões
              ENAMED. Você só executa.
            </p>
          </div>

          {/* Como funciona */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { n: "1", t: "Conta sua prova", d: "Nome, data e tópicos que vão cair" },
              { n: "2", t: "IA monta o plano", d: "Distribui tudo em fases: aprendizado → revisão" },
              { n: "3", t: "Executa e marca", d: "Cada atividade já abre a feature certa" },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-slate-200 p-5">
                <span className="inline-flex w-7 h-7 rounded-full bg-[#005344] text-white text-xs font-bold items-center justify-center mb-3">
                  {s.n}
                </span>
                <p className="font-['Manrope'] font-bold text-sm text-[#191C1D] mb-1">{s.t}</p>
                <p className="text-xs text-[#4a5568] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/cronograma/novo")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar meu cronograma
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Tem plano ativo
  const dias = diasAteProva(plan.prova_data);
  const progresso = progressoPlano(days);
  const hoje = getTodayDay(days);
  const todayISO = new Date().toISOString().slice(0, 10);
  const futurosNum = days.filter((d) => d.data > todayISO).slice(0, 6);

  const handleAbandonar = async () => {
    if (!confirm(`Abandonar o plano de ${plan.prova_nome}? Você vai perder o progresso e o streak.`)) return;
    try {
      setAbandonando(true);
      await abandonActivePlan(plan.id);
      toast({ title: "Plano abandonado", description: "Você pode criar um novo a qualquer momento." });
      await reload();
      navigate("/cronograma");
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAbandonando(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />
              Plano ativo
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] leading-tight">
              {plan.prova_nome}
            </h1>
            <p className="text-sm text-[#4a5568] mt-1.5">
              {new Date(plan.prova_data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              {" · "}
              <span className={`font-bold ${dias <= 7 ? "text-orange-700" : dias <= 14 ? "text-amber-700" : "text-[#191C1D]"}`}>
                {dias === 0 ? "É HOJE!" : dias === 1 ? "AMANHÃ" : `Faltam ${dias} dias`}
              </span>
            </p>
          </div>
          <button
            onClick={handleAbandonar}
            disabled={abandonando}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-[#4a5568] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Trocar plano
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak" value={`${plan.streak_dias} ${plan.streak_dias === 1 ? "dia" : "dias"}`} />
          <StatCard icon={<Snowflake className="w-4 h-4 text-blue-500" />} label="Freezes" value={`${plan.freezes_disponiveis}`} />
          <StatCard icon={<Trophy className="w-4 h-4 text-[#C9A84C]" />} label="Progresso" value={`${progresso.pct}%`} extra={`${progresso.feitas}/${progresso.total} atividades`} />
          <StatCard icon={<Calendar className="w-4 h-4 text-[#005344]" />} label="Plano total" value={`${days.length} dias`} />
        </div>

        {/* Hoje em destaque */}
        {hoje ? (
          <div
            onClick={() => navigate(`/cronograma/dia/${hoje.data}`)}
            className="cursor-pointer group bg-gradient-to-br from-[#005344] via-[#006D5B] to-[#005344] rounded-2xl p-6 mb-6 shadow-[0_12px_32px_-12px_rgba(0,109,91,0.4)] hover:shadow-[0_16px_40px_-12px_rgba(0,109,91,0.5)] transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#C9A84C] mb-2">
                  {hoje.data === todayISO ? "Hoje" : "Próximo dia"}
                </p>
                <h2 className="font-['Manrope'] font-bold text-2xl text-white mb-2 truncate">
                  {hoje.topico_principal ?? "—"}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${FASE_COR[hoje.fase]}`}>
                    {FASE_LABEL[hoje.fase]}
                  </span>
                  <span className="text-xs text-white/80">
                    {hoje.atividades.length} {hoje.atividades.length === 1 ? "atividade" : "atividades"} · {hoje.concluido_pct}% feita
                  </span>
                </div>
              </div>
              <button className="shrink-0 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-white text-[#005344] text-sm font-bold group-hover:bg-[#C9A84C] group-hover:text-white transition-all">
                Começar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#C9A84C] transition-all duration-500"
                style={{ width: `${hoje.concluido_pct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center mb-6 bg-slate-50/40">
            <Trophy className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
            <p className="font-['Manrope'] font-bold text-base text-[#191C1D]">
              Você terminou todos os dias do plano!
            </p>
            <p className="text-sm text-[#4a5568] mt-1">Boa sorte na prova 👊</p>
          </div>
        )}

        {/* Próximos 6 dias */}
        {futurosNum.length > 0 && (
          <div className="mb-6">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-300" />
              Próximos dias
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {futurosNum.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/cronograma/dia/${d.data}`)}
                  className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-[#005344]/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-[#005344]">
                      {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                    </p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${FASE_COR[d.fase]}`}>
                      {FASE_LABEL[d.fase]}
                    </span>
                  </div>
                  <p className="font-['Manrope'] font-bold text-sm text-[#191C1D] truncate">
                    {d.topico_principal ?? "—"}
                  </p>
                  <p className="text-xs text-[#4a5568] mt-1">{d.atividades.length} atividades</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de dias passados */}
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-slate-300" />
            Dias anteriores
          </p>
          <div className="space-y-1.5">
            {days
              .filter((d) => d.data < todayISO)
              .reverse()
              .slice(0, 8)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/cronograma/dia/${d.data}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wide">
                      {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#191C1D] truncate">{d.topico_principal ?? "—"}</p>
                    <p className="text-[11px] text-[#4a5568]">
                      {d.concluido_pct === 100 ? "✓ Concluído" : `${d.concluido_pct}% feito`}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${d.concluido_pct === 100 ? "bg-emerald-500" : d.concluido_pct > 0 ? "bg-amber-400" : "bg-slate-300"}`} />
                </button>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, extra }: { icon: React.ReactNode; label: string; value: string; extra?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568]">{label}</p>
      </div>
      <p className="font-['Manrope'] font-bold text-xl text-[#191C1D]">{value}</p>
      {extra && <p className="text-[11px] text-[#94a3b8] mt-0.5">{extra}</p>}
    </div>
  );
}
