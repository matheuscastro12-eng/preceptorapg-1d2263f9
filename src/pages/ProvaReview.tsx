import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProvaQuestoes,
  updateQuestao,
  approveAllPending,
  markProvaReady,
  getProvaPdfUrl,
  type Prova,
  type ProvaQuestao,
  type QuestaoStatus,
} from "@/hooks/useProvas";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  FileText,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Play,
  Save,
  Wand2,
} from "lucide-react";

const STATUS_PILL: Record<
  QuestaoStatus,
  { label: string; cls: string }
> = {
  pending:  { label: "Pendente",  cls: "bg-amber-50  text-amber-700  border-amber-200" },
  approved: { label: "Aprovada",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejeitada", cls: "bg-red-50    text-red-700    border-red-200" },
  edited:   { label: "Editada",   cls: "bg-blue-50   text-blue-700   border-blue-200" },
};

const ProvaReview = () => {
  const { id: provaId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prova, setProva] = useState<Prova | null>(null);
  const [questoes, setQuestoes] = useState<ProvaQuestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [filter, setFilter] = useState<"all" | QuestaoStatus>("all");
  const [search, setSearch] = useState("");
  const [showPdf, setShowPdf] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Load prova + questoes
  useEffect(() => {
    if (!provaId || !user) return;
    let alive = true;
    void (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("provas_importadas")
        .select("*")
        .eq("id", provaId)
        .maybeSingle();
      if (!alive) return;
      if (!p) {
        toast({
          title: "Prova não encontrada",
          variant: "destructive",
        });
        navigate("/provas");
        return;
      }
      setProva(p as Prova);
      if (p.pdf_storage_path) {
        const url = await getProvaPdfUrl(p.pdf_storage_path);
        if (alive) setPdfUrl(url);
      }
      const qs = await fetchProvaQuestoes(provaId);
      if (alive) {
        setQuestoes(qs);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [provaId, user, navigate, toast]);

  // Realtime: refresca questoes durante extração
  useEffect(() => {
    if (!provaId || !user) return;
    if (prova?.status !== "extracting") return;
    const interval = setInterval(async () => {
      const { data: p } = await supabase
        .from("provas_importadas")
        .select("*")
        .eq("id", provaId)
        .maybeSingle();
      if (p) setProva(p as Prova);
      if (p?.status === "reviewing" || p?.status === "ready") {
        const qs = await fetchProvaQuestoes(provaId);
        setQuestoes(qs);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [provaId, user, prova?.status]);

  const filtered = useMemo(() => {
    let qs = questoes;
    if (filter !== "all") qs = qs.filter((q) => q.status === filter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      qs = qs.filter(
        (q) =>
          q.enunciado.toLowerCase().includes(s) ||
          String(q.numero).includes(s),
      );
    }
    return qs;
  }, [questoes, filter, search]);

  const counts = useMemo(() => {
    const c = { all: questoes.length, pending: 0, approved: 0, rejected: 0, edited: 0 };
    for (const q of questoes) c[q.status]++;
    return c;
  }, [questoes]);

  const updateLocalQuestao = (id: string, patch: Partial<ProvaQuestao>) => {
    setQuestoes((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleStatusChange = async (q: ProvaQuestao, status: QuestaoStatus) => {
    const prev = q.status;
    updateLocalQuestao(q.id, { status });
    try {
      await updateQuestao(q.id, { status });
    } catch (e) {
      updateLocalQuestao(q.id, { status: prev });
      toast({
        title: "Erro ao atualizar",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    if (!provaId) return;
    setBulkSubmitting(true);
    try {
      const n = await approveAllPending(provaId);
      toast({
        title: `${n} questões aprovadas`,
        description: "Prova pronta pra simular",
      });
      const qs = await fetchProvaQuestoes(provaId);
      setQuestoes(qs);
      const { data: p } = await supabase
        .from("provas_importadas")
        .select("*")
        .eq("id", provaId)
        .maybeSingle();
      if (p) setProva(p as Prova);
    } catch (e) {
      toast({
        title: "Erro",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!provaId) return;
    if (counts.approved === 0) {
      toast({
        title: "Aprove pelo menos 1 questão",
        variant: "destructive",
      });
      return;
    }
    await markProvaReady(provaId);
    toast({ title: "Prova pronta!" });
    navigate(`/provas/${provaId}/simulado`);
  };

  if (authLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!prova) return null;

  const isWorking =
    prova.status === "uploading" || prova.status === "extracting";

  return (
    <DashboardLayout
      hideFooter
      mainClassName="p-0 max-w-none w-full flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 sticky top-0 z-10">
          <button
            onClick={() => navigate("/provas")}
            className="w-9 h-9 rounded-lg text-[#4a5568] hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-['Manrope'] font-bold text-lg text-[#191C1D] truncate tracking-[-0.01em]">
              {prova.titulo}
            </h1>
            <p className="text-xs text-[#4a5568]">
              {prova.num_alternativas} alternativas ·{" "}
              {prova.num_paginas ? `${prova.num_paginas} páginas · ` : ""}
              {counts.approved}/{counts.all} aprovadas
            </p>
          </div>

          {!isWorking && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setShowPdf((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-sm font-semibold text-[#4a5568] hover:bg-slate-50"
              >
                <FileText className="w-4 h-4" />
                {showPdf ? "Ocultar PDF" : "Mostrar PDF"}
              </button>
              {counts.pending > 0 && (
                <button
                  onClick={handleApproveAll}
                  disabled={bulkSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#191C1D] text-white text-sm font-semibold hover:bg-black disabled:opacity-50"
                >
                  {bulkSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Aprovar todas pendentes ({counts.pending})
                </button>
              )}
              <button
                onClick={handleFinalize}
                disabled={counts.approved === 0}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_4px_12px_-4px_rgba(0,109,91,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Finalizar e simular
              </button>
            </div>
          )}
        </header>

        {/* Status banner durante extração */}
        {isWorking && (
          <div className="bg-gradient-to-br from-[#005344]/8 to-[#C9A84C]/8 border-b border-[#006D5B]/20 px-6 py-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#005344] animate-spin shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#191C1D]">
                PreceptorMED processando questões…
              </p>
              <p className="text-xs text-[#4a5568]">
                Tempo médio: 30–90s. Esta página vai atualizar automaticamente
                quando terminar.
              </p>
            </div>
          </div>
        )}

        {prova.status === "failed" && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">
                Falha na extração
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                {prova.status_message ?? "Erro desconhecido"}
              </p>
            </div>
            <button
              onClick={() => navigate("/provas")}
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Workspace dual-pane */}
        {!isWorking && prova.status !== "failed" && (
          <div className="flex-1 grid md:grid-cols-2 min-h-0">
            {/* Left: PDF */}
            {showPdf && (
              <div className="hidden md:flex flex-col border-r border-slate-200 bg-slate-50 min-h-0">
                <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                    PDF original
                  </span>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#005344] hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                </div>
                <div className="flex-1 min-h-0">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      title="PDF original"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#4a5568] text-sm">
                      Carregando PDF…
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right: questoes */}
            <div className={`flex flex-col min-h-0 ${showPdf ? "" : "md:col-span-2"}`}>
              {/* Filters */}
              <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      ["all", "Todas"],
                      ["pending", "Pendentes"],
                      ["approved", "Aprovadas"],
                      ["rejected", "Rejeitadas"],
                      ["edited", "Editadas"],
                    ] as const
                  ).map(([k, lbl]) => {
                    const n = counts[k as keyof typeof counts];
                    return (
                      <button
                        key={k}
                        onClick={() => setFilter(k)}
                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                          filter === k
                            ? "bg-[#191C1D] text-white"
                            : "bg-slate-100 text-[#4a5568] hover:bg-slate-200"
                        }`}
                      >
                        {lbl}
                        <span className="font-mono opacity-70">{n}</span>
                      </button>
                    );
                  })}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar nº ou texto…"
                    className="ml-auto h-8 px-3 rounded-lg border border-slate-200 text-xs w-48 outline-none focus:border-[#006D5B]"
                  />
                </div>
              </div>

              {/* Lista de questoes */}
              <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-[#4a5568] text-sm">
                    Nenhuma questão{" "}
                    {filter === "all" ? "" : `no estado "${filter}"`}.
                  </div>
                ) : (
                  filtered.map((q) => (
                    <QuestaoCard
                      key={q.id}
                      questao={q}
                      numAlternativas={prova.num_alternativas}
                      isEditing={editingId === q.id}
                      onToggleEdit={() =>
                        setEditingId((cur) => (cur === q.id ? null : q.id))
                      }
                      onStatusChange={(s) => handleStatusChange(q, s)}
                      onSaveEdit={async (patch) => {
                        try {
                          await updateQuestao(q.id, patch);
                          updateLocalQuestao(q.id, { ...patch, status: "edited" });
                          setEditingId(null);
                          toast({ title: "Questão atualizada" });
                        } catch (e) {
                          toast({
                            title: "Erro ao salvar",
                            description: (e as Error).message,
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  ))
                )}
                {!loading && questoes.length > 0 && (
                  <div className="h-12 flex items-center justify-center text-xs text-[#94a3b8] font-mono">
                    {filtered.length} de {questoes.length}
                  </div>
                )}
              </div>

              {/* Bottom action bar (mobile) */}
              {counts.approved > 0 && (
                <div className="md:hidden px-4 py-3 border-t border-slate-200 bg-white">
                  <button
                    onClick={handleFinalize}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Finalizar e simular ({counts.approved})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProvaReview;

// ─────────────────────────────────────────────────────────────────

function QuestaoCard({
  questao,
  numAlternativas,
  isEditing,
  onToggleEdit,
  onStatusChange,
  onSaveEdit,
}: {
  questao: ProvaQuestao;
  numAlternativas: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onStatusChange: (s: QuestaoStatus) => void;
  onSaveEdit: (
    patch: Partial<
      Pick<ProvaQuestao, "enunciado" | "alternativas" | "gabarito" | "justificativa">
    >,
  ) => void;
}) {
  const [enunciado, setEnunciado] = useState(questao.enunciado);
  const [alternativas, setAlternativas] = useState(questao.alternativas);
  const [gabarito, setGabarito] = useState(questao.gabarito);
  const [justificativa, setJustificativa] = useState(
    questao.justificativa ?? "",
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEnunciado(questao.enunciado);
      setAlternativas(questao.alternativas);
      setGabarito(questao.gabarito);
      setJustificativa(questao.justificativa ?? "");
    }
  }, [isEditing, questao]);

  const pill = STATUS_PILL[questao.status];

  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-colors ${
        questao.status === "approved"
          ? "border-emerald-200"
          : questao.status === "rejected"
            ? "border-red-200"
            : questao.status === "edited"
              ? "border-blue-200"
              : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-slate-100">
        <span className="font-mono text-xs font-bold text-[#005344]">
          Q{String(questao.numero).padStart(2, "0")}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${pill.cls}`}
        >
          {pill.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
            questao.justificativa_origem === "pdf"
              ? "bg-emerald-50 text-emerald-700"
              : questao.justificativa_origem === "ia"
                ? "bg-[#C9A84C]/15 text-[#8a6f26]"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {questao.justificativa_origem === "pdf"
            ? "Just. do PDF"
            : questao.justificativa_origem === "ia"
              ? <><Sparkles className="w-3 h-3 inline" /> Just. PreceptorMED</>
              : "Sem just."}
        </span>
        {questao.pagina_origem && (
          <span className="text-[10.5px] text-[#94a3b8] font-mono ml-1">
            pg {questao.pagina_origem}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!isEditing && (
            <>
              <button
                onClick={() => onStatusChange("approved")}
                disabled={questao.status === "approved"}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
                aria-label="Aprovar"
                title="Aprovar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStatusChange("rejected")}
                disabled={questao.status === "rejected"}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label="Rejeitar"
                title="Rejeitar"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleEdit}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a5568] hover:bg-slate-100"
                aria-label="Editar"
                title="Editar"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-4">
        {!isEditing ? (
          <>
            <p className="text-sm text-[#191C1D] leading-relaxed whitespace-pre-wrap">
              {questao.enunciado}
            </p>
            <div className="mt-3 space-y-1.5">
              {questao.alternativas.map((alt, i) => {
                const letra = String.fromCharCode(65 + i);
                const correta = letra === questao.gabarito;
                return (
                  <div
                    key={i}
                    className={`flex gap-2 text-sm rounded-lg px-2.5 py-1.5 ${
                      correta
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <span
                      className={`shrink-0 font-mono text-xs font-bold w-6 ${
                        correta ? "text-emerald-700" : "text-[#94a3b8]"
                      }`}
                    >
                      {letra}
                    </span>
                    <span className="text-[#191C1D] leading-relaxed">
                      {alt}
                    </span>
                    {correta && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>

            {questao.justificativa && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs font-semibold text-[#005344] inline-flex items-center gap-1 hover:underline"
                >
                  {expanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {expanded ? "Ocultar justificativa" : "Ver justificativa"}
                </button>
                {expanded && (
                  <div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-[#005344]/4 to-[#C9A84C]/4 border-l-3 border-[#C9A84C] text-sm text-[#191C1D] leading-relaxed whitespace-pre-wrap">
                    {questao.justificativa}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Edit mode
          <div className="space-y-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                Enunciado
              </label>
              <textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-lg border border-slate-200 text-sm leading-relaxed font-['DM_Sans'] outline-none focus:border-[#006D5B] focus:ring-2 focus:ring-[#006D5B]/15 resize-y"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                Alternativas
              </label>
              <div className="space-y-1.5">
                {alternativas.map((alt, i) => {
                  const letra = String.fromCharCode(65 + i);
                  return (
                    <div key={i} className="flex gap-2">
                      <button
                        onClick={() => setGabarito(letra)}
                        className={`shrink-0 w-9 h-9 rounded-lg font-mono font-bold text-sm border-2 ${
                          gabarito === letra
                            ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-[#94a3b8] hover:border-slate-300"
                        }`}
                        title={`Marcar ${letra} como gabarito`}
                      >
                        {letra}
                      </button>
                      <input
                        value={alt}
                        onChange={(e) => {
                          const next = [...alternativas];
                          next[i] = e.target.value;
                          setAlternativas(next);
                        }}
                        className="flex-1 px-3 h-9 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#006D5B]"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-[#4a5568] mt-1.5">
                Clique na letra pra definir o gabarito (atual: <strong>{gabarito}</strong>).
              </p>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                Justificativa
              </label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                placeholder="Texto explicativo (opcional)"
                className="w-full p-3 rounded-lg border border-slate-200 text-sm leading-relaxed font-['DM_Sans'] outline-none focus:border-[#006D5B] focus:ring-2 focus:ring-[#006D5B]/15 resize-y"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onToggleEdit}
                className="px-3 h-9 rounded-lg text-xs font-semibold text-[#4a5568] hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Descartar
              </button>
              <button
                onClick={() =>
                  onSaveEdit({
                    enunciado: enunciado.trim(),
                    alternativas: alternativas.slice(0, numAlternativas),
                    gabarito,
                    justificativa: justificativa.trim() || null as unknown as string,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#191C1D] text-white text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar edição
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
