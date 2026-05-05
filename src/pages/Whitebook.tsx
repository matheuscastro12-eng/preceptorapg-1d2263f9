import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  useWhitebookCalculators,
  useWhitebookDrugs,
  useWhitebookProtocols,
  useWhitebookIcd,
} from "@/hooks/useWhitebookSearch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  Search, Calculator, Pill, ListChecks, FileText,
  ChevronRight, Sparkles, BookOpen, Wand2,
} from "lucide-react";
import WhitebookAiDrawer from "@/components/whitebook/WhitebookAiDrawer";

type Tab = "calc" | "drug" | "protocol" | "icd";

const Whitebook = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("calc");
  const [aiOpen, setAiOpen] = useState(false);

  const { items: calcs, loading: loadingCalcs } = useWhitebookCalculators(query);
  const { items: drugs, loading: loadingDrugs } = useWhitebookDrugs(query);
  const { items: protocols, loading: loadingProtocols } = useWhitebookProtocols(query);
  const { items: icds, loading: loadingIcd } = useWhitebookIcd(query);

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
            PreceptorBook
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
            Sua referência médica de bolso, com{" "}
            <em className="not-italic font-medium text-[#8a6f26]">PreceptorMED acoplado</em>.
          </h1>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "icd"
                  ? "Buscar por código (ex: I21) ou descrição…"
                  : "Buscar calculadora, droga, condição clínica…"
              }
              autoFocus
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-white text-base placeholder-[#94a3b8] outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow font-['Manrope']"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabPill
            icon={Calculator}
            label="Calculadoras"
            count={calcs.length}
            active={tab === "calc"}
            onClick={() => setTab("calc")}
          />
          <TabPill
            icon={Pill}
            label="Drogas"
            count={drugs.length}
            active={tab === "drug"}
            onClick={() => setTab("drug")}
          />
          <TabPill
            icon={ListChecks}
            label="Protocolos"
            count={protocols.length}
            active={tab === "protocol"}
            onClick={() => setTab("protocol")}
          />
          <TabPill
            icon={FileText}
            label="CID-10"
            count={icds.length}
            active={tab === "icd"}
            onClick={() => setTab("icd")}
          />
        </div>

        {/* Conteudo */}
        {tab === "calc" && (
          <CalcsBlock
            loading={loadingCalcs}
            items={calcs}
            onClick={(slug) => navigate(`/whitebook/calculator/${slug}`)}
            query={query}
          />
        )}
        {tab === "drug" && (
          <DrugsBlock
            loading={loadingDrugs}
            items={drugs}
            onClick={(slug) => navigate(`/whitebook/drug/${slug}`)}
            query={query}
          />
        )}
        {tab === "protocol" && (
          <ProtocolsBlock
            loading={loadingProtocols}
            items={protocols}
            onClick={(slug) => navigate(`/whitebook/protocol/${slug}`)}
            query={query}
          />
        )}
        {tab === "icd" && (
          <IcdBlock loading={loadingIcd} items={icds} query={query} />
        )}

        {/* Footer */}
        <div className="mt-12 p-4 rounded-xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-[#8a6f26] shrink-0 mt-0.5" />
          <p className="text-xs text-[#4a5568] leading-relaxed">
            Conteúdo construído de fontes públicas (ANVISA, diretrizes
            SBC/SBP/Febrasgo/SBI, DATASUS, OMS) com síntese editorial. Cada
            item cita sua fonte primária. <strong>Não substitui julgamento
            clínico nem consulta à fonte original antes de prescrever.</strong>
          </p>
        </div>
      </div>

      {/* Floating AI button — escopo global */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] transition-shadow"
      >
        <Wand2 className="w-4 h-4 text-[#C9A84C]" />
        Pergunte ao PreceptorMED
      </button>

      <WhitebookAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        scope={null}
      />
    </DashboardLayout>
  );
};

export default Whitebook;

// ────────────────────────────────────────────────────────────
function TabPill({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: typeof Calculator;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-xs font-semibold border-2 transition-colors ${
        active
          ? "bg-[#191C1D] text-white border-[#191C1D]"
          : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={`font-mono ${active ? "opacity-80" : "text-[#94a3b8]"}`}>
        {count}
      </span>
    </button>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ query, kind }: { query: string; kind: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
      <div className="inline-flex w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
        <Sparkles className="w-6 h-6 text-[#94a3b8]" />
      </div>
      <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-1">
        {query ? `Nada encontrado para "${query}"` : `Sem ${kind} ainda`}
      </h3>
      <p className="text-sm text-[#4a5568]">
        {query
          ? "Tente outros termos ou troque de aba."
          : `O catálogo de ${kind.toLowerCase()} está em construção.`}
      </p>
    </div>
  );
}

// ────── Blocks por tipo ──────
function CalcsBlock({
  loading, items, onClick, query,
}: {
  loading: boolean;
  items: ReturnType<typeof useWhitebookCalculators>["items"];
  onClick: (slug: string) => void;
  query: string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const c of items) {
      const arr = map.get(c.categoria) ?? [];
      arr.push(c);
      map.set(c.categoria, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  if (loading) return <SkeletonGrid />;
  if (items.length === 0) return <EmptyState query={query} kind="calculadoras" />;
  return (
    <div className="space-y-6">
      {groups.map(([cat, list]) => (
        <section key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
              {cat}
            </h3>
            <span className="font-mono text-[10.5px] text-[#94a3b8]">{list.length}</span>
            <div className="flex-1 h-px bg-slate-200 ml-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {list.map((c) => (
              <ItemCard
                key={c.id}
                icon={Calculator}
                title={c.nome}
                subtitle={c.descricao ?? undefined}
                onClick={() => onClick(c.slug)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DrugsBlock({
  loading, items, onClick, query,
}: {
  loading: boolean;
  items: ReturnType<typeof useWhitebookDrugs>["items"];
  onClick: (slug: string) => void;
  query: string;
}) {
  if (loading) return <SkeletonGrid />;
  if (items.length === 0) return <EmptyState query={query} kind="drogas" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((d) => (
        <ItemCard
          key={d.id}
          icon={Pill}
          title={d.nome_principio}
          subtitle={
            [d.classe_terapeutica, d.nome_comercial?.slice(0, 2).join(" · ")]
              .filter(Boolean)
              .join(" — ") || undefined
          }
          onClick={() => onClick(d.slug)}
        />
      ))}
    </div>
  );
}

function ProtocolsBlock({
  loading, items, onClick, query,
}: {
  loading: boolean;
  items: ReturnType<typeof useWhitebookProtocols>["items"];
  onClick: (slug: string) => void;
  query: string;
}) {
  if (loading) return <SkeletonGrid />;
  if (items.length === 0) return <EmptyState query={query} kind="protocolos" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((p) => (
        <ItemCard
          key={p.id}
          icon={ListChecks}
          title={p.titulo}
          subtitle={[p.categoria, p.resumo].filter(Boolean).join(" — ")}
          onClick={() => onClick(p.slug)}
        />
      ))}
    </div>
  );
}

function IcdBlock({
  loading, items, query,
}: {
  loading: boolean;
  items: ReturnType<typeof useWhitebookIcd>["items"];
  query: string;
}) {
  if (loading) return <SkeletonGrid count={4} />;
  if (!query.trim()) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
        <FileText className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
        <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-1">
          Busque um código ou doença
        </h3>
        <p className="text-sm text-[#4a5568]">
          Digite acima — ex: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">I21</code>,{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">diabetes</code>,{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">hipertensão</code>.
        </p>
      </div>
    );
  }
  if (items.length === 0) return <EmptyState query={query} kind="códigos" />;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {items.map((c, i) => (
        <div
          key={c.code}
          className={`flex items-center gap-3 px-4 py-3 ${
            i > 0 ? "border-t border-slate-100" : ""
          }`}
        >
          <span className="font-mono font-bold text-sm text-[#005344] shrink-0 w-16">
            {c.code}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#191C1D] leading-snug">{c.descricao_pt}</p>
            {c.capitulo_titulo && (
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Cap. {c.capitulo} — {c.capitulo_titulo}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Pill;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#005344]/30 hover:shadow-[0_4px_12px_-4px_rgba(0,109,91,0.12)] transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#005344]/10 to-[#C9A84C]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#005344]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-['Manrope'] font-bold text-sm text-[#191C1D] leading-snug group-hover:text-[#005344] transition-colors">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[#4a5568] mt-1 leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0 mt-2 group-hover:text-[#005344] transition-colors" />
      </div>
    </button>
  );
}
