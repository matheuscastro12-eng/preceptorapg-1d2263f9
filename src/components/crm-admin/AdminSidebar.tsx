import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, CreditCard, ArrowLeftRight,
  Users, Wallet, UserPlus, Target, FileBarChart, AlertTriangle,
  ChevronDown, Building2, ArrowLeft, LogOut, Menu, X,
  Calendar, Crosshair, TrendingUp, LineChart, Sheet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import ChangePasswordModal from "@/components/crm/ChangePasswordModal";
import NotificationBell from "@/components/crm/NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Financeiro",
    icon: DollarSign,
    items: [
      { to: "/admin/crm-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/crm-admin/receita", label: "Receita & MRR", icon: DollarSign },
      { to: "/admin/crm-admin/despesas", label: "Despesas", icon: CreditCard },
      { to: "/admin/crm-admin/fluxo-caixa", label: "Fluxo de Caixa", icon: ArrowLeftRight },
      { to: "/admin/crm-admin/easyflow", label: "EasyFlow", icon: Wallet },
      { to: "/admin/crm-admin/webhooks", label: "Webhooks", icon: AlertTriangle },
      { to: "/admin/crm-admin/inadimplencia", label: "Inadimplencia", icon: AlertTriangle },
    ],
  },
  {
    label: "Business Plan",
    icon: LineChart,
    items: [
      { to: "/admin/crm-admin/forecast", label: "Forecast & BP", icon: LineChart },
      { to: "/admin/crm-admin/dre", label: "DRE", icon: Sheet },
    ],
  },
  {
    label: "People",
    icon: Users,
    items: [
      { to: "/admin/crm-admin/time", label: "Time", icon: Users },
      { to: "/admin/crm-admin/salarios", label: "Salarios", icon: Wallet },
      { to: "/admin/crm-admin/contratacoes", label: "Contratacoes", icon: UserPlus },
      { to: "/admin/crm-admin/one-on-one", label: "1:1", icon: Calendar },
      { to: "/admin/crm-admin/pdi", label: "PDI", icon: Crosshair },
      { to: "/admin/crm-admin/carreira", label: "Plano de Carreira", icon: TrendingUp },
      { to: "/admin/crm-admin/metas", label: "Metas & OKRs", icon: Target },
    ],
  },
  {
    label: "Relatorios",
    icon: FileBarChart,
    items: [
      { to: "/admin/crm-admin/relatorio", label: "Relatorio Investidor", icon: FileBarChart },
    ],
  },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { crmUser, logout } = useCrmAuth();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitialExpanded = () => {
    const expanded: Record<string, boolean> = {};
    sections.forEach((section) => {
      const hasActive = section.items.some((item) =>
        item.exact ? pathname === item.to : pathname.startsWith(item.to)
      );
      expanded[section.label] = hasActive;
    });
    return expanded;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(getInitialExpanded);

  const toggleSection = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#a88a3a] flex items-center justify-center shadow-lg shadow-[#C9A84C]/10">
              <Building2 className="w-4 h-4 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">Preceptor</p>
              <p className="text-[10px] text-gray-500 font-medium">Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <div className="space-y-0.5">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expanded[section.label] ?? false;
            const hasActive = section.items.some((item) =>
              item.exact ? pathname === item.to : pathname.startsWith(item.to)
            );

            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ${
                    hasActive
                      ? "text-[#C9A84C]"
                      : "text-gray-500 hover:text-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                </button>

                <div className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="ml-3 pl-3 border-l border-white/[0.04] space-y-0.5 py-1">
                    {section.items.map((item) => {
                      const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`group flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                              : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                          }`}
                        >
                          <Icon className={`w-[15px] h-[15px] flex-shrink-0 transition-colors ${isActive ? "text-[#C9A84C]" : "text-gray-500 group-hover:text-gray-400"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/50" />
                          )}
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9px] font-bold">{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.04]">
        {crmUser && (
          <div className="mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300">
                {(crmUser.nome || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 font-medium truncate">{crmUser.nome}</p>
                <p className="text-[10px] text-gray-600">{crmUser.role}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => setShowPwdModal(true)} className="text-[10px] text-gray-600 hover:text-gray-400 mt-1.5 ml-11 transition-colors">
              Minha conta
            </button>
          </div>
        )}
        {showPwdModal && <ChangePasswordModal onClose={() => setShowPwdModal(false)} />}
        <Link to="/admin/crm" className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3 h-3" />Voltar ao Hub
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#a88a3a] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-gray-900" />
            </div>
            <p className="text-sm font-semibold text-white">Admin</p>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 min-h-screen bg-[#0a0a0f] border-r border-white/[0.04]
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
