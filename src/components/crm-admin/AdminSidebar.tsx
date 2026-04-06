import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, CreditCard, ArrowLeftRight,
  Users, Wallet, UserPlus, Target, FileBarChart,
  ChevronDown, Building2, ArrowLeft, LogOut,
  Calendar, Crosshair, TrendingUp, LineChart, Sheet,
} from "lucide-react";
import { useState } from "react";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import ChangePasswordModal from "@/components/crm/ChangePasswordModal";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
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
      { to: "/admin/crm-admin/salarios", label: "Salários", icon: Wallet },
      { to: "/admin/crm-admin/contratacoes", label: "Contratações", icon: UserPlus },
      { to: "/admin/crm-admin/one-on-one", label: "1:1", icon: Calendar },
      { to: "/admin/crm-admin/pdi", label: "PDI", icon: Crosshair },
      { to: "/admin/crm-admin/carreira", label: "Plano de Carreira", icon: TrendingUp },
      { to: "/admin/crm-admin/metas", label: "Metas & OKRs", icon: Target },
    ],
  },
  {
    label: "Relatórios",
    icon: FileBarChart,
    items: [
      { to: "/admin/crm-admin/relatorio", label: "Relatório Investidor", icon: FileBarChart },
    ],
  },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { crmUser, logout } = useCrmAuth();
  const [showPwdModal, setShowPwdModal] = useState(false);

  // Auto-expand sections that contain active route
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

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800/50 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#b8943d] flex items-center justify-center shadow-lg shadow-[#C9A84C]/10">
            <Building2 className="w-4.5 h-4.5 text-gray-900" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Preceptor Admin</p>
            <p className="text-[10px] text-gray-500">Finanças & People</p>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto crm-scrollbar">
        <div className="space-y-1">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expanded[section.label] ?? false;
            const hasActive = section.items.some((item) =>
              item.exact ? pathname === item.to : pathname.startsWith(item.to)
            );

            return (
              <div key={section.label}>
                {/* Section header — clickable */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    hasActive
                      ? "text-[#C9A84C] bg-[#C9A84C]/5"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Collapsible items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isExpanded ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ml-2 pl-3 border-l border-gray-800/60 space-y-0.5 pb-2">
                    {section.items.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.to
                        : pathname.startsWith(item.to);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                              : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
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
      <div className="px-5 py-4 border-t border-gray-800/50 space-y-3">
        {crmUser && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-300 font-medium">{crmUser.nome}</p>
                <p className="text-[10px] text-gray-600">{crmUser.role}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors" title="Sair">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => setShowPwdModal(true)} className="text-[10px] text-gray-600 hover:text-gray-400 mt-1 transition-colors">
              Minha conta
            </button>
          </div>
        )}
        {showPwdModal && <ChangePasswordModal onClose={() => setShowPwdModal(false)} />}
        <Link to="/admin/crm" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3 h-3" />Voltar ao Hub
        </Link>
      </div>
    </aside>
  );
}
