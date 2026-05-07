import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import "@/styles/crm-design.css";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import {
  LayoutGrid, Activity, Users, Filter, Heart, AlertTriangle, Zap, Mail,
  MessageSquare, Settings, Wallet, TrendingUp, Target, ListChecks,
  CalendarDays, Trophy, Briefcase, BarChart3, LogOut, Search, Bell, Share2, Plus,
} from "lucide-react";

type Mode = "marketing" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  count?: string | number;
  pill?: string | number;
  dot?: boolean;
}

const MARKETING_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin/crm-mkt", label: "Dashboard", icon: LayoutGrid },
      { to: "/admin/crm", label: "Hub", icon: Activity },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/crm-mkt/leads", label: "Leads", icon: Users, count: "2 481" },
      { to: "/admin/crm-mkt/funnel", label: "Funil & UTM", icon: Filter },
      { to: "/admin/crm-mkt/health", label: "Saúde dos alunos", icon: Heart },
      { to: "/admin/crm-mkt/churn", label: "Risco de churn", icon: AlertTriangle, pill: 17 },
      { to: "/admin/crm-mkt/automations", label: "Automações", icon: Zap },
      { to: "/admin/crm-mkt/templates-email", label: "E-mail templates", icon: Mail },
      { to: "/admin/crm-mkt/suporte", label: "Suporte", icon: MessageSquare },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/crm-mkt/users", label: "Configurações", icon: Settings },
    ],
  },
];

const ADMIN_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin/crm-admin", label: "Dashboard", icon: LayoutGrid },
    ],
  },
  {
    label: "Finanças",
    items: [
      { to: "/admin/crm-admin/dre", label: "DRE & Receita", icon: Wallet },
      { to: "/admin/crm-admin/fluxo-caixa", label: "Fluxo de caixa", icon: TrendingUp },
      { to: "/admin/crm-admin/despesas", label: "Despesas", icon: BarChart3 },
      { to: "/admin/crm-admin/forecast", label: "Business plan", icon: Target, count: "2026" },
      { to: "/admin/crm-admin/metas", label: "Metas", icon: Target },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/crm-admin/time", label: "Time", icon: Users, count: "9" },
      { to: "/admin/crm-admin/one-on-one", label: "1:1 & PDIs", icon: CalendarDays },
      { to: "/admin/crm-admin/carreira", label: "Carreira & promoções", icon: Trophy },
      { to: "/admin/crm-admin/contratacoes", label: "Contratações", icon: Briefcase, count: "3" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/crm-admin/easyflow", label: "Configurações", icon: Settings },
    ],
  },
];

interface ShellProps {
  mode: Mode;
  crumbs: { label: string; to?: string }[];
  topbarTools?: ReactNode;
  children: ReactNode;
}

export default function CrmShellV3({ mode, crumbs, topbarTools, children }: ShellProps) {
  const { crmUser, logout, hasMarketingAccess, hasAdminAccess } = useCrmAuth();
  const location = useLocation();
  const nav = mode === "marketing" ? MARKETING_NAV : ADMIN_NAV;

  const initials = crmUser?.username
    ?.split(/[\s_.-]+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="crm-v3">
      <div className="crm-app">
        {/* Sidebar */}
        <aside className="crm-sidebar">
          <div className="crm-brand">
            <div className="crm-brand-mark">P</div>
            <div>
              <div className="crm-brand-name">PreceptorMED</div>
              <div className="crm-brand-sub">crm · v3</div>
            </div>
          </div>

          {hasMarketingAccess && hasAdminAccess && (
            <div className="crm-mode-toggle">
              <Link to="/admin/crm" className={mode === "marketing" ? "active" : ""}>Marketing</Link>
              <Link to="/admin/crm-admin" className={mode === "admin" ? "active" : ""}>Admin</Link>
            </div>
          )}

          {nav.map((section) => (
            <div className="crm-nav-section" key={section.label}>
              <div className="crm-nav-label">{section.label}</div>
              {section.items.map((it) => {
                const Icon = it.icon;
                const cur = location.pathname.replace(/\/$/, "");
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
                    <span style={{ flex: it.count || it.pill || it.dot ? "initial" : 1 }}>{it.label}</span>
                    {it.count !== undefined && <span className="crm-nav-count">{it.count}</span>}
                    {it.pill !== undefined && <span className="crm-nav-pill">{it.pill}</span>}
                    {it.dot && (
                      <span style={{
                        marginLeft: "auto",
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--crm-gold-deep)",
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="crm-sidebar-foot">
            <div className="crm-avatar">{initials}</div>
            <div style={{ minWidth: 0, lineHeight: 1.25 }}>
              <div className="crm-user-name">{crmUser?.username || "—"}</div>
              <div className="crm-user-email">{crmUser?.role || ""}</div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="crm-btn-icon"
              style={{ marginLeft: "auto" }}
            >
              <LogOut />
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="crm-main">
          <header className="crm-topbar">
            <div className="crm-crumbs">
              {crumbs.map((c, i) => (
                <span key={i} className={i === crumbs.length - 1 ? "now" : ""}>
                  {i > 0 && <span className="sep" style={{ marginRight: 6, marginLeft: 0 }}>/</span>}
                  {c.to ? <Link to={c.to} style={{ color: "inherit", textDecoration: "none" }}>{c.label}</Link> : c.label}
                </span>
              ))}
            </div>
            <div className="crm-topbar-tools">
              {topbarTools}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

// helpers compartilhados
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
