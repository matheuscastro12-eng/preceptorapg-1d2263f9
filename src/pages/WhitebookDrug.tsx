import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, Pill, AlertTriangle, BookOpen, ExternalLink, Heart, Baby,
  User as UserIcon, Beaker, Info, ShieldAlert, Wand2, Activity,
} from "lucide-react";
import WhitebookAiDrawer from "@/components/whitebook/WhitebookAiDrawer";

// Schema rico (formato real do seed)
interface Apresentacao {
  forma?: string;
  concentracao?: string;
}
interface Indicacao {
  para?: string;
  dose?: string;
  frequencia?: string;
  max?: string;
  max_dia?: string;
  duracao?: string;
  via?: string;
  obs?: string;
}
interface DoseAdulto {
  indicacoes?: Indicacao[];
  iv?: { dose?: string; frequencia?: string; max?: string };
  max_dia?: string;
  obs_geral?: string;
  equivalencia?: string;
}
interface DosePediatrica {
  indicacoes?: Indicacao[];
  atencao?: string;
}
interface DoseIdoso {
  obs?: string;
  max_dia?: string;
}
interface AjusteRenal {
  clcr?: string;
  ajuste?: string;
}
interface AjusteHepatico {
  contexto?: string;
  ajuste?: string;
}
interface Interacao {
  com?: string;
  efeito?: string;
  manejo?: string;
}
interface EfeitoAdverso {
  freq?: string;
  evento?: string;
}

interface DrugFull {
  id: string;
  slug: string;
  nome_principio: string;
  nome_comercial: string[] | null;
  classe_terapeutica: string | null;
  via_administracao: string[] | null;
  apresentacoes: Apresentacao[] | null;
  dose_adulto: DoseAdulto | null;
  dose_pediatrica: DosePediatrica | null;
  dose_idoso: DoseIdoso | null;
  ajuste_renal: AjusteRenal[] | null;
  ajuste_hepatico: AjusteHepatico[] | null;
  gestacao_categoria: string | null;
  gestacao_obs: string | null;
  lactacao: string | null;
  interacoes: Interacao[] | null;
  contraindicacoes: string[] | null;
  efeitos_adversos: EfeitoAdverso[] | null;
  alertas_seguranca: string[] | null;
  monitoramento: string[] | null;
  bula_fonte_url: string | null;
}

const SEVERITY_TONE: Record<string, string> = {
  comum: "bg-amber-100 text-amber-800",
  incomum: "bg-orange-100 text-orange-800",
  raro: "bg-red-100 text-red-800",
};

const tonOfFreq = (f?: string): string => {
  if (!f) return "bg-slate-100 text-slate-700";
  const k = f.toLowerCase();
  for (const key of Object.keys(SEVERITY_TONE)) {
    if (k.includes(key)) return SEVERITY_TONE[key];
  }
  return "bg-slate-100 text-slate-700";
};

const WhitebookDrug = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DrugFull | null>(null);
  const [loadingDrug, setLoadingDrug] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("wb_drugs")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (alive) {
        setDrug((data as DrugFull) ?? null);
        setLoadingDrug(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (authLoading || loading || loadingDrug) return <PageSkeleton variant="dashboard" />;
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

  if (!drug) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Droga não encontrada
          </h1>
          <button
            onClick={() => navigate("/whitebook")}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const hasAdultoIndicacoes = drug.dose_adulto?.indicacoes && drug.dose_adulto.indicacoes.length > 0;
  const hasPedsIndicacoes = drug.dose_pediatrica?.indicacoes && drug.dose_pediatrica.indicacoes.length > 0;
  const hasIdoso = drug.dose_idoso?.obs || drug.dose_idoso?.max_dia;
  const hasAjusteRenal = drug.ajuste_renal && drug.ajuste_renal.length > 0;
  const hasAjusteHepatico = drug.ajuste_hepatico && drug.ajuste_hepatico.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/whitebook")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          PreceptorBook
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
            <Pill className="w-6 h-6 text-[#005344]" />
          </div>
          <div className="flex-1">
            {drug.classe_terapeutica && (
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] mb-1">
                {drug.classe_terapeutica}
              </p>
            )}
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] leading-[1.1]">
              {drug.nome_principio}
            </h1>
            {drug.nome_comercial && drug.nome_comercial.length > 0 && (
              <p className="text-sm text-[#4a5568] mt-1.5">
                <span className="text-[#94a3b8]">Comerciais:</span>{" "}
                {drug.nome_comercial.join(" · ")}
              </p>
            )}
            {drug.via_administracao && drug.via_administracao.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {drug.via_administracao.map((v) => (
                  <span
                    key={v}
                    className="text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#4a5568]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas de segurança */}
        {drug.alertas_seguranca && drug.alertas_seguranca.length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-red-700 mb-1">
                Alertas de segurança
              </p>
              <ul className="text-sm text-red-900 leading-relaxed space-y-1">
                {drug.alertas_seguranca.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Apresentações */}
        {drug.apresentacoes && drug.apresentacoes.length > 0 && (
          <Section icon={Beaker} title="Apresentações">
            <div className="flex flex-wrap gap-2">
              {drug.apresentacoes.map((a, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#191C1D]"
                >
                  {a.forma ? <strong>{a.forma}</strong> : null}
                  {a.forma && a.concentracao ? " · " : null}
                  {a.concentracao}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Doses Adulto */}
        {hasAdultoIndicacoes && (
          <Section icon={UserIcon} title="Dose adulto">
            <div className="space-y-3">
              {drug.dose_adulto!.indicacoes!.map((ind, i) => (
                <IndicacaoCard key={i} ind={ind} />
              ))}
              {drug.dose_adulto?.iv && (
                <div className="p-3 rounded-lg bg-blue-50 border-l-3 border-blue-400">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-blue-700 mb-1">
                    Endovenoso
                  </p>
                  <p className="text-sm text-[#191C1D]">
                    {drug.dose_adulto.iv.dose}
                    {drug.dose_adulto.iv.frequencia && ` · ${drug.dose_adulto.iv.frequencia}`}
                    {drug.dose_adulto.iv.max && ` · máx ${drug.dose_adulto.iv.max}`}
                  </p>
                </div>
              )}
              {drug.dose_adulto?.max_dia && (
                <div className="text-xs text-[#4a5568] italic px-1">
                  <strong>Dose máxima diária:</strong> {drug.dose_adulto.max_dia}
                </div>
              )}
              {drug.dose_adulto?.obs_geral && (
                <div className="text-xs text-[#4a5568] italic px-1">
                  {drug.dose_adulto.obs_geral}
                </div>
              )}
              {drug.dose_adulto?.equivalencia && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Equivalência:</strong> {drug.dose_adulto.equivalencia}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Doses Pediátricas */}
        {hasPedsIndicacoes && (
          <Section icon={Baby} title="Dose pediátrica">
            <div className="space-y-3">
              {drug.dose_pediatrica!.indicacoes!.map((ind, i) => (
                <IndicacaoCard key={i} ind={ind} pediatrico />
              ))}
              {drug.dose_pediatrica?.atencao && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {drug.dose_pediatrica.atencao}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Idoso */}
        {hasIdoso && (
          <Section icon={UserIcon} title="Idoso">
            <div className="p-3 rounded-lg bg-slate-50 border-l-3 border-slate-300">
              {drug.dose_idoso?.obs && (
                <p className="text-sm text-[#191C1D] leading-relaxed">{drug.dose_idoso.obs}</p>
              )}
              {drug.dose_idoso?.max_dia && (
                <p className="text-xs text-[#4a5568] mt-1">
                  <strong>Máx:</strong> {drug.dose_idoso.max_dia}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Ajustes */}
        {(hasAjusteRenal || hasAjusteHepatico) && (
          <Section icon={Activity} title="Ajustes por função orgânica">
            {hasAjusteRenal && (
              <div className="mb-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
                  Função renal (clcr mL/min)
                </p>
                <div className="space-y-1.5">
                  {drug.ajuste_renal!.map((a, i) => (
                    <div key={i} className="flex items-baseline gap-3 text-sm">
                      <span className="font-mono font-bold text-[#005344] shrink-0 min-w-[80px]">
                        {a.clcr ?? "—"}
                      </span>
                      <span className="text-[#191C1D] leading-snug">{a.ajuste}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasAjusteHepatico && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
                  Função hepática
                </p>
                <div className="space-y-1.5">
                  {drug.ajuste_hepatico!.map((a, i) => (
                    <div key={i} className="text-sm">
                      <strong className="text-[#191C1D]">{a.contexto}:</strong>{" "}
                      <span className="text-[#4a5568]">{a.ajuste}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Gestação / Lactação */}
        {(drug.gestacao_categoria || drug.gestacao_obs || drug.lactacao) && (
          <Section icon={Baby} title="Gestação e lactação">
            {drug.gestacao_categoria && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                  Categoria FDA
                </span>
                <span className="text-sm font-bold text-amber-900">{drug.gestacao_categoria}</span>
              </div>
            )}
            {drug.gestacao_obs && (
              <p className="text-sm text-[#191C1D] leading-relaxed mb-2">
                <strong>Gestação:</strong> {drug.gestacao_obs}
              </p>
            )}
            {drug.lactacao && (
              <p className="text-sm text-[#191C1D] leading-relaxed">
                <strong>Lactação:</strong> {drug.lactacao}
              </p>
            )}
          </Section>
        )}

        {/* Contraindicações */}
        {drug.contraindicacoes && drug.contraindicacoes.length > 0 && (
          <Section icon={AlertTriangle} title="Contraindicações">
            <ul className="space-y-1.5 text-sm text-[#191C1D] leading-relaxed">
              {drug.contraindicacoes.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-500 shrink-0 font-bold">×</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Interações */}
        {drug.interacoes && drug.interacoes.length > 0 && (
          <Section icon={Heart} title="Interações relevantes">
            <div className="space-y-2.5">
              {drug.interacoes.map((it, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm font-bold text-[#191C1D] mb-1">
                    + {it.com}
                  </p>
                  {it.efeito && (
                    <p className="text-xs text-[#4a5568] leading-relaxed mb-1">
                      <span className="font-semibold text-[#191C1D]">Efeito: </span>
                      {it.efeito}
                    </p>
                  )}
                  {it.manejo && (
                    <p className="text-xs text-[#005344] leading-relaxed">
                      <span className="font-semibold">Manejo: </span>
                      {it.manejo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Efeitos adversos */}
        {drug.efeitos_adversos && drug.efeitos_adversos.length > 0 && (
          <Section icon={Info} title="Efeitos adversos">
            <div className="space-y-2">
              {drug.efeitos_adversos.map((ea, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {ea.freq && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 mt-0.5 ${tonOfFreq(ea.freq)}`}
                    >
                      {ea.freq}
                    </span>
                  )}
                  <span className="text-sm text-[#191C1D] leading-snug flex-1">{ea.evento}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Monitoramento */}
        {drug.monitoramento && drug.monitoramento.length > 0 && (
          <Section icon={Beaker} title="Monitoramento">
            <ul className="space-y-1.5 text-sm text-[#191C1D]">
              {drug.monitoramento.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#005344] shrink-0">→</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Fonte */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mt-6 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
          <p className="text-xs text-[#4a5568] leading-relaxed">
            <strong>Síntese editorial PreceptorMED.</strong>
            {drug.bula_fonte_url && (
              <>
                {" "}Fonte primária:{" "}
                <a
                  href={drug.bula_fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#005344] hover:underline inline-flex items-center gap-0.5"
                >
                  bula ANVISA
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </>
            )}{" "}
            Não substitui consulta à bula completa antes de prescrever.
          </p>
        </div>
      </div>

      {/* Floating AI button */}
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
        scope={drug ? { type: "drug", id: drug.slug, label: drug.nome_principio } : null}
      />
    </DashboardLayout>
  );
};

export default WhitebookDrug;

// ────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Pill;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-3 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#005344]" />
        <h2 className="font-['Manrope'] font-bold text-sm text-[#191C1D] uppercase tracking-[0.08em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function IndicacaoCard({ ind, pediatrico = false }: { ind: Indicacao; pediatrico?: boolean }) {
  const linhaPrincipal = [ind.dose, ind.frequencia, ind.via]
    .filter(Boolean)
    .join(" · ");
  const detalhes = [
    ind.duracao && `Duração: ${ind.duracao}`,
    ind.max && `Máx: ${ind.max}`,
    ind.max_dia && `Máx/dia: ${ind.max_dia}`,
  ].filter(Boolean);
  return (
    <div
      className={`p-3.5 rounded-lg border-l-3 ${
        pediatrico
          ? "bg-gradient-to-br from-pink-50/40 to-amber-50/40 border-pink-300"
          : "bg-gradient-to-br from-[#005344]/[0.04] to-[#C9A84C]/[0.04] border-[#C9A84C]"
      }`}
    >
      {ind.para && (
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8a6f26] mb-1">
          {ind.para}
        </p>
      )}
      <p className="text-sm text-[#191C1D] leading-snug font-medium">
        {linhaPrincipal || ind.dose || "—"}
      </p>
      {detalhes.length > 0 && (
        <p className="text-xs text-[#4a5568] mt-1">{detalhes.join(" · ")}</p>
      )}
      {ind.obs && (
        <p className="text-xs text-[#4a5568] italic mt-1.5 leading-relaxed">{ind.obs}</p>
      )}
    </div>
  );
}
