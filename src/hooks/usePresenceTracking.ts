import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Inscreve o usuario logado no canal Realtime "online-users".
 * O CRM usa o mesmo canal (em modo somente leitura) pra mostrar
 * quantas pessoas estao no site agora.
 *
 * - Heartbeat: o Supabase Presence ja tem keepalive automatico via WebSocket.
 * - Ping de pagina: re-track a cada navegacao pra refletir current_page.
 * - Sem PII alem do email (que ja esta no JWT do user).
 */
const PRESENCE_CHANNEL = "preceptormed:online-users";

export function usePresenceTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedRef = useRef(false);

  // Conecta/desconecta com base no user
  useEffect(() => {
    if (!user) {
      // Garante que se o user deslogou, sai do canal
      if (channelRef.current) {
        try {
          void supabase.removeChannel(channelRef.current);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
        subscribedRef.current = false;
      }
      return;
    }
    // Cria o canal com a chave de presenca = user_id (uma sessao por user)
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        subscribedRef.current = true;
        await channel.track({
          user_id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.full_name ?? null,
          current_page: location.pathname,
          online_at: new Date().toISOString(),
        });
      }
    });
    return () => {
      if (channelRef.current) {
        try {
          void channelRef.current.untrack();
          void supabase.removeChannel(channelRef.current);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
        subscribedRef.current = false;
      }
    };
  }, [user]);

  // Atualiza current_page quando navega
  useEffect(() => {
    if (!user || !channelRef.current || !subscribedRef.current) return;
    void channelRef.current.track({
      user_id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? null,
      current_page: location.pathname,
      online_at: new Date().toISOString(),
    });
  }, [location.pathname, user]);
}

export const ONLINE_USERS_CHANNEL = PRESENCE_CHANNEL;
