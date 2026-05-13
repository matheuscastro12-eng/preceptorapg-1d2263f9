import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useConsulta,
  getConsultaAudioUrl,
  retryTranscription,
  retrySoapGeneration,
  type ConsultaSoap,
} from "@/hooks/useScribe";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft, Loader2, Sparkles, AlertTriangle, Save, Check,
  Mic, FileText, ShieldCheck, Stethoscope, ListChecks, RotateCcw,
  Download, History,
} from "lucide-react";

const ScribeReview = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("scribe");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { consulta, loading: loadingConsulta, refresh } = useConsulta(id);

  const [audioUrl, setAudioUrl] = useState<string>("");
  const [draftTranscript, setDraftTranscript] = useState<string>("");
  const [draftSoap, setDraftSoap] = useState<ConsultaSoap>({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [reviewedSections, setReviewedSections] = useState({
    S: false,
    O: false,
    A: false,
    P: false,
  });
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // Tempo decorrido em estado de processamento (pra detectar "stuck")
  const [stuckSeconds, setStuckSeconds] = useState(0);

  // Hidrata draft quando consulta chega
  useEffect(() => {
    if (consulta) {
      setDraftTranscript(consulta.transcript ?? "");
      setDraftSoap(consulta.soap_jsonb ?? {});
    }
  }, [consulta?.id, consulta?.status]);

  // Carrega URL assinada do áudio
  useEffect(() => {
    if (!consulta?.audio_storage_path) return;
    void (async () => {
      const url = await getConsultaAudioUrl(consulta.audio_storage_path!);
      setAudioUrl(url);
    })();
  }, [consulta?.audio_storage_path]);

  // Detecta consulta travada em status de processamento. Conta segundos
  // desde que entrou em 'transcrevendo' ou 'estruturando'. Reseta ao
  // mudar de status.
  useEffect(() => {
    if (
      consulta?.status !== "transcrevendo" &&
      consulta?.status !== "estruturando"
    ) {
      setStuckSeconds(0);
      return;
    }
    setStuckSeconds(0);
    const interval = window.setInterval(() => {
      setStuckSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [consulta?.status]);

  if (authLoading || loading || loadingConsulta) {
    return <PageSkeleton variant="dashboard" />;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeature) return <Navigate to="/scribe" replace />;
  if (!consulta) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Consulta não encontrada
          </h1>
          <button
            onClick={() => navigate("/scribe")}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isProcessing =
    consulta.status === "transcrevendo" || consulta.status === "estruturando";
  const isApproved = consulta.status === "aprovada";

  const handleRetry = async () => {
    if (!consulta) return;
    setRetrying(true);
    try {
      // Se ja temos transcript, so refaz SOAP. Caso contrario, refaz tudo.
      if (consulta.transcript && consulta.transcript.length > 20) {
        await retrySoapGeneration(consulta.id);
        toast({ title: "Estruturação SOAP reiniciada" });
      } else {
        await retryTranscription(consulta.id);
        toast({ title: "Transcrição reiniciada" });
      }
      void refresh();
    } catch (e) {
      toast({
        title: "Erro ao reprocessar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleExportPDF = async () => {
    if (!consulta) return;
    setExporting(true);
    try {
      const { exportConsultaPDF } = await import("@/utils/pdfExport");
      await exportConsultaPDF({
        consulta: {
          ...consulta,
          transcript: draftTranscript,
          soap_jsonb: draftSoap,
        },
        medicoNome: user?.user_metadata?.full_name ?? user?.email ?? "Médico",
        medicoCrm: user?.user_metadata?.crm ?? "",
      });
      toast({ title: "PDF exportado" });
    } catch (e) {
      toast({
        title: "Erro ao exportar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (!consulta) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("consultas")
        .update({
          transcript: draftTranscript,
          soap_jsonb: draftSoap,
        })
        .eq("id", consulta.id);
      if (error) throw error;
      toast({ title: "Salvo" });
      void refresh();
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const allReviewed =
    reviewedSections.S &&
    reviewedSections.O &&
    reviewedSections.A &&
    reviewedSections.P;

  const handleApprove = async () => {
    if (!allReviewed) {
      toast({
        title: "Revise as 3 seções",
        description: "Marque S/O/A como revisados antes de aprovar.",
        variant: "destructive",
      });
      return;
    }
    setValidating(true);
    try {
      // Salva quaisquer edicoes pendentes primeiro
      await supabase
        .from("consultas")
        .update({
          transcript: draftTranscript,
          soap_jsonb: draftSoap,
        })
        .eq("id", consulta.id);

      // Computa signature simples (SHA-256 do conteudo + timestamp).
      // Edge function dedicada (validate-consulta) virá em Phase 4 com HMAC.
      const ts = new Date().toISOString();
      const payload = JSON.stringify({ transcript: draftTranscript, soap: draftSoap, ts });
      const sig = await sha256Hex(payload);

      const { error } = await supabase
        .from("consultas")
        .update({
          status: "aprovada",
          validated_by_md: user.id,
          validated_at: ts,
          validation_signature: sig,
        })
        .eq("id", consulta.id);
      if (error) throw error;

      toast({ title: "Consulta aprovada e assinada" });
      void refresh();
    } catch (e) {
      toast({
        title: "Erro ao aprovar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <DashboardLayout hideFooter mainClassName="p-0 max-w-none w-full flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 sticky top-0 z-10">
          <button
            onClick={() => navigate("/scribe")}
            className="w-9 h-9 rounded-lg text-[#4a5568] hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-['Manrope'] font-bold text-base text-[#191C1D] truncate flex items-center gap-2">
              {consulta.paciente_alias}
              {isApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Assinada
                </span>
              )}
            </h1>
            <p className="text-xs text-[#4a5568]">
              {new Date(consulta.data_consulta).toLocaleString("pt-BR")}
              {consulta.audio_duration_s && ` · ${Math.floor(consulta.audio_duration_s / 60)}min ${consulta.audio_duration_s % 60}s`}
            </p>
          </div>
          {/* Auditoria — sempre visivel */}
          <button
            onClick={() => navigate(`/scribe/${consulta.id}/audit`)}
            title="Log de auditoria"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#4a5568] hover:bg-slate-100"
          >
            <History className="w-4 h-4" />
          </button>
          {/* Export PDF — habilitado mesmo em rascunho (com marca d'agua) */}
          <button
            onClick={handleExportPDF}
            disabled={exporting || isProcessing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-sm font-semibold text-[#4a5568] hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
          {!isApproved && (
            <>
              <button
                onClick={handleSave}
                disabled={saving || isProcessing}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-sm font-semibold text-[#4a5568] hover:bg-slate-50 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
              <button
                onClick={handleApprove}
                disabled={validating || !allReviewed || isProcessing}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_4px_12px_-4px_rgba(0,109,91,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Aprovar e assinar
              </button>
            </>
          )}
        </header>

        {/* Status banner */}
        {isProcessing && (
          <div className="bg-gradient-to-br from-[#005344]/8 to-[#C9A84C]/8 border-b border-[#006D5B]/20 px-6 py-4 flex items-center gap-3 flex-wrap">
            <Loader2 className="w-5 h-5 text-[#005344] animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#191C1D] inline-flex items-center gap-2">
                {consulta.status === "transcrevendo"
                  ? "PreceptorMED transcrevendo o áudio…"
                  : "PreceptorMED estruturando em SOAP…"}
                <span className="font-mono text-[11px] text-[#4a5568]">
                  {Math.floor(stuckSeconds / 60)}:{String(stuckSeconds % 60).padStart(2, "0")}
                </span>
              </p>
              <p className="text-xs text-[#4a5568]">
                {stuckSeconds < 60
                  ? "Áudios curtos: 20-40s. Áudios longos: 1-2min."
                  : stuckSeconds < 120
                    ? "Está demorando um pouco mais que o normal. Aguarde mais 1 min."
                    : "Algo pode ter travado. Tente reprocessar."}
              </p>
            </div>
            {stuckSeconds >= 90 && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#191C1D] text-white text-xs font-bold disabled:opacity-50"
              >
                {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Reprocessar
              </button>
            )}
          </div>
        )}
        {consulta.status === "erro" && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">Erro no processamento</p>
              <p className="text-xs text-red-700 mt-0.5">
                {consulta.status_message ?? "Erro desconhecido"}
              </p>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Tentar novamente
            </button>
          </div>
        )}

        {/* Banner responsabilidade */}
        {!isApproved && consulta.status !== "erro" && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Você é responsável pelo conteúdo final.</strong> O PreceptorMED
              produz rascunho a partir da transcrição. Revise cada campo,
              edite o que precisar, marque as seções como revisadas e assine.
            </p>
          </div>
        )}

        {/* Workspace dual-pane */}
        <div className="flex-1 grid lg:grid-cols-2 min-h-0">
          {/* Left: audio + transcript */}
          <div className="flex flex-col border-r border-slate-200 min-h-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#005344]" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                Áudio + transcrição
              </span>
              {consulta.audio_purged_at && (
                <span className="ml-auto text-[10px] text-[#94a3b8] inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Áudio purgado em {new Date(consulta.audio_purged_at).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {audioUrl && !consulta.audio_purged_at && (
                <audio src={audioUrl} controls className="w-full" />
              )}
              {!consulta.transcript && isProcessing ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[#005344] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-[#4a5568]">Transcrição em andamento…</p>
                </div>
              ) : (
                <textarea
                  value={draftTranscript}
                  onChange={(e) => setDraftTranscript(e.target.value)}
                  disabled={isApproved}
                  rows={20}
                  placeholder="Transcrição aparecerá aqui…"
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm font-mono leading-relaxed outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 resize-y"
                />
              )}
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Edite o transcript se o PreceptorMED errou termos ou nomes. As alterações
                são salvas ao clicar "Salvar" ou "Aprovar".
              </p>
            </div>
          </div>

          {/* Right: SOAP */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#005344]" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                Prontuário SOAP
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <SoapSection
                title="S — Subjetivo"
                disabled={isApproved}
                reviewed={reviewedSections.S}
                onToggleReviewed={(v) =>
                  setReviewedSections({ ...reviewedSections, S: v })
                }
              >
                <FormField
                  label="Queixa principal"
                  value={draftSoap.S?.queixa_principal ?? ""}
                  onChange={(v) =>
                    setDraftSoap({
                      ...draftSoap,
                      S: { ...draftSoap.S, queixa_principal: v },
                    })
                  }
                  disabled={isApproved}
                />
                <FormField
                  label="HDA"
                  multiline
                  rows={4}
                  value={draftSoap.S?.hda ?? ""}
                  onChange={(v) =>
                    setDraftSoap({ ...draftSoap, S: { ...draftSoap.S, hda: v } })
                  }
                  disabled={isApproved}
                />
                <FormField
                  label="Antecedentes pessoais"
                  multiline
                  rows={2}
                  value={draftSoap.S?.antecedentes_pessoais ?? ""}
                  onChange={(v) =>
                    setDraftSoap({
                      ...draftSoap,
                      S: { ...draftSoap.S, antecedentes_pessoais: v },
                    })
                  }
                  disabled={isApproved}
                />
                <FormField
                  label="Antecedentes familiares"
                  multiline
                  rows={2}
                  value={draftSoap.S?.antecedentes_familiares ?? ""}
                  onChange={(v) =>
                    setDraftSoap({
                      ...draftSoap,
                      S: { ...draftSoap.S, antecedentes_familiares: v },
                    })
                  }
                  disabled={isApproved}
                />
                <FormField
                  label="Hábitos"
                  multiline
                  rows={2}
                  value={draftSoap.S?.habitos ?? ""}
                  onChange={(v) =>
                    setDraftSoap({ ...draftSoap, S: { ...draftSoap.S, habitos: v } })
                  }
                  disabled={isApproved}
                />
                <ListField
                  label="Medicações em uso"
                  values={draftSoap.S?.medicacoes_em_uso ?? []}
                  onChange={(arr) =>
                    setDraftSoap({
                      ...draftSoap,
                      S: { ...draftSoap.S, medicacoes_em_uso: arr },
                    })
                  }
                  disabled={isApproved}
                />
                <ListField
                  label="Alergias"
                  values={draftSoap.S?.alergias ?? []}
                  onChange={(arr) =>
                    setDraftSoap({ ...draftSoap, S: { ...draftSoap.S, alergias: arr } })
                  }
                  disabled={isApproved}
                />
              </SoapSection>

              <SoapSection
                title="O — Objetivo"
                disabled={isApproved}
                reviewed={reviewedSections.O}
                onToggleReviewed={(v) =>
                  setReviewedSections({ ...reviewedSections, O: v })
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { k: "pa", label: "PA" },
                    { k: "fc", label: "FC" },
                    { k: "fr", label: "FR" },
                    { k: "temperatura", label: "T" },
                    { k: "sato2", label: "SatO₂" },
                    { k: "peso", label: "Peso" },
                    { k: "altura", label: "Altura" },
                  ].map((sv) => (
                    <FormField
                      key={sv.k}
                      label={sv.label}
                      compact
                      value={
                        ((draftSoap.O?.sinais_vitais ?? {}) as Record<string, string>)[sv.k] ?? ""
                      }
                      onChange={(v) =>
                        setDraftSoap({
                          ...draftSoap,
                          O: {
                            ...draftSoap.O,
                            sinais_vitais: {
                              ...(draftSoap.O?.sinais_vitais ?? {}),
                              [sv.k]: v,
                            },
                          },
                        })
                      }
                      disabled={isApproved}
                    />
                  ))}
                </div>
                <FormField
                  label="Exame físico geral"
                  multiline
                  rows={3}
                  value={draftSoap.O?.exame_fisico_geral ?? ""}
                  onChange={(v) =>
                    setDraftSoap({
                      ...draftSoap,
                      O: { ...draftSoap.O, exame_fisico_geral: v },
                    })
                  }
                  disabled={isApproved}
                />
                {/* Exame físico segmentar (lista) */}
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Exame físico segmentar
                  </label>
                  <div className="space-y-1.5">
                    {(draftSoap.O?.exame_fisico_segmentar ?? []).map((seg, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={seg.segmento ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.O?.exame_fisico_segmentar ?? [])];
                            arr[i] = { ...arr[i], segmento: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              O: { ...draftSoap.O, exame_fisico_segmentar: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Segmento"
                          className="w-32 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                        <input
                          value={seg.achados ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.O?.exame_fisico_segmentar ?? [])];
                            arr[i] = { ...arr[i], achados: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              O: { ...draftSoap.O, exame_fisico_segmentar: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Achados"
                          className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                      </div>
                    ))}
                    {!isApproved && (
                      <button
                        onClick={() =>
                          setDraftSoap({
                            ...draftSoap,
                            O: {
                              ...draftSoap.O,
                              exame_fisico_segmentar: [
                                ...(draftSoap.O?.exame_fisico_segmentar ?? []),
                                { segmento: "", achados: "" },
                              ],
                            },
                          })
                        }
                        className="text-xs font-semibold text-[#005344] hover:underline"
                      >
                        + Adicionar segmento
                      </button>
                    )}
                  </div>
                </div>
              </SoapSection>

              <SoapSection
                title="A — Avaliação"
                disabled={isApproved}
                reviewed={reviewedSections.A}
                onToggleReviewed={(v) =>
                  setReviewedSections({ ...reviewedSections, A: v })
                }
              >
                {/* Hipoteses diagnosticas */}
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Hipóteses diagnósticas
                  </label>
                  <div className="space-y-1.5">
                    {(draftSoap.A?.hipoteses_diagnosticas ?? []).map((hd, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={hd.cid ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.A?.hipoteses_diagnosticas ?? [])];
                            arr[i] = { ...arr[i], cid: e.target.value.toUpperCase() };
                            setDraftSoap({
                              ...draftSoap,
                              A: { ...draftSoap.A, hipoteses_diagnosticas: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="CID"
                          className="w-20 h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#005344]"
                        />
                        <input
                          value={hd.descricao ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.A?.hipoteses_diagnosticas ?? [])];
                            arr[i] = { ...arr[i], descricao: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              A: { ...draftSoap.A, hipoteses_diagnosticas: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Hipótese"
                          className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                        <input
                          value={hd.probabilidade ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.A?.hipoteses_diagnosticas ?? [])];
                            arr[i] = { ...arr[i], probabilidade: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              A: { ...draftSoap.A, hipoteses_diagnosticas: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Prob."
                          className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                      </div>
                    ))}
                    {!isApproved && (
                      <button
                        onClick={() =>
                          setDraftSoap({
                            ...draftSoap,
                            A: {
                              ...draftSoap.A,
                              hipoteses_diagnosticas: [
                                ...(draftSoap.A?.hipoteses_diagnosticas ?? []),
                                { cid: "", descricao: "", probabilidade: "" },
                              ],
                            },
                          })
                        }
                        className="text-xs font-semibold text-[#005344] hover:underline"
                      >
                        + Adicionar hipótese
                      </button>
                    )}
                  </div>
                </div>
                <FormField
                  label="Comentário / raciocínio clínico"
                  multiline
                  rows={3}
                  value={draftSoap.A?.comentario ?? ""}
                  onChange={(v) =>
                    setDraftSoap({
                      ...draftSoap,
                      A: { ...draftSoap.A, comentario: v },
                    })
                  }
                  disabled={isApproved}
                />
              </SoapSection>

              {/* P — Plano */}
              <SoapSection
                title="P — Plano"
                disabled={isApproved}
                reviewed={reviewedSections.P}
                onToggleReviewed={(v) =>
                  setReviewedSections({ ...reviewedSections, P: v })
                }
              >
                <FormField
                  label="Conduta"
                  multiline
                  rows={3}
                  value={draftSoap.P?.conduta ?? ""}
                  onChange={(v) =>
                    setDraftSoap({ ...draftSoap, P: { ...draftSoap.P, conduta: v } })
                  }
                  disabled={isApproved}
                />
                <ListField
                  label="Exames solicitados"
                  values={draftSoap.P?.exames_solicitados ?? []}
                  onChange={(arr) =>
                    setDraftSoap({
                      ...draftSoap,
                      P: { ...draftSoap.P, exames_solicitados: arr },
                    })
                  }
                  disabled={isApproved}
                />

                {/* Prescrição rascunho */}
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Prescrição (rascunho — revisar antes de assinar)
                  </label>
                  <div className="space-y-2">
                    {(draftSoap.P?.prescricao_rascunho ?? []).map((rx, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1.5"
                      >
                        <div className="flex gap-2">
                          <input
                            value={rx.medicamento ?? ""}
                            onChange={(e) => {
                              const arr = [...(draftSoap.P?.prescricao_rascunho ?? [])];
                              arr[i] = { ...arr[i], medicamento: e.target.value };
                              setDraftSoap({
                                ...draftSoap,
                                P: { ...draftSoap.P, prescricao_rascunho: arr },
                              });
                            }}
                            disabled={isApproved}
                            placeholder="Medicamento"
                            className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#005344]"
                          />
                          <input
                            value={rx.duracao ?? ""}
                            onChange={(e) => {
                              const arr = [...(draftSoap.P?.prescricao_rascunho ?? [])];
                              arr[i] = { ...arr[i], duracao: e.target.value };
                              setDraftSoap({
                                ...draftSoap,
                                P: { ...draftSoap.P, prescricao_rascunho: arr },
                              });
                            }}
                            disabled={isApproved}
                            placeholder="Duração"
                            className="w-32 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                          />
                          {!isApproved && (
                            <button
                              onClick={() => {
                                const arr = (draftSoap.P?.prescricao_rascunho ?? []).filter(
                                  (_, idx) => idx !== i,
                                );
                                setDraftSoap({
                                  ...draftSoap,
                                  P: { ...draftSoap.P, prescricao_rascunho: arr },
                                });
                              }}
                              className="w-9 h-9 rounded-lg text-[#4a5568] hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          value={rx.posologia ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.P?.prescricao_rascunho ?? [])];
                            arr[i] = { ...arr[i], posologia: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              P: { ...draftSoap.P, prescricao_rascunho: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Posologia"
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                        <input
                          value={rx.observacoes ?? ""}
                          onChange={(e) => {
                            const arr = [...(draftSoap.P?.prescricao_rascunho ?? [])];
                            arr[i] = { ...arr[i], observacoes: e.target.value };
                            setDraftSoap({
                              ...draftSoap,
                              P: { ...draftSoap.P, prescricao_rascunho: arr },
                            });
                          }}
                          disabled={isApproved}
                          placeholder="Observações (opcional)"
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
                        />
                      </div>
                    ))}
                    {!isApproved && (
                      <button
                        onClick={() =>
                          setDraftSoap({
                            ...draftSoap,
                            P: {
                              ...draftSoap.P,
                              prescricao_rascunho: [
                                ...(draftSoap.P?.prescricao_rascunho ?? []),
                                { medicamento: "", posologia: "", duracao: "", observacoes: "" },
                              ],
                            },
                          })
                        }
                        className="text-xs font-semibold text-[#005344] hover:underline"
                      >
                        + Adicionar medicamento
                      </button>
                    )}
                  </div>
                  <p className="text-[10.5px] text-amber-700 mt-1.5 leading-relaxed">
                    <strong>Rascunho gerado por PreceptorMED.</strong> O médico responsável deve
                    revisar dose, frequência e duração de cada item antes de prescrever.
                  </p>
                </div>

                <FormField
                  label="Orientações ao paciente"
                  multiline
                  rows={3}
                  value={draftSoap.P?.orientacoes ?? ""}
                  onChange={(v) =>
                    setDraftSoap({ ...draftSoap, P: { ...draftSoap.P, orientacoes: v } })
                  }
                  disabled={isApproved}
                />
                <FormField
                  label="Retorno"
                  value={draftSoap.P?.retorno ?? ""}
                  onChange={(v) =>
                    setDraftSoap({ ...draftSoap, P: { ...draftSoap.P, retorno: v } })
                  }
                  disabled={isApproved}
                />
              </SoapSection>

              {/* Bottom: validation status */}
              {!isApproved && (
                <div className="rounded-xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border-2 border-[#C9A84C]/30 p-4">
                  <p className="text-xs font-bold text-[#191C1D] mb-2 inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#005344]" />
                    Confirmação para assinatura
                  </p>
                  <p className="text-xs text-[#4a5568] leading-relaxed mb-3">
                    Marque cada seção que você revisou. Aprovação requer S, O,
                    A e P todos confirmados.
                  </p>
                  <div className="space-y-1">
                    {(["S", "O", "A", "P"] as const).map((k) => (
                      <label key={k} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviewedSections[k]}
                          onChange={(e) =>
                            setReviewedSections({
                              ...reviewedSections,
                              [k]: e.target.checked,
                            })
                          }
                          className="mt-0.5 w-4 h-4 accent-[#005344]"
                        />
                        <span className="text-xs text-[#191C1D]">
                          Li, revisei e concordo com a seção <strong>{k}</strong>.
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isApproved && (
                <div className="rounded-xl bg-emerald-50 border-2 border-emerald-200 p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Prontuário assinado eletronicamente
                    </p>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Aprovado em {new Date(consulta.validated_at!).toLocaleString("pt-BR")}.
                      Hash da assinatura:{" "}
                      <code className="font-mono text-[10px] bg-emerald-100 px-1 py-0.5 rounded">
                        {consulta.validation_signature?.slice(0, 16)}…
                      </code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScribeReview;

// ────────────────────────────────────────────────────────────
function SoapSection({
  title, disabled, reviewed, onToggleReviewed, children,
}: {
  title: string;
  disabled: boolean;
  reviewed: boolean;
  onToggleReviewed: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white rounded-2xl border-2 transition-colors ${
        reviewed ? "border-emerald-200" : "border-slate-200"
      }`}
    >
      <header className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <h3 className="font-['Manrope'] font-bold text-sm text-[#191C1D] flex-1">
          {title}
        </h3>
        {!disabled && (
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => onToggleReviewed(e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-600"
            />
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#4a5568]">
              Revisado
            </span>
          </label>
        )}
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

function FormField({
  label, value, onChange, disabled, multiline, rows = 1, compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  compact?: boolean;
}) {
  return (
    <div>
      <label
        className={`block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] ${compact ? "mb-1" : "mb-1.5"}`}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm leading-relaxed outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 resize-y disabled:bg-slate-50"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full ${compact ? "h-8 text-xs" : "h-10"} px-3 rounded-lg border border-slate-200 outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 disabled:bg-slate-50`}
        />
      )}
    </div>
  );
}

function ListField({
  label, values, onChange, disabled,
}: {
  label: string;
  values: string[];
  onChange: (arr: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
        {label}
      </label>
      <div className="space-y-1.5">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => {
                const arr = [...values];
                arr[i] = e.target.value;
                onChange(arr);
              }}
              disabled={disabled}
              className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#005344]"
            />
            {!disabled && (
              <button
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="w-9 h-9 rounded-lg text-[#4a5568] hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            onClick={() => onChange([...values, ""])}
            className="text-xs font-semibold text-[#005344] hover:underline"
          >
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
