import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";
import { MRR_BASELINE_DATE } from "@/lib/crm/constants";

const CRM_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-admin-actions`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fetchSubscriptions(): Promise<any[]> {
  try {
    const token = localStorage.getItem("crm_token");
    const res = await fetch(CRM_ACTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` },
      body: JSON.stringify({ action: "get_subscriptions", token }),
    });
    const data = await res.json();
    return data.subscriptions ?? [];
  } catch {
    const { data } = await supabase.from("subscriptions").select("*");
    return data ?? [];
  }
}

export interface DashboardKpis {
  mrr: number;
  arr: number;
  runway: number;
  headcount: number;
  burnRate: number;
  assinantesAtivos: number;
  churnRate: number;
  ticketMedio: number;
  novasReceitas: number;
}

export interface MrrHistory {
  mes: string;
  mrr: number;
}

export interface DespesaCategoria {
  categoria: string;
  total: number;
}

// Precos por plano (mesma fonte de verdade do app)
const PLAN_PRICES: Record<string, number> = {
  monthly: 49.90,
  annual: 350.90 / 12,    // ~R$29.24/mês
  biannual: 599.90 / 6,   // ~R$99.98/mês
};

async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inicioMes = `${mesAtual}-01`;

  // MRR real = soma dos assinantes pagantes ativos (apenas novos a partir de 07/04/2026)
  // MRR_BASELINE_DATE importado de @/lib/crm/constants
  const allSubs = await fetchSubscriptions();
  const subs = allSubs.filter((s: any) => s.status === "active");

  // Conta apenas assinantes que entraram/renovaram a partir da data base
  const pagantes = subs.filter((s: any) =>
    (s.plan_type === "monthly" || s.plan_type === "annual" || s.plan_type === "biannual") &&
    ((s.updated_at ?? s.created_at) >= MRR_BASELINE_DATE)
  );
  const mrr = pagantes.reduce((s, sub) => s + (PLAN_PRICES[sub.plan_type] ?? 0), 0);
  const assinantesAtivos = pagantes.length;
  const ticketMedio = assinantesAtivos > 0 ? mrr / assinantesAtivos : 0;

  // Churn: inativos / total (using already fetched data)
  const totalSubs = allSubs.length;
  const inativos = allSubs.filter((s: any) => s.status === "inactive" || s.status === "inadimplente").length;
  const churnRate = totalSubs > 0 ? (inativos / totalSubs) * 100 : 0;

  // Novas no mes (pela data de criacao)
  const { count: novasReceitas } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .in("plan_type", ["monthly", "annual", "biannual"])
    .gte("created_at", `${inicioMes}T00:00:00.000Z`);

  // Despesas do mes (burn rate)
  const { data: despesasMes } = await supabase
    .from("admin_despesas")
    .select("valor")
    .gte("data", inicioMes);

  const burnRate = (despesasMes ?? []).reduce((s, d) => s + Number(d.valor), 0);

  // Saldo atual — maybeSingle pra nao crashar se a tabela esta vazia
  const { data: fluxo } = await supabase
    .from("admin_fluxo_caixa")
    .select("saldo_atual")
    .order("data_atualizacao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const saldo = Number(fluxo?.saldo_atual ?? 0);
  const runway = burnRate > 0 ? saldo / burnRate : 0;

  // Headcount
  const { count: headcount } = await supabase
    .from("admin_membros")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    runway: Math.round(runway * 10) / 10,
    headcount: headcount ?? 0,
    burnRate: Math.round(burnRate * 100) / 100,
    assinantesAtivos,
    churnRate: Math.round(churnRate * 10) / 10,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    novasReceitas: novasReceitas ?? 0,
  };
}

async function fetchMrrHistory(): Promise<MrrHistory[]> {
  // Usa subscriptions reais (pagantes) com data de criacao
  const allSubs = await fetchSubscriptions();
  const subs = allSubs.filter((s: any) =>
    ["monthly", "annual", "biannual"].includes(s.plan_type)
  ).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));

  const now = new Date();
  const months: Record<string, number> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
  }

  for (const s of subs) {
    if (s.status !== "active") continue;
    const startMonth = s.created_at.substring(0, 7);
    const price = PLAN_PRICES[s.plan_type] ?? 0;
    for (const month of Object.keys(months)) {
      if (month >= startMonth) months[month] += price;
    }
  }

  return Object.entries(months).map(([mes, mrr]) => ({
    mes: mes.split("-").reverse().join("/"),
    mrr: Math.round(mrr * 100) / 100,
  }));
}

async function fetchDespesasPorCategoria(): Promise<DespesaCategoria[]> {
  const { data } = await supabase.from("admin_despesas").select("categoria, valor");

  const map: Record<string, number> = {};
  (data ?? []).forEach((d) => {
    map[d.categoria] = (map[d.categoria] ?? 0) + Number(d.valor);
  });

  return Object.entries(map)
    .map(([categoria, total]) => ({ categoria, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

export function useAdminDashboardKpis() {
  return useQuery({ queryKey: ["crm-admin", "dashboard-kpis"], queryFn: fetchDashboardKpis, refetchInterval: 60_000 });
}

export function useMrrHistory() {
  return useQuery({ queryKey: ["crm-admin", "mrr-history"], queryFn: fetchMrrHistory });
}

export function useDespesasPorCategoria() {
  return useQuery({ queryKey: ["crm-admin", "despesas-categoria"], queryFn: fetchDespesasPorCategoria });
}
