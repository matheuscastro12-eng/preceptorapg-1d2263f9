import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import AdminSidebar from "@/components/crm-admin/AdminSidebar";
import CrmLogin from "@/pages/crm/CrmLogin";
import { Loader2, ShieldX, LogOut } from "lucide-react";

export default function CrmAdminLayout() {
  const { crmUser, loading, hasAdminAccess, logout } = useCrmAuth();

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

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-sm text-gray-500 mb-6">Voce nao tem acesso ao CRM Admin.</p>
          <div className="flex items-center gap-3">
            <a href="/admin/crm" className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
              Ir para CRM Marketing
            </a>
            <button onClick={logout} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors">
              <LogOut className="w-3.5 h-3.5" />Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto crm-scrollbar pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
