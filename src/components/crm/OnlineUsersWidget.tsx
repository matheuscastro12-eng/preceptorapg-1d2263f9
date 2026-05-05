import { useMemo, useState } from "react";
import { useOnlineUsers, type OnlineUser } from "@/hooks/useOnlineUsers";
import { ChevronDown, ChevronUp, Users, Wifi, WifiOff } from "lucide-react";

const PAGE_LABELS: Array<[RegExp, string]> = [
  [/^\/dashboard/, "Estudo com PreceptorMED"],
  [/^\/menu/, "Início"],
  [/^\/library/, "Biblioteca"],
  [/^\/exam/, "Simulado"],
  [/^\/enamed/, "ENAMED"],
  [/^\/flashcards/, "Flashcards"],
  [/^\/scientific-studio/, "Curadoria"],
  [/^\/provas\/[^/]+\/simulado/, "Prova ao vivo"],
  [/^\/provas\/[^/]+\/review/, "Revisão de prova"],
  [/^\/provas/, "Provas Importadas"],
  [/^\/profile/, "Perfil"],
  [/^\/pricing/, "Pricing"],
  [/^\/auth/, "Login/Signup"],
  [/^\/admin/, "CRM (admin)"],
  [/^\/$/, "Landing"],
];

function labelForPage(path: string): string {
  for (const [re, label] of PAGE_LABELS) {
    if (re.test(path)) return label;
  }
  return path;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

export default function OnlineUsersWidget() {
  const { users, connected, count } = useOnlineUsers();
  const [expanded, setExpanded] = useState(false);

  const byPage = useMemo(() => {
    const map = new Map<string, OnlineUser[]>();
    for (const u of users) {
      const label = labelForPage(u.current_page);
      const arr = map.get(label) ?? [];
      arr.push(u);
      map.set(label, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [users]);

  return (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-4 flex items-center gap-3 border-b border-gray-800">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          {connected && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-gray-900" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] inline-flex items-center gap-1.5">
            {connected ? (
              <span className="text-emerald-400 inline-flex items-center gap-1.5">
                <Wifi className="w-3 h-3" /> Ao vivo
              </span>
            ) : (
              <span className="text-gray-500 inline-flex items-center gap-1.5">
                <WifiOff className="w-3 h-3" /> Conectando…
              </span>
            )}
          </p>
          <h3 className="text-sm md:text-base font-semibold text-white">
            Usuários online
          </h3>
        </div>
        <div className="text-right">
          <div className="font-bold text-3xl md:text-4xl text-white tracking-[-0.02em] tabular-nums leading-none">
            {count}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">
            agora
          </p>
        </div>
      </div>

      {/* Body */}
      {count === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-500">
            Nenhum usuário online no momento.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo por página */}
          <div className="px-4 md:px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {byPage.slice(0, expanded ? byPage.length : 6).map(([label, arr]) => (
              <div
                key={label}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-colors"
              >
                <span className="text-xs font-medium text-gray-200 truncate">
                  {label}
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400 tabular-nums shrink-0 ml-2">
                  {arr.length}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full px-5 py-2.5 border-t border-gray-800 text-xs font-semibold text-gray-400 hover:bg-gray-800/40 hover:text-gray-200 inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Ver todos os {count} usuários
              </>
            )}
          </button>

          {expanded && (
            <div className="border-t border-gray-800 max-h-72 overflow-y-auto">
              {users.map((u) => {
                const label = labelForPage(u.current_page);
                const initial =
                  (u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
                return (
                  <div
                    key={u.user_id}
                    className="px-5 py-2.5 flex items-center gap-3 border-b border-gray-800/60 last:border-b-0 hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                        {initial}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-100 truncate">
                        {u.name ?? u.email ?? u.user_id.slice(0, 8)}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        em <span className="text-gray-300">{label}</span>
                      </p>
                    </div>
                    <span className="text-[10.5px] font-mono text-gray-600 tabular-nums shrink-0">
                      {timeAgo(u.online_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
