import { useEffect, useState } from "react";
import { supabase } from "@/lib/crm/supabase";
import { Loader2, AlertTriangle, RefreshCw, CheckCircle2, ExternalLink, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payload: any;
  processed: boolean;
  error_message: string | null;
  created_at: string;
}

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/easyflow-webhook`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function AdminWebhooks() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"failed" | "all">("failed");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("webhook_events")
      .select("*")
      .eq("provider", "easyflow")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter === "failed") q = q.eq("processed", false);
    const { data, error } = await q;
    if (error) toast.error("Erro: " + error.message);
    setEvents((data ?? []) as WebhookEvent[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const retry = async (ev: WebhookEvent) => {
    setRetrying(ev.id);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(ev.payload),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        toast.success("Reprocessado com sucesso");
        // Marca como processado se o webhook nao marcou
        await supabase.from("webhook_events")
          .update({ processed: true, error_message: null })
          .eq("id", ev.id);
        await load();
      } else {
        toast.error("Falhou: " + (data.error ?? `HTTP ${res.status}`));
      }
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    } finally {
      setRetrying(null);
    }
  };

  const failedCount = events.filter(e => !e.processed).length;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Webhooks EasyFlow
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Eventos recebidos da EasyFlow. Os marcados como falha precisam ser investigados/reprocessados.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilter("failed")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === "failed" ? "bg-red-900/40 text-red-300" : "text-gray-400 hover:text-white"
            }`}
          >
            Falhas {failedCount > 0 && filter === "failed" && `(${failedCount})`}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === "all" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={load}
            className="ml-1 p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Atualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">
            {filter === "failed" ? "Nenhum webhook com falha" : "Sem eventos recentes"}
          </p>
          <p className="text-xs text-gray-500">
            {filter === "failed" ? "Todos os pagamentos recentes foram processados sem erro." : "EasyFlow ainda nao enviou nada."}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/80 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quando</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evento</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identificador</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {events.map((ev) => {
                const buyerEmail = ev.payload?.payload?.buyer?.email
                  ?? ev.payload?.payload?.customer?.email
                  ?? ev.payload?.buyer?.email
                  ?? ev.payload?.customer?.email;
                const holderName = ev.payload?.payload?.creditCard?.holderName ?? ev.payload?.creditCard?.holderName;
                const paymentId = ev.payload?.payload?.id ?? ev.payload?.id;
                const ident = buyerEmail || holderName || paymentId || "—";

                return (
                  <>
                    <tr key={ev.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {new Date(ev.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-white font-mono">{ev.event_type}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-300 truncate max-w-[240px]">{ident}</td>
                      <td className="px-4 py-2.5">
                        {ev.processed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/30 text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <button
                            onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-300 hover:bg-red-900/60"
                          >
                            {expanded === ev.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            FALHA
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!ev.processed && (
                          <button
                            onClick={() => retry(ev)}
                            disabled={retrying === ev.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-900/40 text-amber-300 hover:bg-amber-800/60 disabled:opacity-50 transition-colors"
                          >
                            {retrying === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Reprocessar
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === ev.id && !ev.processed && (
                      <tr key={ev.id + "-expanded"} className="bg-gray-950/50">
                        <td colSpan={5} className="px-4 py-3 border-l-2 border-red-500/40">
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Erro</p>
                              <code className="text-xs text-red-300 bg-red-950/30 px-2 py-1 rounded inline-block">
                                {ev.error_message ?? "(sem mensagem)"}
                              </code>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payload</p>
                              <pre className="text-[11px] text-gray-300 bg-gray-950 p-3 rounded overflow-x-auto max-h-60 font-mono">
                                {JSON.stringify(ev.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
