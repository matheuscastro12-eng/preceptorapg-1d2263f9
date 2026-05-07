import { Link } from "react-router-dom";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import { LayoutGrid, Wallet, ArrowRight, LogOut } from "lucide-react";

export default function HubV3() {
  const { crmUser, hasMarketingAccess, hasAdminAccess, logout } = useCrmAuth();

  return (
    <div className="crm-v3" style={{ minHeight: "100vh", background: "var(--crm-bg)", padding: "56px 32px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="crm-brand-mark" style={{ width: 36, height: 36, fontSize: 20 }}>P</div>
            <div>
              <div className="crm-brand-name" style={{ fontSize: 16 }}>PreceptorMED</div>
              <div className="crm-brand-sub">crm · v3</div>
            </div>
          </div>
          <div className="crm-row" style={{ gap: 8 }}>
            <span className="crm-muted" style={{ fontSize: 12 }}>{crmUser?.username}</span>
            <button onClick={logout} className="crm-btn-icon" title="Sair"><LogOut /></button>
          </div>
        </header>

        <div className="crm-page-eyebrow">CRM Interno · PreceptorMED · v3</div>
        <h1 className="crm-page-title" style={{ fontSize: 48 }}>
          Um CRM <em>para tocar a empresa.</em>
        </h1>
        <p className="crm-page-sub" style={{ fontSize: 15, maxWidth: "60ch", marginBottom: 40 }}>
          Marketing (leads, funil, automações) e administração (DRE, fluxo de caixa, time, contratações) no mesmo sistema.
          Cada modo tem sua própria navegação e foco.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {hasMarketingAccess && (
            <Link to="/admin/crm-mkt" className="crm-card" style={{ padding: 28, textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--crm-green-deep)", color: "#fff", display: "grid", placeItems: "center" }}>
                  <LayoutGrid size={18} />
                </div>
                <span className="crm-mono" style={{ fontSize: 11, color: "#fff", background: "var(--crm-green-deep)", padding: "2px 8px", borderRadius: 3, letterSpacing: "0.07em" }}>MARKETING</span>
              </div>
              <div style={{ fontFamily: "var(--crm-sans)", fontSize: 24, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>
                Aquisição & engajamento
              </div>
              <p style={{ fontSize: 13, color: "var(--crm-ink-3)", lineHeight: 1.5, margin: "0 0 16px" }}>
                Dashboard, leads (2 481), funil, saúde dos alunos, churn (17 em risco), automações, e-mail, suporte.
              </p>
              <span className="crm-row" style={{ gap: 6, color: "var(--crm-green-deep)", fontSize: 13, fontWeight: 600 }}>
                Entrar <ArrowRight size={14} />
              </span>
            </Link>
          )}
          {hasAdminAccess && (
            <Link to="/admin/crm-admin" className="crm-card" style={{ padding: 28, textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--crm-ink)", color: "#fff", display: "grid", placeItems: "center" }}>
                  <Wallet size={18} />
                </div>
                <span className="crm-mono" style={{ fontSize: 11, color: "#fff", background: "var(--crm-ink)", padding: "2px 8px", borderRadius: 3, letterSpacing: "0.07em" }}>ADMIN</span>
              </div>
              <div style={{ fontFamily: "var(--crm-sans)", fontSize: 24, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>
                Finanças & people
              </div>
              <p style={{ fontSize: 13, color: "var(--crm-ink-3)", lineHeight: 1.5, margin: "0 0 16px" }}>
                DRE, fluxo de caixa, business plan, time (9 pessoas), 1:1s, PDIs, contratações (3 vagas), webhooks.
              </p>
              <span className="crm-row" style={{ gap: 6, color: "var(--crm-green-deep)", fontSize: 13, fontWeight: 600 }}>
                Entrar <ArrowRight size={14} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
