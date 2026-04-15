import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, Heart, AlertTriangle, Zap,
  ChevronDown, Activity, UserCog, BarChart3, ArrowLeft, LogOut, Menu, X,
  LifeBuoy, Mail,
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
      { to: "/admin/crm-mkt/templates-email", label: "Templates Email", icon: Mail },
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
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006D5B] to-[#005344] flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Activity className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">Preceptor</p>
              <p className="text-[10px] text-gray-500 font-medium">CRM</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav sections */}
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
                    hasActive ? "text-emerald-400" : "text-gray-500 hover:text-gray-400"
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
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                          }`}
                        >
                          <Icon className={`w-[15px] h-[15px] flex-shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-400"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center text-[11px] font-bold text-emerald-300">
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
    </>
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#006D5B] to-[#005344] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <p className="text-sm font-semibold text-white">CRM</p>
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
        w-64 min-h-screen bg-[#0a0a0f] border-r border-white/[0.04] flex flex-col
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
