import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, Heart, AlertTriangle, Zap,
  ChevronDown, Activity, UserCog, BarChart3, ArrowLeft, LogOut, Menu, X,
  LifeBuoy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

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
    label: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { to: "/admin/crm-mkt", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/crm-mkt/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Gestão",
    icon: Users,
    items: [
      { to: "/admin/crm-mkt/users", label: "Usuários", icon: UserCog },
      { to: "/admin/crm-mkt/leads", label: "Lead Intelligence", icon: Users },
      { to: "/admin/crm-mkt/funnel", label: "Funil de Conversão", icon: TrendingUp },
    ],
  },
  {
    label: "Retenção",
    icon: Heart,
    items: [
      { to: "/admin/crm-mkt/health", label: "Health Score", icon: Heart },
      { to: "/admin/crm-mkt/churn", label: "Anti-Churn", icon: AlertTriangle },
      { to: "/admin/crm-mkt/automations", label: "Automações", icon: Zap },
    ],
  },
  {
    label: "Suporte",
    icon: LifeBuoy,
    items: [
      { to: "/admin/crm-mkt/suporte", label: "Suporte & Feedback", icon: LifeBuoy },
    ],
  },
];

export default function Sidebar() {
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B5E3B] to-[#14472d] flex items-center justify-center shadow-lg shadow-[#1B5E3B]/10">
              <Activity className="w-4.5 h-4.5 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">Preceptor CRM</p>
              <p className="text-[10px] text-gray-500">Inteligência Estratégica</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
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
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    hasActive
                      ? "text-[#4ade80] bg-[#1B5E3B]/20"
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
                              ? "bg-[#1B5E3B]/30 text-[#4ade80]"
                              : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1B5E3B] to-[#14472d] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#C9A84C]" />
            </div>
            <p className="text-sm font-bold text-white">CRM</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/30 rounded-full border border-green-800/50">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - desktop: static, mobile: slide-in drawer */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 min-h-screen bg-gray-900 border-r border-gray-800/50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
