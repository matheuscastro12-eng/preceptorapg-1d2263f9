import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import {
  Pill, ListChecks, Sparkles, Loader2, Check, X,
  Plus, Trash2, RotateCcw, ExternalLink, ArrowLeft,
  AlertTriangle,
} from "lucide-react";

type Mode = "drug" | "protocol";

interface DrugRow {
  id: string;
  slug: string;
  nome_principio: string;
  nome_comercial: string[] | null;
  classe_terapeutica: string | null;
  published: boolean;
  raw_extraction: unknown;
  fonte_url: string | null;
  created_at: string;
}

interface ProtocolRow {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  resumo: string | null;
  fonte: string | null;
  fonte_url: string | null;
  published: boolean;
  raw_extraction: unknown;
  created_at: string;
}

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wb-ai-structure`;

const WhitebookAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("drug");
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [protocols, setProtocols] = useState<ProtocolRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state pra adicionar via PreceptorMED
  const [rawText, setRawText] = useState("");
  const [fonteUrl, setFonteUrl] = useState("");
  const [fonte, setFonte] = useState("");
  const [structuring, setStructuring] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"draft" | "published" | "all">("draft");

  const refresh = async () => {
    setLoading(true);
    const [drugsRes, protocolsRes] = await Promise.all([
      supabase
        .from("wb_drugs")
        .select("id, slug, nome_principio, nome_comercial, classe_terapeutica, published, raw_extraction, fonte_url, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("wb_protocols")
        .select("id, slug, titulo, categoria, resumo, fonte, fonte_url, published, raw_extraction, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setDrugs((drugsRes.data ?? []) as DrugRow[]);
    setProtocols((protocolsRes.data ?? []) as ProtocolRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin]);

  if (authLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/menu" replace />;

  const handleStructure = async () => {
    if (rawText.trim().length < 100) {
      toast({
        title: "Texto curto",
        description: "Cole pelo menos 100 caracteres da fonte.",
        variant: "destructive",
      });
      return;
    }
    setStructuring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          raw_text: rawText,
          fonte_url: fonteUrl.trim() || undefined,
          fonte: fonte.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
      toast({
        title: "Estruturado",
        description: `${mode === "drug" ? "Droga" : "Protocolo"} criada como rascunho. Revise antes de publicar.`,
      });
      setRawText("");
      setFonteUrl("");
      setFonte("");
      await refresh();
      setEditingId(json.id);
    } catch (e) {
      toast({
        title: "Erro ao estruturar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setStructuring(false);
    }
  };

  const togglePublish = async (
    table: "wb_drugs" | "wb_protocols",
    id: string,
    nextPublished: boolean,
  ) => {
    const { error } = await supabase
      .from(table)
      .update({
        published: nextPublished,
        reviewed_by: nextPublished ? user.id : null,
        reviewed_at: nextPublished ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: nextPublished ? "Publicado" : "Despublicado" });
    await refresh();
  };

  const handleDelete = async (
    table: "wb_drugs" | "wb_protocols",
    id: string,
    label: string,
  ) => {
    if (!confirm(`Apagar "${label}"? Não dá pra desfazer.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Apagado" });
    if (editingId === id) setEditingId(null);
    await refresh();
  };

  const visibleDrugs = useMemo(() => {
    if (filter === "all") return drugs;
    if (filter === "draft") return drugs.filter((d) => !d.published);
    return drugs.filter((d) => d.published);
  }, [drugs, filter]);

  const visibleProtocols = useMemo(() => {
    if (filter === "all") return protocols;
    if (filter === "draft") return protocols.filter((p) => !p.published);
    return protocols.filter((p) => p.published);
  }, [protocols, filter]);

  const counts = {
    drugs: { all: drugs.length, draft: drugs.filter((d) => !d.published).length },
    protocols: { all: protocols.length, draft: protocols.filter((p) => !p.published).length },
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Whitebook · Admin
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D]">
            Curadoria de conteúdo
          </h1>
          <p className="text-sm text-[#4a5568] mt-2 max-w-[60ch]">
            Cole texto bruto de fonte pública (bula ANVISA, diretriz, PCDT) — PreceptorMED
            estrutura → você revisa → publica. Workflow padrão de provas
            importadas.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("drug")}
            className={`inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold border-2 transition-all ${
              mode === "drug"
                ? "bg-[#005344] text-white border-[#005344]"
                : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
            }`}
          >
            <Pill className="w-4 h-4" />
            Droga
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${mode === "drug" ? "bg-white/15" : "bg-slate-100"}`}>
              {counts.drugs.draft}/{counts.drugs.all}
            </span>
          </button>
          <button
            onClick={() => setMode("protocol")}
            className={`inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold border-2 transition-all ${
              mode === "protocol"
                ? "bg-[#005344] text-white border-[#005344]"
                : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Protocolo
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${mode === "protocol" ? "bg-white/15" : "bg-slate-100"}`}>
              {counts.protocols.draft}/{counts.protocols.all}
            </span>
          </button>
        </div>

        {/* Form: estruturar via PreceptorMED */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#8a6f26]" />
            <h2 className="text-sm font-bold text-[#191C1D]">
              Adicionar via PreceptorMED — modo {mode === "drug" ? "droga" : "protocolo"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              value={fonte}
              onChange={(e) => setFonte(e.target.value.slice(0, 200))}
              placeholder="Fonte (ex: Bula ANVISA, Diretriz SBC 2024)"
              disabled={structuring}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#005344]"
            />
            <input
              value={fonteUrl}
              onChange={(e) => setFonteUrl(e.target.value)}
              placeholder="URL da fonte (opcional)"
              disabled={structuring}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#005344]"
            />
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={structuring}
            rows={8}
            placeholder={
              mode === "drug"
                ? "Cole o texto da bula ANVISA aqui (mínimo 100 caracteres). O PreceptorMED extrai posologia, ajustes, interações, etc."
                : "Cole o texto da diretriz aqui (mínimo 100 caracteres). O PreceptorMED extrai critérios diagnósticos, conduta passo-a-passo, exames, red flags."
            }
            className="w-full p-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 resize-y"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#94a3b8] font-mono">
              {rawText.length} chars
            </span>
            <button
              onClick={handleStructure}
              disabled={structuring || rawText.trim().length < 100}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {structuring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PreceptorMED processando…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  Estruturar com PreceptorMED
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-2 leading-relaxed">
            <strong>Diretriz:</strong> use apenas fontes públicas (ANVISA,
            DATASUS, MS-PCDT, sociedades brasileiras). NÃO copie de Whitebook,
            Sanarflix, UpToDate ou similares.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4">
          {[
            { k: "draft", label: "Rascunhos" },
            { k: "published", label: "Publicados" },
            { k: "all", label: "Todos" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as "draft" | "published" | "all")}
              className={`px-3 h-8 rounded-full text-xs font-semibold transition-colors ${
                filter === f.k
                  ? "bg-[#191C1D] text-white"
                  : "bg-slate-100 text-[#4a5568] hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : mode === "drug" ? (
          <DrugList
            items={visibleDrugs}
            editingId={editingId}
            onSelect={setEditingId}
            onPublish={(id, next) => togglePublish("wb_drugs", id, next)}
            onDelete={(id, label) => handleDelete("wb_drugs", id, label)}
          />
        ) : (
          <ProtocolList
            items={visibleProtocols}
            editingId={editingId}
            onSelect={setEditingId}
            onPublish={(id, next) => togglePublish("wb_protocols", id, next)}
            onDelete={(id, label) => handleDelete("wb_protocols", id, label)}
          />
        )}

        {/* Editor (basico) abaixo */}
        {editingId && (
          <Editor
            mode={mode}
            id={editingId}
            onClose={() => setEditingId(null)}
            onSaved={refresh}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhitebookAdmin;

// ────────────────────────────────────────────────────────────
function DrugList({
  items,
  editingId,
  onSelect,
  onPublish,
  onDelete,
}: {
  items: DrugRow[];
  editingId: string | null;
  onSelect: (id: string) => void;
  onPublish: (id: string, next: boolean) => void;
  onDelete: (id: string, label: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-[#94a3b8]">
        Nenhuma droga neste filtro.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div
          key={d.id}
          className={`bg-white rounded-xl border-2 p-4 transition-colors ${
            editingId === d.id ? "border-[#005344]" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <Pill className="w-5 h-5 text-[#005344] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                  {d.nome_principio}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    d.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {d.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              {d.classe_terapeutica && (
                <p className="text-xs text-[#4a5568] mt-0.5">{d.classe_terapeutica}</p>
              )}
              {d.nome_comercial && d.nome_comercial.length > 0 && (
                <p className="text-[11px] text-[#94a3b8] mt-1">
                  {d.nome_comercial.slice(0, 4).join(" · ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSelect(d.id)}
                className="px-3 h-8 rounded-lg text-xs font-semibold text-[#005344] hover:bg-[#005344]/5"
              >
                Editar
              </button>
              <button
                onClick={() => onPublish(d.id, !d.published)}
                className={`px-3 h-8 rounded-lg text-xs font-semibold ${
                  d.published
                    ? "text-amber-700 hover:bg-amber-50"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {d.published ? "Despublicar" : "Publicar"}
              </button>
              <button
                onClick={() => onDelete(d.id, d.nome_principio)}
                className="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProtocolList({
  items,
  editingId,
  onSelect,
  onPublish,
  onDelete,
}: {
  items: ProtocolRow[];
  editingId: string | null;
  onSelect: (id: string) => void;
  onPublish: (id: string, next: boolean) => void;
  onDelete: (id: string, label: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-[#94a3b8]">
        Nenhum protocolo neste filtro.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <div
          key={p.id}
          className={`bg-white rounded-xl border-2 p-4 transition-colors ${
            editingId === p.id ? "border-[#005344]" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <ListChecks className="w-5 h-5 text-[#005344] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                  {p.titulo}
                </h3>
                <span className="text-[11px] font-mono text-[#8a6f26]">
                  {p.categoria}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    p.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {p.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              {p.resumo && (
                <p className="text-xs text-[#4a5568] mt-1 line-clamp-2 leading-relaxed">
                  {p.resumo}
                </p>
              )}
              {p.fonte && (
                <p className="text-[11px] text-[#94a3b8] mt-1 font-mono">{p.fonte}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSelect(p.id)}
                className="px-3 h-8 rounded-lg text-xs font-semibold text-[#005344] hover:bg-[#005344]/5"
              >
                Editar
              </button>
              <button
                onClick={() => onPublish(p.id, !p.published)}
                className={`px-3 h-8 rounded-lg text-xs font-semibold ${
                  p.published
                    ? "text-amber-700 hover:bg-amber-50"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {p.published ? "Despublicar" : "Publicar"}
              </button>
              <button
                onClick={() => onDelete(p.id, p.titulo)}
                className="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Editor: visualiza JSON estruturado e permite editar campos chave
// ────────────────────────────────────────────────────────────
function Editor({
  mode,
  id,
  onClose,
  onSaved,
}: {
  mode: Mode;
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const table = mode === "drug" ? "wb_drugs" : "wb_protocols";

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: row } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (alive) {
        setData(row);
        setJsonText(row ? JSON.stringify(row, null, 2) : "");
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, table]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonText);
      // Remove campos read-only
      delete parsed.id;
      delete parsed.created_at;
      delete parsed.updated_at;
      delete parsed.search_vector;
      const { error } = await supabase.from(table).update(parsed).eq("id", id);
      if (error) throw error;
      toast({ title: "Salvo" });
      onSaved();
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

  return (
    <div className="mt-6 bg-white rounded-2xl border-2 border-[#005344] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
          Editor JSON · {mode === "drug" ? "Droga" : "Protocolo"}
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-[#4a5568] hover:bg-slate-100 inline-flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="text-sm text-[#94a3b8]">Carregando…</div>
      ) : !data ? (
        <div className="text-sm text-red-600">Não encontrado</div>
      ) : (
        <>
          <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              Edição direta de JSON. Validação leve (apenas parse). Cuidado com
              estrutura de doses/interações — siga o schema esperado pelo
              renderer.
            </p>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            className="w-full p-3 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 resize-y"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={() => setJsonText(JSON.stringify(data, null, 2))}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-[#4a5568] hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reverter
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#191C1D] text-white text-xs font-bold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
