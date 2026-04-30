import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { useConsulta } from "@/hooks/useScribe";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft, History, Shield, FileText, Download,
  Eye, ShieldCheck, AlertTriangle,
} from "lucide-react";

interface AuditEntry {
  id: string;
  consulta_id: string;
  user_id: string | null;
  action: string;
  before_jsonb: unknown;
  after_jsonb: unknown;
  ip: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof History; color: string }
> = {
  create: { label: "Consulta criada", icon: FileText, color: "text-slate-600" },
  update: { label: "Atualização", icon: History, color: "text-slate-600" },
  status_change: { label: "Mudança de status", icon: History, color: "text-blue-600" },
  validate: { label: "Aprovada e assinada", icon: ShieldCheck, color: "text-emerald-600" },
  export_pdf: { label: "Exportada como PDF", icon: Download, color: "text-slate-600" },
  view_audio: { label: "Áudio acessado", icon: Eye, color: "text-slate-600" },
  delete_audio: { label: "Áudio purgado", icon: AlertTriangle, color: "text-amber-600" },
};

const ScribeAudit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("scribe");
  const navigate = useNavigate();
  const { consulta, loading: loadingConsulta } = useConsulta(id);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("consulta_audit_log")
        .select("*")
        .eq("consulta_id", id)
        .order("created_at", { ascending: false });
      if (alive) {
        setEntries((data ?? []) as AuditEntry[]);
        setLoadingEntries(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (authLoading || loading || loadingConsulta || loadingEntries) {
    return <PageSkeleton variant="dashboard" />;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeature) return <Navigate to="/scribe" replace />;
  if (!consulta) return <Navigate to="/scribe" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/scribe/${id}/review`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar pra consulta
        </button>

        <div className="mb-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Auditoria · LGPD/CFM
          </p>
          <h1 className="font-['Manrope'] font-bold text-2xl tracking-[-0.02em] text-[#191C1D]">
            Histórico da consulta
          </h1>
          <p className="text-sm text-[#4a5568] mt-2">
            <strong>{consulta.paciente_alias}</strong> · {new Date(consulta.data_consulta).toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Info compliance */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6 flex items-start gap-3">
          <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            Toda alteração na consulta é registrada automaticamente (trigger DB).
            O log é append-only e mantido conforme política de retenção CFM
            (mínimo 5 anos para prontuário aprovado).
          </p>
        </div>

        {/* Timeline */}
        {entries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-[#94a3b8]">
            Sem entradas no log ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e, i) => {
              const cfg = ACTION_CONFIG[e.action] ?? {
                label: e.action,
                icon: History,
                color: "text-slate-500",
              };
              const Icon = cfg.icon;
              const isLast = i === entries.length - 1;
              return (
                <div key={e.id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-5 top-10 w-px h-full bg-slate-200" />
                  )}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-['Manrope'] font-bold text-sm text-[#191C1D]">
                          {cfg.label}
                        </h3>
                        <span className="text-[11px] font-mono text-[#94a3b8]">
                          {new Date(e.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {e.action === "status_change" && (
                        <p className="text-xs text-[#4a5568]">
                          De{" "}
                          <strong>
                            {(e.before_jsonb as { status?: string })?.status ?? "?"}
                          </strong>{" "}
                          para{" "}
                          <strong>
                            {(e.after_jsonb as { status?: string })?.status ?? "?"}
                          </strong>
                        </p>
                      )}
                      {e.action === "validate" && (
                        <p className="text-xs text-[#4a5568]">
                          Hash da assinatura:{" "}
                          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {(e.after_jsonb as { validation_signature?: string })?.validation_signature?.slice(0, 16)}…
                          </code>
                        </p>
                      )}
                      {e.notes && (
                        <p className="text-xs text-[#4a5568] mt-1">{e.notes}</p>
                      )}
                      {e.action === "create" && (
                        <p className="text-xs text-[#4a5568]">
                          Identificador: <strong>{consulta.paciente_alias}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ScribeAudit;
