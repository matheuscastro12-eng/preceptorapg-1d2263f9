// ============================================================
// PRECEPTOR CRM — Supabase Queries (Browser Client)
// ============================================================

import { supabase } from "@/lib/crm/supabase";
import type {
  CrmLead,
  CrmHealthScore,
  CrmChurnPrediction,
  CrmAutomationLog,
  FunnelKpis,
  HealthDistribution,
  AutomationPerformance,
  LeadStatus,
  Produto,
} from "./types";

// ── DASHBOARD KPIs ────────────────────────────────────────────

export async function getDashboardKpis() {
  const { count: totalSubscribers } = await supabase
    .from("crm_leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "subscriber");

  // Calculate MRR from actual subscription plans (only from baseline date forward)
  const MRR_BASELINE = "2026-04-07T00:00:00.000Z";
  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("plan_type, updated_at, created_at")
    .eq("status", "active");

  const PLAN_MRR: Record<string, number> = {
    monthly: 49.90,
    biannual: 599.90 / 6,   // ~R$99.98/mês
    annual: 350.90 / 12,     // ~R$29.24/mês
    free_access: 0,
  };

  const newSubs = (activeSubs ?? []).filter(s => (s.updated_at ?? s.created_at) >= MRR_BASELINE);
  const mrr = newSubs.reduce((sum, s) => sum + (PLAN_MRR[s.plan_type] ?? 0), 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count: newChurns } = await supabase
    .from("crm_leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "churned")
    .gte("churned_at", thirtyDaysAgo);

  const churnRate = totalSubscribers && totalSubscribers > 0
    ? ((newChurns ?? 0) / totalSubscribers) * 100
    : 0;

  const { count: totalLeads } = await supabase
    .from("crm_leads")
    .select("*", { count: "exact", head: true });

  const { count: churnRisks } = await supabase
    .from("crm_churn_predictions")
    .select("*", { count: "exact", head: true })
    .is("outcome", null)
    .gte("valid_until", new Date().toISOString());

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: automationsToday } = await supabase
    .from("crm_automations_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  const avgLtv = mrr > 0 ? Math.round((mrr / (totalSubscribers ?? 1)) * 7.5) : 0;

  return {
    mrr: Math.round(mrr),
    totalSubscribers: totalSubscribers ?? 0,
    totalLeads: totalLeads ?? 0,
    churnRate: Math.round(churnRate * 10) / 10,
    churnRisks: churnRisks ?? 0,
    automationsToday: automationsToday ?? 0,
    avgLtv,
  };
}

// ── FUNIL ─────────────────────────────────────────────────────

export async function getFunnelKpis(produto?: Produto): Promise<FunnelKpis[]> {
  let query = supabase.from("crm_funnel_kpis").select("*");
  if (produto) query = query.eq("produto", produto);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FunnelKpis[];
}

export async function getFunnelTimeSeries(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("crm_funnel_events")
    .select("to_stage, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const byDay: Record<string, Record<string, number>> = {};
  for (const event of data ?? []) {
    const day = event.created_at.split("T")[0];
    if (!byDay[day]) byDay[day] = {};
    byDay[day][event.to_stage] = (byDay[day][event.to_stage] ?? 0) + 1;
  }

  return Object.entries(byDay).map(([date, stages]) => ({ date, ...stages }));
}

// ── LEADS ─────────────────────────────────────────────────────

export async function getLeads({
  status,
  produto,
  minScore,
  search,
  page = 1,
  pageSize = 50,
}: {
  status?: LeadStatus;
  produto?: Produto;
  minScore?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("crm_leads")
    .select("*", { count: "exact" })
    .order("lead_score", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (produto) query = query.eq("produto_interesse", produto);
  if (minScore !== undefined) query = query.gte("lead_score", minScore);
  if (search) query = query.or(`email.ilike.%${search}%,nome.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  return { leads: (data ?? []) as CrmLead[], total: count ?? 0 };
}

// ── HEALTH SCORES ─────────────────────────────────────────────

export async function getHealthDistribution(): Promise<HealthDistribution[]> {
  const { data, error } = await supabase
    .from("crm_health_distribution")
    .select("*");
  if (error) throw error;
  return (data ?? []) as HealthDistribution[];
}

export async function getHealthScoresList({
  zone,
  produto,
  page = 1,
  pageSize = 50,
}: {
  zone?: string;
  produto?: Produto;
  page?: number;
  pageSize?: number;
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("crm_health_scores")
    .select(`*, crm_leads!lead_id ( email, nome, status )`, { count: "exact" })
    .order("score", { ascending: true })
    .range(from, to);

  if (zone) query = query.eq("zone", zone);
  if (produto) query = query.eq("produto", produto);

  const { data, count, error } = await query;
  if (error) throw error;

  return { scores: (data ?? []) as CrmHealthScore[], total: count ?? 0 };
}

// ── CHURN PREDICTIONS ─────────────────────────────────────────

export async function getActiveChurnRisks({
  risk_level,
  produto,
  page = 1,
  pageSize = 50,
}: {
  risk_level?: string;
  produto?: Produto;
  page?: number;
  pageSize?: number;
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("crm_active_churn_risks")
    .select("*", { count: "exact" })
    .range(from, to);

  if (risk_level) query = query.eq("risk_level", risk_level);
  if (produto) query = query.eq("produto", produto);

  const { data, count, error } = await query;
  if (error) throw error;

  return { predictions: (data ?? []) as CrmChurnPrediction[], total: count ?? 0 };
}

// ── AUTOMATIONS ───────────────────────────────────────────────

export async function getAutomationsPerformance(): Promise<AutomationPerformance[]> {
  const { data, error } = await supabase
    .from("crm_automations_performance")
    .select("*");
  if (error) throw error;
  return (data ?? []) as AutomationPerformance[];
}

export async function getRecentAutomations({
  page = 1,
  pageSize = 100,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("crm_automations_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { automations: (data ?? []) as CrmAutomationLog[], total: count ?? 0 };
}

// ── UTM ANALYTICS ─────────────────────────────────────────────

export async function getUtmBreakdown() {
  const { data, error } = await supabase
    .from("crm_leads")
    .select("utm_source, utm_medium, utm_campaign, status, lead_score")
    .not("utm_source", "is", null);

  if (error) throw error;

  const breakdown: Record<string, { leads: number; subscribers: number; total_score: number }> = {};

  for (const lead of data ?? []) {
    const src = lead.utm_source ?? "direct";
    if (!breakdown[src]) breakdown[src] = { leads: 0, subscribers: 0, total_score: 0 };
    breakdown[src].leads++;
    breakdown[src].total_score += lead.lead_score;
    if (lead.status === "subscriber") breakdown[src].subscribers++;
  }

  return Object.entries(breakdown).map(([source, stats]) => ({
    source,
    leads: stats.leads,
    subscribers: stats.subscribers,
    conversion_rate: stats.leads > 0 ? Math.round((stats.subscribers / stats.leads) * 100 * 10) / 10 : 0,
    avg_score: stats.leads > 0 ? Math.round(stats.total_score / stats.leads) : 0,
  })).sort((a, b) => b.leads - a.leads);
}
