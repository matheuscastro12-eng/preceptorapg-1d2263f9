import { useEffect, useState, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, AlertCircle, TrendingDown, TrendingUp, DollarSign, Info } from "lucide-react";
import { supabase } from "@/lib/crm/supabase";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string | null;
  severity: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  success: "text-green-400 bg-green-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  error: "text-red-400 bg-red-500/10",
  info: "text-blue-400 bg-blue-500/10",
};

const TYPE_ICONS: Record<string, any> = {
  new_subscriber: TrendingUp,
  churn: TrendingDown,
  inadimplencia: DollarSign,
  feedback: Info,
  system: AlertCircle,
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("crm_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => {
    load();
    // Realtime: novas notificacoes aparecem na hora
    const channel = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "crm_notifications" },
        (payload: any) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("crm_notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from("crm_notifications").update({ read: true, read_at: new Date().toISOString() }).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    if (!confirm("Apagar todas as notificacoes lidas?")) return;
    await supabase.from("crm_notifications").delete().eq("read", true);
    setItems((prev) => prev.filter((n) => !n.read));
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        title={unreadCount > 0 ? `${unreadCount} notificacoes nao lidas` : "Notificacoes"}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-[500px] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Notificacoes</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800" title="Marcar todas como lidas">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/20" title="Limpar lidas">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto crm-scrollbar divide-y divide-gray-800/50">
            {items.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Nenhuma notificacao</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Info;
                const color = SEVERITY_COLORS[n.severity] ?? SEVERITY_COLORS.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-800/30 flex items-start gap-3 ${!n.read ? "bg-gray-800/20" : ""}`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${n.read ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                      {n.description && <p className="text-[11px] text-gray-500 truncate mt-0.5">{n.description}</p>}
                      <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-1.5" title="Nao lida" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
