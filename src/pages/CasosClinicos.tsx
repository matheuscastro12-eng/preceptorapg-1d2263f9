import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useClinicalCasesList, deleteClinicalCase, SEXO_LABEL } from "@/hooks/useClinicalCases";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  Stethoscope, Plus, ArrowRight, Trash2, FileQuestion, Edit3, Check, Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CasosClinicos() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { cases, loading, reload } = useClinicalCasesList();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (authLoading || subLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
              <Stethoscope className="w-7 h-7 text-[#005344]" />
            </div>
            <h1 className="font-['Manrope'] font-bold text-3xl text-[#191C1D] mb-2">
              Casos clínicos para aula
            </h1>
            <p className="text-base text-[#4a5568] leading-relaxed max-w-md mx-auto">
              Monte casos com PreceptorMED por chat, gere questões em cima e use em
              suas aulas, simulações ou estudos.
            </p>
          </div>
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }

  const completos = cases.filter((c) => c.status === "complete");
  const emConstrucao = cases.filter((c) => c.status === "building");

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Apagar o caso "${label}"? Essa ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    try {
      await deleteClinicalCase(id);
      toast({ title: "Caso apagado" });
      await reload();
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-[#C9A84C]" />
              Casos clínicos
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.02em] text-[#191C1D] leading-tight">
              Construa um caso pra <em className="not-italic font-medium text-[#8a6f26]">discutir em aula</em>.
            </h1>
            <p className="text-sm text-[#4a5568] mt-2 max-w-xl leading-relaxed">
              PreceptorMED faz perguntas adaptativas (nome, idade, queixa, exame, exames) e
              monta um caso clínico estruturado pronto para uso. Depois você gera questões
              ENAMED em cima do caso.
            </p>
          </div>
          <button
            onClick={() => navigate("/casos-clinicos/novo")}
            className="shrink-0 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm shadow-[0_8px_24px_-8px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-6px_rgba(0,109,91,0.55)] transition-shadow"
          >
            <Plus className="w-4 h-4" />
            Novo caso
          </button>
        </div>

        {/* Em construção */}
        {emConstrucao.length > 0 && (
          <section className="mb-8">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-3 flex items-center gap-2">
              <Edit3 className="w-3 h-3" />
              Em construção
            </p>
            <div className="space-y-2">
              {emConstrucao.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/casos-clinicos/novo?continuar=${c.id}`)}
                  className="w-full text-left bg-white rounded-2xl border border-amber-200 p-4 hover:border-amber-400 transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#191C1D] truncate">
                      {c.paciente_nome ?? "Caso novo"} · {c.doenca_principal ?? "doença não definida"}
                    </p>
                    <p className="text-[11px] text-[#4a5568] mt-0.5">
                      {c.conversation.length} mensagem{c.conversation.length === 1 ? "" : "ns"} ·
                      iniciado {new Date(c.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                    Continuar
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Completos */}
        {completos.length > 0 ? (
          <section>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-3 flex items-center gap-2">
              <Check className="w-3 h-3" />
              Completos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completos.map((c) => (
                <article
                  key={c.id}
                  className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#005344]/30 hover:shadow-[0_4px_16px_-8px_rgba(0,109,91,0.12)] transition-all flex flex-col"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#005344]/8 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-[#005344]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Manrope'] font-bold text-sm text-[#191C1D] leading-snug">
                        {c.titulo ?? `${c.paciente_nome ?? "Paciente"} · ${c.doenca_principal ?? "Caso"}`}
                      </h3>
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {c.paciente_idade ? `${c.paciente_idade}${c.paciente_idade_unidade === "anos" ? "a" : c.paciente_idade_unidade}` : "—"}
                        {c.paciente_sexo && ` · ${SEXO_LABEL[c.paciente_sexo] ?? c.paciente_sexo}`}
                      </p>
                    </div>
                  </div>
                  {c.resumo_curto && (
                    <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-3 flex-1 mb-3">
                      {c.resumo_curto}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/casos-clinicos/${c.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-[#005344] text-white text-xs font-bold hover:bg-[#003D32] transition-colors"
                    >
                      Abrir caso
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.titulo ?? c.doenca_principal ?? "caso")}
                      disabled={deletingId === c.id}
                      className="w-9 h-9 rounded-lg text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50"
                      aria-label="Apagar caso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : emConstrucao.length === 0 ? (
          <EmptyState onStart={() => navigate("/casos-clinicos/novo")} />
        ) : null}

        {/* Footer educativo */}
        <div className="mt-12 p-4 rounded-xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15 flex items-start gap-3">
          <FileQuestion className="w-4 h-4 text-[#8a6f26] shrink-0 mt-0.5" />
          <p className="text-xs text-[#4a5568] leading-relaxed">
            Casos são salvos na sua conta e podem ser reabertos a qualquer momento.
            Em cada caso completo, você pode <strong>gerar questões ENAMED-style</strong> que
            ficam vinculadas ao caso — útil pra prova de turma, lista de exercícios ou simulação.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-10 text-center">
      <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
        <Stethoscope className="w-7 h-7 text-[#005344]" />
      </div>
      <h2 className="font-['Manrope'] font-bold text-xl text-[#191C1D] mb-2">
        Você ainda não tem nenhum caso clínico
      </h2>
      <p className="text-sm text-[#4a5568] mb-6 max-w-md mx-auto leading-relaxed">
        Comece um caso novo. PreceptorMED conduz a conversa em ~10 perguntas e
        entrega o caso pronto pra usar em aula.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm"
      >
        <Plus className="w-4 h-4" />
        Criar meu primeiro caso
      </button>
    </div>
  );
}
