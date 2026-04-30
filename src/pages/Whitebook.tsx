import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useWhitebookCalculators } from "@/hooks/useWhitebookSearch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  Search, Calculator, Pill, ListChecks, FileText,
  ChevronRight, Sparkles, BookOpen,
} from "lucide-react";

const Whitebook = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { items: calcs, loading: loadingCalcs } = useWhitebookCalculators(query);

  if (authLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  if (!hasFeature) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Whitebook PreceptorMED
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
            Sua referência médica de bolso, com{" "}
            <em className="not-italic font-medium text-[#8a6f26]">IA acoplada</em>.
          </h1>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar calculadora, escore ou condição clínica…"
              autoFocus
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-white text-base placeholder-[#94a3b8] outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow font-['Manrope']"
            />
          </div>
          <p className="text-xs text-[#4a5568] mt-2 ml-2">
            <strong>Dica:</strong> tente "fibrilação", "sepse", "TEP", "MELD", "IMC"…
          </p>
        </div>

        {/* Tabs by tipo (futuro: drogas, protocolos, ICD-10) */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Pill_ icon={Calculator} label="Calculadoras" count={calcs.length} active />
          <Pill_ icon={Pill} label="Drogas" count={0} disabled tooltip="Em curadoria" />
          <Pill_ icon={ListChecks} label="Protocolos" count={0} disabled tooltip="Em curadoria" />
          <Pill_ icon={FileText} label="CID-10" count={0} disabled tooltip="Em curadoria" />
        </div>

        {/* Lista calculadoras */}
        {loadingCalcs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : calcs.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <CalcsByCategory
            calcs={calcs}
            onClick={(slug) => navigate(`/whitebook/calculator/${slug}`)}
          />
        )}

        {/* Footer note */}
        <div className="mt-12 p-4 rounded-xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-[#8a6f26] shrink-0 mt-0.5" />
          <p className="text-xs text-[#4a5568] leading-relaxed">
            Conteúdo construído de fontes públicas brasileiras e internacionais
            (ANVISA, diretrizes SBC/SBP/Febrasgo, DATASUS, OMS). Cada item cita
            sua fonte primária. <strong>Não substitui julgamento clínico.</strong>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Whitebook;

// ────────────────────────────────────────────────────────────
function Pill_({
  icon: Icon,
  label,
  count,
  active,
  disabled,
  tooltip,
}: {
  icon: typeof Calculator;
  label: string;
  count: number;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      disabled={disabled}
      title={tooltip}
      className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-xs font-semibold border-2 transition-colors ${
        active
          ? "bg-[#191C1D] text-white border-[#191C1D]"
          : disabled
            ? "bg-slate-50 text-[#94a3b8] border-slate-200 cursor-not-allowed"
            : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={`font-mono ${active ? "opacity-80" : ""}`}>{count}</span>
    </button>
  );
}

function CalcsByCategory({
  calcs,
  onClick,
}: {
  calcs: ReturnType<typeof useWhitebookCalculators>["items"];
  onClick: (slug: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof calcs>();
    for (const c of calcs) {
      const arr = map.get(c.categoria) ?? [];
      arr.push(c);
      map.set(c.categoria, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [calcs]);

  return (
    <div className="space-y-6">
      {groups.map(([cat, items]) => (
        <section key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
              {cat}
            </h3>
            <span className="font-mono text-[10.5px] text-[#94a3b8]">{items.length}</span>
            <div className="flex-1 h-px bg-slate-200 ml-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((c) => (
              <button
                key={c.id}
                onClick={() => onClick(c.slug)}
                className="group text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#005344]/30 hover:shadow-[0_4px_12px_-4px_rgba(0,109,91,0.12)] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#005344]/10 to-[#C9A84C]/10 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-[#005344]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Manrope'] font-bold text-sm text-[#191C1D] leading-snug group-hover:text-[#005344] transition-colors">
                      {c.nome}
                    </h4>
                    {c.descricao && (
                      <p className="text-xs text-[#4a5568] mt-1 leading-relaxed line-clamp-2">
                        {c.descricao}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0 mt-2 group-hover:text-[#005344] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
      <div className="inline-flex w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
        <Sparkles className="w-6 h-6 text-[#94a3b8]" />
      </div>
      <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-1">
        {query ? `Nada encontrado para "${query}"` : "Sem calculadoras ainda"}
      </h3>
      <p className="text-sm text-[#4a5568]">
        {query
          ? "Tente outros termos ou navegue por categoria."
          : "O catálogo está em construção."}
      </p>
    </div>
  );
}
