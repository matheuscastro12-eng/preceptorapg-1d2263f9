import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/easyflow-api`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function efApi(body: Record<string, unknown>) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

export interface EFSubscription {
  id: string;
  name: string;
  status: string;
  periodicity: string;
  recurrenceValueInCents: number;
  createdAt: string;
  expiration: string | null;
  paymentMethod: string;
  customer?: { email?: string; name?: string };
}

export interface EFSale {
  id: string;
  status: string;
  valueInCents: number;
  createdAt: string;
  buyer?: { email?: string; name?: string };
  items?: { product?: { name?: string } }[];
  payments?: { paymentMethod?: string; status?: string }[];
}

export function useEFSubscriptions(email?: string, page = 1) {
  return useQuery({
    queryKey: ["easyflow", "subscriptions", email, page],
    enabled: !!email,
    queryFn: () => efApi({ action: "list_subscriptions", email, page, limit: 10 }),
  });
}

export function useEFSubscription(subscriptionId?: string) {
  return useQuery({
    queryKey: ["easyflow", "subscription", subscriptionId],
    enabled: !!subscriptionId,
    queryFn: () => efApi({ action: "get_subscription", subscriptionId }),
  });
}

export function useEFSales(email?: string, page = 1) {
  return useQuery({
    queryKey: ["easyflow", "sales", email, page],
    enabled: !!email,
    queryFn: () => efApi({ action: "list_sales", email, page, limit: 10 }),
  });
}

export function useEFFinancials() {
  return useQuery({
    queryKey: ["easyflow", "financials"],
    queryFn: () => efApi({ action: "get_financials" }),
  });
}

export function useEFDashboard() {
  return useQuery({
    queryKey: ["easyflow", "dashboard"],
    queryFn: () => efApi({ action: "get_dashboard" }),
    staleTime: 5 * 60 * 1000, // cache por 5 min
  });
}

export function useCancelEFSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => efApi({ action: "cancel_subscription", subscriptionId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["easyflow"] }); qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useRequestRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { orderId: string; reason?: string }) => efApi({ action: "request_refund", ...params }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["easyflow"] }); },
  });
}
