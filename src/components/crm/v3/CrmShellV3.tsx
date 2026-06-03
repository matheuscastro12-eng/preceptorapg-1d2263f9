import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import {
  LayoutGrid, Users, Filter, Heart, AlertTriangle, Zap, Mail,
  MessageSquare, Settings, Wallet, TrendingUp, Target, ListChecks,
  CalendarDays, Trophy, Briefcase, BarChart3, LogOut, Bell, Share2, Plus, Home, Activity,
  Menu, X, Gift, Image as ImageIcon, Megaphone,
} from "lucide-react";
import "@/styles/crm-design.css";

type Mode = "marketing" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  count?: string | number;
  pill?: string | number;
}

const MARKETING_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin/crm-mkt", label: "Dashboard", icon: LayoutGrid },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/crm-mkt/leads", label: "Leads", icon: Users },
      { to: "/admin/crm-mkt/funnel", label: "Funil & UTM", icon: Filter },
      { to: "/admin/crm-mkt/ads", label: "Meta Ads", icon: Megaphone },
      { to: "/admin/crm-mkt/aquisicao", label: "Aquisição", icon: Target },
      { to: "/admin/crm-mkt/landing-funnel", label: "Landing pages", icon: BarChart3 },
      { to: "/admin/crm-mkt/banners", label: "Banners da home", icon: ImageIcon },
      { to: "/admin/crm-mkt/health", label: "Saúde dos alunos", icon: Heart },
      { to: "/admin/crm-mkt/cohorts", label: "Coortes", icon: TrendingUp },
      { to: "/admin/crm-mkt/churn", label: "Risco de churn", icon: AlertTriangle },
      { to: "/admin/crm-mkt/automations", label: "Automações", icon: Zap },
      { to: "/admin/crm-mkt/templates-email", label: "E-mail templates", icon: Mail },
      { to: "/admin/crm-mkt/analytics", label: "Atividade & uso", icon: Activity },
      { to: "/admin/crm-mkt/roleta", label: "Roleta · Itajubá", icon: Gift },
      { to: "/admin/crm-mkt/suporte", label: "Suporte", icon: MessageSquare },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/admin/crm-mkt/users", label: "Usuários", icon: Users },
    ],
  },
];

const ADMIN_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin/crm-admin", label: "Dashboard", icon: LayoutGrid },
      { to: "/admin/crm-admin/relatorio", label: "Relatório executivo", icon: BarChart3 },
    ],
  },
  {
    label: "Finanças",
    items: [
      { to: "/admin/crm-admin/dre", label: "DRE & Receita", icon: Wallet },
      { to: "/admin/crm-admin/receita", label: "Receita", icon: TrendingUp },
      { to: "/admin/crm-admin/fluxo-caixa", label: "Fluxo de caixa", icon: TrendingUp },
      { to: "/admin/crm-admin/despesas", label: "Despesas", icon: BarChart3 },
      { to: "/admin/crm-admin/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
      { to: "/admin/crm-admin/forecast", label: "Business plan", icon: Target },
      { to: "/admin/crm-admin/metas", label: "Metas & OKRs", icon: Target },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/crm-admin/time", label: "Time", icon: Users },
      { to: "/admin/crm-admin/one-on-one", label: "1:1s", icon: CalendarDays },
      { to: "/admin/crm-admin/pdi", label: "PDIs", icon: ListChecks },
      { to: "/admin/crm-admin/carreira", label: "Carreira", icon: Trophy },
      { to: "/admin/crm-admin/contratacoes", label: "Contratações", icon: Briefcase },
      { to: "/admin/crm-admin/salarios", label: "Folha", icon: Wallet },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/crm-admin/easyflow", label: "Integrações", icon: Settings },
      { to: "/admin/crm-admin/webhooks", label: "Webhooks", icon: Zap },
    ],
  },
];

// Mapa de label legível por path (pra crumbs e topbar)
function pathLabel(pathname: string): string {
  const all = [...MARKETING_NAV, ...ADMIN_NAV].flatMap((s) => s.items);
  return all.find((i) => i.to === pathname.replace(/\/$/, ""))?.label ?? "Página";
}

// ============================================
// Context (passthrough — antiga API)
// ============================================
const ShellContext = createContext<{ register: (val: { topbarTools?: ReactNode }) => void } | null>(null);

// ============================================
// LAYOUTS — sidebar persistente + Outlet
// ============================================
export function CrmV3MarketingLayout() {
  return <CrmV3Shell mode="marketing" />;
}
export function CrmV3AdminLayout() {
  return <CrmV3Shell mode="admin" />;
}

function CrmV3Shell({ mode }: { mode: Mode }) {
  const { crmUser, logout, hasMarketingAccess, hasAdminAccess } = useCrmAuth();
  const location = useLocation();
  const nav = mode === "marketing" ? MARKETING_NAV : ADMIN_NAV;
  const [topbarTools, setTopbarTools] = useState<ReactNode>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-fecha drawer ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Trava scroll do body quando drawer aberto
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const initials = crmUser?.username
    ?.split(/[\s_.-]+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const cur = location.pathname.replace(/\/$/, "");
  const currentLabel = pathLabel(cur);

  return (
    <ShellContext.Provider value={{ register: ({ topbarTools }) => setTopbarTools(topbarTools ?? null) }}>
      <div className="crm-v3">
        {/* Backdrop mobile */}
        {mobileOpen && (
          <div
            className="crm-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}
        <div className="crm-app">
          <aside className={`crm-sidebar ${mobileOpen ? "is-open" : ""}`}>
            <button
              className="crm-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            <div className="crm-brand">
              <div className="crm-brand-mark">P</div>
              <div>
                <div className="crm-brand-name">PreceptorMED</div>
                <div className="crm-brand-sub">crm · v3</div>
              </div>
            </div>

            {hasMarketingAccess && hasAdminAccess && (
              <div className="crm-mode-toggle">
                <Link to="/admin/crm-mkt" className={mode === "marketing" ? "active" : ""}>Marketing</Link>
                <Link to="/admin/crm-admin" className={mode === "admin" ? "active" : ""}>Admin</Link>
              </div>
            )}

            {nav.map((section) => (
              <div className="crm-nav-section" key={section.label}>
                <div className="crm-nav-label">{section.label}</div>
                {section.items.map((it) => {
                  const Icon = it.icon;
                  const target = it.to.replace(/\/$/, "");
                  const isIndex = target === "/admin/crm-mkt" || target === "/admin/crm-admin";
                  const active = isIndex
                    ? cur === target
                    : cur === target || cur.startsWith(target + "/");
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={`crm-nav-item ${active ? "active" : ""}`}
                    >
                      <Icon className="crm-nav-icon" strokeWidth={1.8} />
                      <span style={{ flex: 1 }}>{it.label}</span>
                      {it.count !== undefined && <span className="crm-nav-count">{it.count}</span>}
                      {it.pill !== undefined && <span className="crm-nav-pill">{it.pill}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}

            <div className="crm-sidebar-foot">
              <div className="crm-avatar">{initials}</div>
              <div style={{ minWidth: 0, lineHeight: 1.25, flex: 1 }}>
                <div className="crm-user-name">{crmUser?.username || "—"}</div>
                <div className="crm-user-email">{crmUser?.role || ""}</div>
              </div>
              <Link to="/admin/crm" title="Ir ao hub" className="crm-btn-icon">
                <Home />
              </Link>
              <button onClick={logout} title="Sair" className="crm-btn-icon">
                <LogOut />
              </button>
            </div>
          </aside>

          <div className="crm-main">
            <header className="crm-topbar">
              <button
                className="crm-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>
              <div className="crm-crumbs">
                <span>CRM</span>
                <span className="sep">/</span>
                <span>{mode === "marketing" ? "Marketing" : "Admin"}</span>
                <span className="sep">/</span>
                <span className="now">{currentLabel}</span>
              </div>
              <div className="crm-topbar-tools">
                {topbarTools}
                <span className="crm-live">ao vivo</span>
                <button className="crm-btn-icon" title="Notificações"><Bell /></button>
                <button className="crm-btn-icon" title="Compartilhar"><Share2 /></button>
              </div>
            </header>
            {/* Sem key={pathname} — causa unmount/remount do Outlet e flash de tela.
                Fade controlado por CSS no primeiro paint apenas. */}
            <div className="crm-page-fade">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

// ============================================
// Componente legacy CrmShellV3 — agora passthrough
// (preserva API das páginas v3 já criadas)
// ============================================
interface ShellProps {
  mode?: Mode;
  crumbs?: { label: string; to?: string }[];
  topbarTools?: ReactNode;
  children: ReactNode;
}

export default function CrmShellV3({ topbarTools, children }: ShellProps) {
  const ctx = useContext(ShellContext);
  // Registra tools no shell pai (estável via JSON.stringify do tipo do nó)
  useEffect(() => {
    ctx?.register({ topbarTools });
    return () => ctx?.register({ topbarTools: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Retorna apenas children — o shell visual é renderizado pelos Layouts acima
  return <>{children}</>;
}

// ============================================
// HELPERS
// ============================================
export function PageHero({ eyebrow, title, sub, actions }: { eyebrow: string; title: ReactNode; sub?: string; actions?: ReactNode }) {
  return (
    <section className="crm-hero">
      <div>
        <div className="crm-page-eyebrow">{eyebrow}</div>
        <h1 className="crm-page-title">{title}</h1>
        {sub && <p className="crm-page-sub">{sub}</p>}
      </div>
      {actions && <div className="crm-row" style={{ gap: 8 }}>{actions}</div>}
    </section>
  );
}

export function PeriodBar({ options, active, onChange }: { options: string[]; active?: string; onChange?: (v: string) => void }) {
  return (
    <div className="crm-period-bar">
      {options.map((o) => (
        <button key={o} className={active === o ? "active" : ""} onClick={() => onChange?.(o)}>{o}</button>
      ))}
    </div>
  );
}

export function CardHead({ title, sub, side }: { title: ReactNode; sub?: string; side?: ReactNode }) {
  return (
    <div className="crm-card-head">
      <div>
        <div className="crm-card-title">{title}</div>
        {sub && <div className="crm-card-sub">{sub}</div>}
      </div>
      {side && <div className="crm-card-side">{side}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, sub, cta }: { icon?: typeof LayoutGrid; title: string; sub?: string; cta?: ReactNode }) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      border: "1px dashed var(--crm-line)",
      borderRadius: "var(--crm-radius)",
      background: "var(--crm-surface-2)",
    }}>
      {Icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--crm-green-soft)",
          color: "var(--crm-green-deep)",
          display: "grid", placeItems: "center",
          margin: "0 auto 12px",
        }}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
      )}
      <h3 style={{ margin: 0, fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.01em" }}>{title}</h3>
      {sub && <p style={{ margin: "6px auto 0", maxWidth: 420, fontSize: 13, color: "var(--crm-ink-3)", lineHeight: 1.5 }}>{sub}</p>}
      {cta && <div style={{ marginTop: 16 }}>{cta}</div>}
    </div>
  );
}

export function Sparkline({ d, color = "#1B5E3B", area = false }: { d: string; color?: string; area?: boolean }) {
  return (
    <svg className="crm-kpi-spark" viewBox="0 0 100 28" preserveAspectRatio="none">
      <path d={d} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {area && <path d={`${d} L100,28 L0,28 Z`} fill={color} fillOpacity={0.08} />}
    </svg>
  );
}

export function Kpi({
  label, value, unit, delta, deltaSign, deltaText, sparkD, accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaSign?: "pos" | "neg" | "flat";
  deltaText?: string;
  sparkD?: string;
  accent?: "mrr" | "warn" | "neg";
}) {
  return (
    <div className={`crm-kpi ${accent ? `k-${accent}` : ""}`}>
      <div className="crm-kpi-label">{label}</div>
      <div className="crm-kpi-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {(delta || deltaText) && (
        <div className="crm-kpi-meta">
          {delta && <span className={`crm-delta crm-delta-${deltaSign || "flat"}`}>{delta}</span>}
          {deltaText && <span>{deltaText}</span>}
        </div>
      )}
      {sparkD && <Sparkline d={sparkD} color={accent === "neg" ? "#B6452C" : accent === "warn" ? "#A88A33" : "#1B5E3B"} area={accent === "mrr"} />}
    </div>
  );
}
