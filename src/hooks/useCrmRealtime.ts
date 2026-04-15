import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";
import { toast } from "sonner";

/**
 * Inscreve no Supabase Realtime pra invalidar queries do CRM quando
 * dados relevantes mudam (novo subscriber, churn, inadimplencia etc).
 *
 * Usa uma subscription unica por mount — desinscreve no unmount.
 *
 * Invalida TODAS as queries que comecam com "crm" ou "crm-admin" no
 * queryKey — reactQuery vai refetchar apenas o que esta ativo na UI.
 *
 * Opcionalmente mostra toast em eventos importantes (newSubscriber, churn).
 */
export function useCrmRealtime(options: { showToasts?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { showToasts = true } = options;
  const seenEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel("crm-dashboard-realtime")

      // Assinaturas: mudanca de status vira newSubscriber ou churn
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "subscriptions" },
        (payload: any) => {
          const dedupe = `sub-${payload.new?.id ?? payload.old?.id}-${payload.eventType}-${payload.commit_timestamp}`;
          if (seenEventsRef.current.has(dedupe)) return;
          seenEventsRef.current.add(dedupe);

          queryClient.invalidateQueries({ queryKey: ["crm"] });
          queryClient.invalidateQueries({ queryKey: ["crm-admin"] });

          if (!showToasts) return;

          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          const plan = payload.new?.plan_type;

          if (oldStatus !== "active" && newStatus === "active") {
            toast.success("Nova assinatura ativada!", {
              description: `Plano ${plan ?? "—"} ativo`,
            });
          } else if (oldStatus === "active" && newStatus === "inactive") {
            toast.error("Assinatura cancelada", {
              description: `Plano ${plan ?? "—"}`,
            });
          } else if (newStatus === "inadimplente") {
            toast.warning("Pagamento atrasado detectado", {
              description: `Plano ${plan ?? "—"}`,
            });
          }
        },
      )

      // Leads: virou subscriber ou churned
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "crm_leads" },
        (payload: any) => {
          const dedupe = `lead-${payload.new?.id}-${payload.commit_timestamp}`;
          if (seenEventsRef.current.has(dedupe)) return;
          seenEventsRef.current.add(dedupe);

          queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
          queryClient.invalidateQueries({ queryKey: ["crm", "funnel"] });
        },
      )

      // Inadimplencia: novo pagamento falhou
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "admin_inadimplencias" },
        (payload: any) => {
          const dedupe = `inad-${payload.new?.id}`;
          if (seenEventsRef.current.has(dedupe)) return;
          seenEventsRef.current.add(dedupe);

          queryClient.invalidateQueries({ queryKey: ["inadimplencia"] });
          queryClient.invalidateQueries({ queryKey: ["crm-admin"] });

          if (showToasts) {
            toast.warning("Nova inadimplencia", {
              description: payload.new?.nome ?? payload.new?.email ?? "",
            });
          }
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, showToasts]);
}
