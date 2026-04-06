import { useQuery } from "@tanstack/react-query";
import {
  getDashboardKpis,
  getFunnelKpis,
  getFunnelTimeSeries,
  getLeads,
  getHealthDistribution,
  getHealthScoresList,
  getActiveChurnRisks,
  getAutomationsPerformance,
  getRecentAutomations,
  getUtmBreakdown,
} from "@/lib/crm/queries";
import type { LeadStatus, Produto } from "@/lib/crm/types";

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["crm", "dashboard-kpis"],
    queryFn: getDashboardKpis,
    refetchInterval: 60_000,
  });
}

export function useFunnelKpis(produto?: Produto) {
  return useQuery({
    queryKey: ["crm", "funnel-kpis", produto],
    queryFn: () => getFunnelKpis(produto),
  });
}

export function useFunnelTimeSeries(days = 30) {
  return useQuery({
    queryKey: ["crm", "funnel-timeseries", days],
    queryFn: () => getFunnelTimeSeries(days),
  });
}

export function useLeads(params: {
  status?: LeadStatus;
  produto?: Produto;
  minScore?: number;
  search?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["crm", "leads", params],
    queryFn: () => getLeads(params),
  });
}

export function useHealthDistribution() {
  return useQuery({
    queryKey: ["crm", "health-distribution"],
    queryFn: getHealthDistribution,
  });
}

export function useHealthScoresList(params: {
  zone?: string;
  produto?: Produto;
  page?: number;
}) {
  return useQuery({
    queryKey: ["crm", "health-scores", params],
    queryFn: () => getHealthScoresList(params),
  });
}

export function useActiveChurnRisks(params: {
  risk_level?: string;
  produto?: Produto;
  page?: number;
}) {
  return useQuery({
    queryKey: ["crm", "churn-risks", params],
    queryFn: () => getActiveChurnRisks(params),
  });
}

export function useAutomationsPerformance() {
  return useQuery({
    queryKey: ["crm", "automations-performance"],
    queryFn: getAutomationsPerformance,
  });
}

export function useRecentAutomations(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["crm", "recent-automations", params],
    queryFn: () => getRecentAutomations(params),
  });
}

export function useUtmBreakdown() {
  return useQuery({
    queryKey: ["crm", "utm-breakdown"],
    queryFn: getUtmBreakdown,
  });
}
