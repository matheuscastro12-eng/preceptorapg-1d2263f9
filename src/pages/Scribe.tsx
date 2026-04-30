import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useConsultas, deleteConsulta, type Consulta } from "@/hooks/useScribe";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  Mic, Plus, FileText, Loader2, AlertTriangle, Trash2,
  CheckCircle2, Edit3, Hourglass, Sparkles, Clock,
} from "lucide-react";

const STATUS_CONFIG = {
  gravando:           { label: "Gravando",         icon: Mic,           cls: "bg-slate-100 text-slate-700 border-slate-200" },
  transcrevendo:      { label: "Transcrevendo",    icon: Sparkles,      cls: "bg-blue-50 text-blue-700 border-blue-200" },
  estruturando:       { label: "Estruturando",     icon: Sparkles,      cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pendente_revisao:   { label: "Aguardando revisão", icon: Edit3,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  aprovada:           { label: "Aprovada",         icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  arquivada:          { label: "Arquivada",        icon: FileText,      cls: "bg-gray-100 text-gray-500 border-gray-200" },
  erro:               { label: "Erro",             icon: AlertTriangle, cls: "bg-red-50 text-red-700 border-red-200" },
} as const;

const Scribe = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, reason, loading } = useFeatureAccess("scribe");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { consultas, loading: loadingConsultas, refresh } = useConsultas();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = consultas.length;
    const pendentes = consultas.filter((c) => c.status === "pendente_revisao").length;
    const aprovadas = consultas.filter((c) => c.status === "aprovada").length;
    return { total, pendentes, aprovadas };
  }, [consultas]);

  if (authLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  if (!hasFeature && reason === "no_subscription") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }
  if (!hasFeature && reason === "no_invite") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <UpgradePaywall variant="beta-only" betaModule="Scribe Clínico" />
        </div>
      </DashboardLayout>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConsulta(id);
      toast({ title: "Consulta removida" });
      void refresh();
    } catch (e) {
      toast({
        title: "Erro ao remover",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
    setConfirmDeleteId(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
              <span className="w-6 h-px bg-[#C9A84C]" />
              Scribe Clínico · Beta
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
              Grave a consulta,{" "}
              <em className="not-italic font-medium text-[#8a6f26]">
                a IA monta o prontuário
              </em>
              .
            </h1>
            <p className="text-sm text-[#4a5568] mt-2 max-w-[58ch] leading-relaxed">
              Áudio → transcrição → SOAP estruturado → você revisa e assina.
              Compliance LGPD/CFM. Áudio com retenção configurável.
            </p>
          </div>
          <button
            onClick={() => navigate("/scribe/nova")}
            className="shrink-0 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm font-['Manrope'] shadow-[0_8px_24px_-8px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-6px_rgba(0,109,91,0.55)] transition-shadow"
          >
            <Plus className="w-4 h-4" />
            Nova consulta
          </button>
        </div>

        {/* Stats */}
        {consultas.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Stat label="Consultas" value={stats.total} accent="primary" />
            <Stat label="Aguardando revisão" value={stats.pendentes} accent="amber" />
            <Stat label="Aprovadas" value={stats.aprovadas} accent="emerald" />
          </div>
        )}

        {/* Lista */}
        {loadingConsultas ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : consultas.length === 0 ? (
          <EmptyState onStart={() => navigate("/scribe/nova")} />
        ) : (
          <div className="space-y-2">
            {consultas.map((c) => (
              <ConsultaCard
                key={c.id}
                consulta={c}
                onOpen={() => navigate(`/scribe/${c.id}/review`)}
                onDelete={() => setConfirmDeleteId(c.id)}
              />
            ))}
          </div>
        )}

        {/* Compliance footer */}
        <div className="mt-10 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Responsabilidade médica:</strong> a IA é ferramenta de
            apoio à documentação. O médico revisa e assina cada prontuário —
            é responsável pelo conteúdo final perante CFM (Resoluções
            1.821/2007 e 2.299/2021). Consentimento do paciente registrado
            por consulta (LGPD Art. 11).
          </p>
        </div>
      </div>

      {confirmDeleteId && (
        <ConfirmDelete
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}
    </DashboardLayout>
  );
};

export default Scribe;

// ────────────────────────────────────────────────────────────
function Stat({
  label, value, accent,
}: {
  label: string;
  value: number;
  accent: "primary" | "amber" | "emerald";
}) {
  const colors = {
    primary: "from-[#006D5B]/10 text-[#005344]",
    amber: "from-amber-100 text-amber-700",
    emerald: "from-emerald-100 text-emerald-700",
  }[accent];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
      <div
        className={`inline-block px-2 py-0.5 rounded-md bg-gradient-to-br ${colors} text-[10.5px] font-bold uppercase tracking-wider mb-2`}
      >
        {label}
      </div>
      <div className="font-['Manrope'] text-2xl font-bold text-[#191C1D] tracking-tight">
        {value}
      </div>
    </div>
  );
}

function ConsultaCard({
  consulta, onOpen, onDelete,
}: {
  consulta: Consulta;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[consulta.status];
  const Icon = cfg.icon;
  const isWorking =
    consulta.status === "transcrevendo" || consulta.status === "estruturando";
  const data = new Date(consulta.data_consulta).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hora = new Date(consulta.data_consulta).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dur = consulta.audio_duration_s
    ? `${Math.floor(consulta.audio_duration_s / 60)}min ${consulta.audio_duration_s % 60}s`
    : null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#005344]/30 hover:shadow-[0_4px_12px_-4px_rgba(0,109,91,0.12)] transition-all">
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-xl border ${cfg.cls} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${isWorking ? "animate-pulse" : ""}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] truncate">
              {consulta.paciente_alias}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${cfg.cls}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[#4a5568] mt-1 inline-flex items-center gap-2">
            <span>
              {data} · {hora}
            </span>
            {dur && (
              <>
                <span className="text-[#94a3b8]">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {dur}
                </span>
              </>
            )}
          </p>
          {consulta.status === "erro" && consulta.status_message && (
            <p className="text-xs text-red-700 mt-1 leading-relaxed line-clamp-2">
              {consulta.status_message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpen}
            disabled={consulta.status === "gravando"}
            className="px-3 h-8 rounded-lg text-xs font-semibold text-[#005344] hover:bg-[#005344]/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {consulta.status === "aprovada"
              ? "Ver"
              : consulta.status === "pendente_revisao"
                ? "Revisar"
                : "Abrir"}
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg text-[#4a5568] hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#006D5B]/10 mb-4">
        <Mic className="w-8 h-8 text-[#005344]" />
      </div>
      <h3 className="font-['Manrope'] font-bold text-xl text-[#191C1D] tracking-tight mb-2">
        Sua primeira consulta
      </h3>
      <p className="text-sm text-[#4a5568] max-w-md mx-auto leading-relaxed mb-6">
        Comece com uma consulta simples (5-10 min) pra ver a qualidade da
        transcrição e do SOAP. Lembre de obter consentimento do paciente
        antes de gravar.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm font-['Manrope'] shadow-[0_8px_24px_-8px_rgba(0,109,91,0.45)]"
      >
        <Mic className="w-4 h-4" />
        Gravar primeira consulta
      </button>
    </div>
  );
}

function ConfirmDelete({
  onCancel, onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-['Manrope'] font-bold text-lg text-[#191C1D]">
              Excluir consulta?
            </h3>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <p className="text-sm text-[#4a5568] leading-relaxed">
            Áudio, transcript, SOAP e audit log serão apagados. Não dá pra
            desfazer.
          </p>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed">
            <strong>Atenção CFM:</strong> prontuário aprovado deve ser mantido
            por 5 anos. Considere arquivar em vez de excluir.
          </p>
        </div>
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 h-10 rounded-lg text-sm font-semibold text-[#4a5568] hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
