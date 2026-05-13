import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ONLINE_USERS_CHANNEL } from "@/hooks/usePresenceTracking";

export interface OnlineUser {
  user_id: string;
  email: string | null;
  name: string | null;
  current_page: string;
  online_at: string;
}

/**
 * Observa o canal Realtime de presenca SEM trackar (read-only).
 * Usado no CRM pra mostrar quantos alunos estao online agora.
 */
export function useOnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(ONLINE_USERS_CHANNEL, {
      config: { presence: { key: "crm-observer" } },
    });

    const flatten = () => {
      const state = channel.presenceState() as Record<
        string,
        Array<Record<string, unknown>>
      >;
      const all: OnlineUser[] = [];
      for (const key of Object.keys(state)) {
        // Ignora observadores admin
        if (key === "crm-observer" || key.startsWith("crm-")) continue;
        const pres = state[key]?.[0];
        if (!pres) continue;
        // Tambem filtra payloads que se identificaram como observer
        if (pres.kind === "observer") continue;
        all.push({
          user_id: (pres.user_id as string) ?? key,
          email: (pres.email as string) ?? null,
          name: (pres.name as string) ?? null,
          current_page: (pres.current_page as string) ?? "/",
          online_at: (pres.online_at as string) ?? new Date().toISOString(),
        });
      }
      all.sort(
        (a, b) =>
          new Date(b.online_at).getTime() - new Date(a.online_at).getTime(),
      );
      setUsers(all);
      // Recebeu sync → consideramos conectado
      setConnected(true);
    };

    channel
      .on("presence", { event: "sync" }, flatten)
      .on("presence", { event: "join" }, flatten)
      .on("presence", { event: "leave" }, flatten)
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // eslint-disable-next-line no-console
          console.warn("[OnlineUsers] realtime status", status, err);
        }
      });

    // Fallback: mesmo que SUBSCRIBED nao venha, depois de 4s assumimos
    // conectado (vazio) pra UI nao ficar travada em "Conectando..."
    const timeout = window.setTimeout(() => setConnected(true), 4000);

    return () => {
      window.clearTimeout(timeout);
      try {
        void supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
      setConnected(false);
    };
  }, []);

  return { users, connected, count: users.length };
}
