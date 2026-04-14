import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/crm/supabase";
import { useAuth } from "@/contexts/AuthContext";

const CRM_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-auth`;
const CRM_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-admin-actions`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function crmAction(action: string, data: Record<string, unknown>) {
  const token = localStorage.getItem("crm_token");
  const res = await fetch(CRM_ACTIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify({ action, token, ...data }),
  });
  return res.json();
}
import {
  Users, CreditCard, Gift, UserX, UserCheck, Loader2, Clock,
  Edit2, Save, Search, DollarSign, Activity, TrendingUp, BarChart3, Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import { useEFSubscriptions, useEFSales, useCancelEFSubscription } from "@/hooks/useEasyflow";
import { X } from "lucide-react";

interface UserWithSubscription {
  user_id: string;
  email: string;
  created_at: string;
  full_name?: string;
  phone?: string | null;
  subscription?: {
    status: string;
    plan_type: string;
    access_expires_at: string | null;
  };
}

type AccessDuration = "unlimited" | "4h" | "1d" | "3d" | "7d" | "15d" | "30d";
type PlanType = "monthly" | "annual" | "free_access" | "none";

const DURATION_LABELS: Record<AccessDuration, string> = {
  unlimited: "Ilimitado", "4h": "4 horas", "1d": "1 dia",
  "3d": "3 dias", "7d": "7 dias", "15d": "15 dias", "30d": "30 dias",
};

const PLAN_LABELS: Record<string, string> = {
  monthly: "Mensal", annual: "Anual", biannual: "Bianual",
  free_access: "Gratuito", none: "Sem acesso",
};

const CHART_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const COST_PER_GENERATION: Record<string, number> = {
  "generate-fechamento": 0.02, "generate-exam": 0.03, "generate-flashcards": 0.005,
  "ai-chat": 0.015, "scientific-mentor": 0.015, "generate-enamed": 0.01,
};

export default function CrmUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Record<string, AccessDuration>>({});
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Record<string, PlanType>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name_asc" | "email_asc" | "status">("recent");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [efPanelEmail, setEfPanelEmail] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await fetch(CRM_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` },
        body: JSON.stringify({ action: "list_users", token }),
      });
      const data = await res.json();
      const profiles = data.profiles ?? [];
      const subscriptions = data.subscriptions ?? [];
      const usersWithSubs = profiles.map((p: any) => ({
        ...p,
        subscription: subscriptions.find((s: any) => s.user_id === p.user_id)
          ? { status: subscriptions.find((s: any) => s.user_id === p.user_id)!.status,
              plan_type: subscriptions.find((s: any) => s.user_id === p.user_id)!.plan_type,
              access_expires_at: subscriptions.find((s: any) => s.user_id === p.user_id)!.access_expires_at }
          : undefined,
      }));
      setUsers(usersWithSubs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const isExpired = (sub?: UserWithSubscription["subscription"]) => {
    if (!sub?.access_expires_at) return false;
    return new Date(sub.access_expires_at) < new Date();
  };

  const getExpirationDate = (duration: AccessDuration): string | null => {
    if (duration === "unlimited") return null;
    const ms: Record<string, number> = {
      "4h": 4*3600000, "1d": 86400000, "3d": 3*86400000,
      "7d": 7*86400000, "15d": 15*86400000, "30d": 30*86400000,
    };
    return new Date(Date.now() + ms[duration]).toISOString();
  };

  const grantAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      const duration = selectedDuration[userId] || "unlimited";
      const expiresAt = getExpirationDate(duration);
      const result = await crmAction("grant_access", {
        user_id: userId,
        plan_type: "free_access",
        access_expires_at: expiresAt,
        granted_by: user?.id,
      });
      if (result.error) console.error("Grant failed:", result.error);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const revokeAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await crmAction("revoke_access", { user_id: userId });
      if (result.error) console.error("Revoke failed:", result.error);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConfirmDelete(null);
      fetchUsers();
    } catch (e) { console.error("Delete failed:", e); }
    finally { setActionLoading(null); }
  };

  const updatePlanType = async (userId: string) => {
    setActionLoading(userId);
    try {
      const plan = selectedPlan[userId];
      if (!plan) return;
      const result = await crmAction("update_plan", { user_id: userId, plan_type: plan });
      if (result.error) console.error("Update plan failed:", result.error);
      setEditingPlan(null);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const stats = {
    total: users.length,
    paying: users.filter((u) => u.subscription?.plan_type === "monthly" || u.subscription?.plan_type === "annual").length,
    freeAccess: users.filter((u) => u.subscription?.plan_type === "free_access" && !isExpired(u.subscription)).length,
    noAccess: users.filter((u) => !u.subscription || u.subscription.status !== "active" || isExpired(u.subscription)).length,
  };

  const filtered = users.filter((u) => {
    if (searchQuery && !u.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(u.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === "paying") return u.subscription?.plan_type === "monthly" || u.subscription?.plan_type === "annual";
    if (statusFilter === "free") return u.subscription?.plan_type === "free_access" && !isExpired(u.subscription);
    if (statusFilter === "none") return !u.subscription || u.subscription.status !== "active" || isExpired(u.subscription);
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "recent": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name_asc": return (a.full_name ?? "").localeCompare(b.full_name ?? "", "pt-BR");
      case "email_asc": return a.email.localeCompare(b.email, "pt-BR");
      case "status": {
        const rank = (u: UserWithSubscription) => {
          const s = u.subscription;
          if (!s || s.status !== "active" || isExpired(s)) return 3;
          if (s.plan_type === "free_access") return 2;
          return 1;
        };
        return rank(a) - rank(b);
      }
      default: return 0;
    }
  });

  const getStatusBadge = (sub?: UserWithSubscription["subscription"]) => {
    if (!sub || sub.status !== "active" || isExpired(sub)) {
      if (isExpired(sub)) return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-400"><Clock className="h-3 w-3" />Expirado</span>;
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-500">Sem acesso</span>;
    }
    if (sub.plan_type === "free_access") {
      if (sub.access_expires_at) {
        const diff = new Date(sub.access_expires_at).getTime() - Date.now();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        const remaining = days > 0 ? `${days}d` : `${hours}h`;
        return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900/30 text-yellow-400 border border-yellow-800/30"><Clock className="h-3 w-3" />{remaining}</span>;
      }
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-800/30">Gratuito</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/30 text-blue-400 border border-blue-800/30">{PLAN_LABELS[sub.plan_type] ?? sub.plan_type}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gestao de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">{stats.total} usuarios cadastrados &middot; Gerencie acesso e planos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total" value={stats.total} icon={Users} color="blue" subtitle="Usuarios cadastrados" />
        <MetricCard title="Pagantes" value={stats.paying} icon={CreditCard} color="green" subtitle="Assinantes ativos" />
        <MetricCard title="Gratuitos" value={stats.freeAccess} icon={Gift} color="gold" subtitle="Acesso liberado" />
        <MetricCard title="Sem Acesso" value={stats.noAccess} icon={UserX} color="red" subtitle="Inativos ou expirados" />
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por email ou nome..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-600"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Todos", count: stats.total },
              { key: "paying", label: "Pagantes", count: stats.paying },
              { key: "free", label: "Gratuitos", count: stats.freeAccess },
              { key: "none", label: "Sem acesso", count: stats.noAccess },
            ].map((f) => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.key ? "bg-[#1B5E3B] text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 focus:outline-none focus:border-green-600 cursor-pointer"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name_asc">Nome (A-Z)</option>
            <option value="email_asc">Email (A-Z)</option>
            <option value="status">Status (pagantes primeiro)</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastro</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{u.full_name || u.email.split("@")[0]}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-500">• {u.phone}</p>}
                        <button onClick={() => setEfPanelEmail(u.email)}
                          className="text-[10px] text-[#C9A84C] hover:text-yellow-300 font-medium">
                          Pagamentos
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(u.subscription)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {confirmDelete === u.user_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-400">Excluir?</span>
                            <button onClick={() => deleteUser(u.user_id)} disabled={actionLoading === u.user_id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                              {actionLoading === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700">
                              Nao
                            </button>
                          </div>
                        ) : editingPlan === u.user_id ? (
                          <>
                            <select
                              value={selectedPlan[u.user_id] || u.subscription?.plan_type || "none"}
                              onChange={(e) => setSelectedPlan((p) => ({ ...p, [u.user_id]: e.target.value as PlanType }))}
                              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-green-600">
                              <option value="monthly">Mensal</option>
                              <option value="annual">Anual</option>
                              <option value="free_access">Gratuito</option>
                              <option value="none">Sem acesso</option>
                            </select>
                            <button onClick={() => updatePlanType(u.user_id)} disabled={actionLoading === u.user_id}
                              className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors">
                              {actionLoading === u.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => setEditingPlan(null)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700">
                              <span className="text-xs">&times;</span>
                            </button>
                          </>
                        ) : u.subscription?.status === "active" && u.subscription?.plan_type === "free_access" && !isExpired(u.subscription) ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => revokeAccess(u.user_id)} disabled={actionLoading === u.user_id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/30 hover:bg-red-900/50 transition-colors">
                              {actionLoading === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserX className="h-3 w-3" />Revogar</>}
                            </button>
                            <button onClick={() => { setEditingPlan(u.user_id); setSelectedPlan((p) => ({ ...p, [u.user_id]: (u.subscription?.plan_type || "none") as PlanType })); }}
                              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700">
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button onClick={() => setConfirmDelete(u.user_id)} className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : !u.subscription || u.subscription.status !== "active" || isExpired(u.subscription) ? (
                          <div className="flex items-center gap-1.5">
                            <select value={selectedDuration[u.user_id] || "unlimited"}
                              onChange={(e) => setSelectedDuration((p) => ({ ...p, [u.user_id]: e.target.value as AccessDuration }))}
                              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-green-600">
                              {Object.entries(DURATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <button onClick={() => grantAccess(u.user_id)} disabled={actionLoading === u.user_id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1B5E3B] text-white hover:bg-green-700 transition-colors">
                              {actionLoading === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserCheck className="h-3 w-3" />Liberar</>}
                            </button>
                            <button onClick={() => setConfirmDelete(u.user_id)} className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEfPanelEmail(u.email)} className="text-[10px] text-[#C9A84C] hover:underline">Pagamentos</button>
                            <span className="text-xs text-gray-500">Pagante</span>
                            <button onClick={() => { setEditingPlan(u.user_id); setSelectedPlan((p) => ({ ...p, [u.user_id]: (u.subscription?.plan_type || "none") as PlanType })); }}
                              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700">
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button onClick={() => setConfirmDelete(u.user_id)} className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">Mostrando {filtered.length} de {users.length} usuarios</p>
        </div>
      </div>

      {/* Metrics */}
      <MetricsDashboard users={users} />

      {/* EasyFlow Panel */}
      {efPanelEmail && <EasyFlowPanel email={efPanelEmail} onClose={() => setEfPanelEmail(null)} />}

    </div>
  );
}

// ── EasyFlow Payment Panel ──────────────────────────────────
function EasyFlowPanel({ email, onClose }: { email: string; onClose: () => void }) {
  const { data: subs, isLoading: subsLoading } = useEFSubscriptions(email);
  const { data: sales, isLoading: salesLoading } = useEFSales(email);
  const cancelSub = useCancelEFSubscription();

  const subscriptions = subs?.data || subs?.items || (Array.isArray(subs) ? subs : []);
  const salesList = sales?.data || sales?.items || (Array.isArray(sales) ? sales : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Pagamentos EasyFlow</h2>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        {/* Subscriptions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#C9A84C] mb-3">Assinaturas</h3>
          {subsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" /></div>
          ) : subscriptions.length > 0 ? (
            <div className="space-y-2">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{sub.name || sub.periodicity || "Assinatura"}</p>
                    <p className="text-xs text-gray-400">
                      {sub.status} · {sub.periodicity} · {sub.paymentMethod}
                      {sub.recurrenceValueInCents && ` · R$ ${(sub.recurrenceValueInCents / 100).toFixed(2)}`}
                    </p>
                    <p className="text-[10px] text-gray-600">{sub.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      sub.status === "active" ? "bg-green-900/30 text-green-400" :
                      sub.status === "canceled" ? "bg-red-900/30 text-red-400" :
                      "bg-gray-800 text-gray-500"
                    }`}>{sub.status}</span>
                    {sub.status === "active" && (
                      <button
                        onClick={() => { if (confirm("Cancelar esta assinatura?")) cancelSub.mutate(sub.id); }}
                        className="px-2 py-0.5 rounded text-[10px] text-red-400 hover:bg-red-900/20"
                      >Cancelar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-2">Nenhuma assinatura encontrada</p>
          )}
        </div>

        {/* Sales */}
        <div>
          <h3 className="text-sm font-semibold text-[#C9A84C] mb-3">Vendas / Pedidos</h3>
          {salesLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" /></div>
          ) : salesList.length > 0 ? (
            <div className="space-y-2">
              {salesList.map((sale: any) => (
                <div key={sale.id} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{sale.items?.[0]?.product?.name || "Pedido"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(sale.createdAt).toLocaleDateString("pt-BR")} ·
                        {sale.payments?.[0]?.paymentMethod || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">R$ {((sale.valueInCents || 0) / 100).toFixed(2)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sale.status === "paid" ? "bg-green-900/30 text-green-400" :
                        sale.status === "canceled" || sale.status === "refunded" ? "bg-red-900/30 text-red-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>{sale.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-2">Nenhuma venda encontrada</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Metrics Dashboard ────────────────────────────────────────
function MetricsDashboard({ users }: { users: UserWithSubscription[] }) {
  const [generationData, setGenerationData] = useState<{ date: string; count: number }[]>([]);
  const [functionBreakdown, setFunctionBreakdown] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: logs } = await supabase.from("generation_logs").select("created_at, function_name").gte("created_at", sevenDaysAgo).order("created_at", { ascending: true });
        const byDay: Record<string, number> = {};
        const byFunc: Record<string, number> = {};
        (logs ?? []).forEach((l) => {
          const day = new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          byDay[day] = (byDay[day] || 0) + 1;
          byFunc[l.function_name] = (byFunc[l.function_name] || 0) + 1;
        });
        setGenerationData(Object.entries(byDay).map(([date, count]) => ({ date, count })));
        setFunctionBreakdown(Object.entries(byFunc).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const subscriberBreakdown = useMemo(() => {
    const counts: Record<string, number> = { monthly: 0, annual: 0, free_access: 0, none: 0 };
    users.forEach((u) => {
      const plan = u.subscription?.plan_type || "none";
      const status = u.subscription?.status;
      if (status !== "active" && plan !== "none") counts.none++;
      else counts[plan] = (counts[plan] || 0) + 1;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [users]);

  const totalGenerations = functionBreakdown.reduce((a, f) => a + f.count, 0);
  const estimatedCost = functionBreakdown.reduce((a, f) => a + f.count * (COST_PER_GENERATION[f.name] || 0.01), 0);

  if (loading) {
    return <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-green-400" />Metricas da Plataforma
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Geracoes (7d)" value={totalGenerations} icon={TrendingUp} color="green" />
        <MetricCard title="Media/dia" value={generationData.length > 0 ? Math.round(totalGenerations / generationData.length) : 0} icon={Activity} color="blue" />
        <MetricCard title="Custo est. (7d)" value={`US$${estimatedCost.toFixed(2)}`} icon={DollarSign} color="gold" />
        <MetricCard title="Assinantes ativos" value={users.filter((u) => u.subscription?.status === "active").length} icon={Users} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generations chart */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Geracoes por dia (7 dias)</h3>
          {generationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={generationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} />
                <Bar dataKey="count" fill="#1B5E3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-500 text-center py-8">Sem dados no periodo</p>}
        </div>

        {/* Plan distribution */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuicao de planos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={subscriberBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                label={({ name, value }) => `${PLAN_LABELS[name] || name}: ${value}`}>
                {subscriberBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [value, PLAN_LABELS[name] || name]}
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Function breakdown */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Uso por funcao (7 dias)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Funcao</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Chamadas</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Custo est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {functionBreakdown.map((f) => (
                <tr key={f.name} className="hover:bg-gray-800/30">
                  <td className="py-2.5 px-4 text-white font-medium">{f.name}</td>
                  <td className="py-2.5 px-4 text-right text-gray-300">{f.count}</td>
                  <td className="py-2.5 px-4 text-right text-gray-400">US${(f.count * (COST_PER_GENERATION[f.name] || 0.01)).toFixed(2)}</td>
                </tr>
              ))}
              {functionBreakdown.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-gray-500">Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

