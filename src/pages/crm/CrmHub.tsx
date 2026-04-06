import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import CrmLogin from "./CrmLogin";
import { Loader2, Activity, Building2, TrendingUp, Users, LogOut, BarChart3, DollarSign } from "lucide-react";

export default function CrmHub() {
  const { crmUser, loading, logout, hasMarketingAccess, hasAdminAccess } = useCrmAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PM CRM";
    return () => { document.title = "PreceptorMED"; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-12 w-12 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (!crmUser) return <CrmLogin />;

  // If user only has access to one, redirect directly
  if (hasMarketingAccess && !hasAdminAccess) { navigate("/admin/crm-mkt", { replace: true }); return null; }
  if (hasAdminAccess && !hasMarketingAccess) { navigate("/admin/crm-admin", { replace: true }); return null; }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1B5E3B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B5E3B] to-[#C9A84C] mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Preceptor CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Ola, {crmUser.nome}! Selecione o painel.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Marketing CRM */}
          <button onClick={() => navigate("/admin/crm-mkt")}
            className="group bg-gray-900/80 border border-gray-800 hover:border-[#1B5E3B]/50 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:shadow-[#1B5E3B]/5 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-[#1B5E3B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">CRM Marketing</h2>
            <p className="text-sm text-gray-500 mb-4">Leads, funil de conversao, health score, churn e automacoes.</p>
            <div className="flex flex-wrap gap-2">
              {["Leads", "Funil", "Health", "Churn", "Analytics"].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1B5E3B]/10 text-[#1B5E3B] border border-[#1B5E3B]/20">{t}</span>
              ))}
            </div>
          </button>

          {/* Admin CRM */}
          <button onClick={() => navigate("/admin/crm-admin")}
            className="group bg-gray-900/80 border border-gray-800 hover:border-[#C9A84C]/50 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:shadow-[#C9A84C]/5 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-[#C9A84C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-gray-900" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">CRM Administrativo</h2>
            <p className="text-sm text-gray-500 mb-4">Financas, people, OKRs, contratacoes e relatorios.</p>
            <div className="flex flex-wrap gap-2">
              {["Receita", "Despesas", "Time", "OKRs", "Carreira"].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">{t}</span>
              ))}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center mt-8 gap-4">
          <span className="text-xs text-gray-600">{crmUser.username} &middot; {crmUser.role}</span>
          <button onClick={logout} className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-colors">
            <LogOut className="w-3 h-3" />Sair
          </button>
        </div>
      </div>
    </div>
  );
}
