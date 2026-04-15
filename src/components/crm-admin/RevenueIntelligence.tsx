import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, X, Clock } from "lucide-react";
import { supabase } from "@/lib/crm/supabase";
import { toast } from "sonner";

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revenue-intelligence`;

// Renderer simples de markdown — converte cabecalhos, listas, bold
function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-white mt-5 mb-2 font-[Manrope]">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-white mt-3 mb-1.5">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-gray-300 ml-4 mb-1 leading-relaxed">$1</li>')
    .split(/\n\n+/).map((p) => {
      if (p.trim().startsWith("<h") || p.trim().startsWith("<li")) return p;
      if (p.trim().length === 0) return "";
      return `<p class="text-sm text-gray-300 leading-relaxed mb-2">${p.replace(/\n/g, "<br/>")}</p>`;
    }).join("\n");
}

export default function RevenueIntelligence() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const analyze = async (force = false) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setContent(data.content);
        setCached(!!data.cached);
        setGeneratedAt(data.generated_at);
      } else {
        toast.error(data.error ?? "Falha ao gerar analise");
      }
    } catch (err) {
      toast.error("Erro ao conectar");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!content) await analyze(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/30"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Analisar com IA
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3 bg-gray-900 rounded-t-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white truncate">Revenue Intelligence</h2>
                  {generatedAt && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cached ? "Cache de" : "Gerado em"} {new Date(generatedAt).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => analyze(true)}
                  disabled={loading}
                  title="Gerar nova analise"
                  className="p-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
                <button onClick={() => setOpen(false)} className="p-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 min-h-[400px]">
              {loading && !content ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">Analisando dados dos ultimos 3 meses...</p>
                  <p className="text-xs text-gray-500 mt-1">Pode levar 15-30 segundos</p>
                </div>
              ) : content ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
