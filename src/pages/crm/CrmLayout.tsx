import { useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import Sidebar from "@/components/crm/Sidebar";
import CrmLogin from "./v3/LoginV3";
import { CrmV3MarketingLayout } from "@/components/crm/v3/CrmShellV3";
import { Loader2, ShieldX, LogOut } from "lucide-react";

// Páginas que já trazem seu próprio shell (v3) — pular sidebar/wrapper escuro
// Todas as rotas Marketing agora são v3
const V3_PAGES = new Set([
  "/admin/crm-mkt",
  "/admin/crm-mkt/leads",
  "/admin/crm-mkt/funnel",
  "/admin/crm-mkt/landing-funnel",
  "/admin/crm-mkt/health",
  "/admin/crm-mkt/churn",
  "/admin/crm-mkt/automations",
  "/admin/crm-mkt/templates-email",
  "/admin/crm-mkt/cohorts",
  "/admin/crm-mkt/users",
  "/admin/crm-mkt/analytics",
  "/admin/crm-mkt/roleta",
  "/admin/crm-mkt/suporte",
]);

export default function CrmLayout() {
  const { crmUser, loading, hasMarketingAccess, logout } = useCrmAuth();
  const location = useLocation();
  const isV3 = V3_PAGES.has(location.pathname.replace(/\/$/, ""));

  useEffect(() => {
    document.title = "PM CRM";
    return () => { document.title = "PreceptorMED"; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-12 w-12 text-green-400 animate-spin" />
      </div>
    );
  }

  if (!crmUser) return <CrmLogin />;

  if (!hasMarketingAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-sm text-gray-500 mb-6">Voce nao tem acesso ao CRM Marketing.</p>
          <div className="flex items-center gap-3">
            <a href="/admin/crm-admin" className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
              Ir para CRM Admin
            </a>
            <button onClick={logout} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors">
              <LogOut className="w-3.5 h-3.5" />Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Páginas v3: shell persistente com sidebar fixa, só o main troca
  if (isV3) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen" style={{ background: "#F7F4EE" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0F4128" }} />
        </div>
      }>
        <CrmV3MarketingLayout />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto crm-scrollbar pt-14 lg:pt-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
