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
  User as UserIcon, Beaker, Info, ShieldAlert,
} from "lucide-react";

interface Apresentacao {
  forma?: string;
  concentracao?: string;
}
interface DoseAdulto {
  padrao?: string;
  max_diaria?: string;
}
interface DosePediatrica {
  mg_kg_dia?: string;
  max?: string;
  observacoes?: string;
}
interface DoseIdoso {
  observacoes?: string;
}
interface Ajuste {
  condicao?: string;
  ajuste?: string;
}
interface Interacao {
  droga?: string;
  severidade?: string;
  mecanismo?: string;
}
interface EfeitoAdverso {
  categoria?: string;
  lista?: string[];
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
  ajuste_renal: Ajuste[] | null;
  ajuste_hepatico: Ajuste[] | null;
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

const WhitebookDrug = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DrugFull | null>(null);
  const [loadingDrug, setLoadingDrug] = useState(true);

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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/whitebook")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Whitebook
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

        {/* Alertas de seguranca */}
        {drug.alertas_seguranca && drug.alertas_seguranca.length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-red-700 mb-1">
                Alertas de segurança
              </p>
              <ul className="text-sm text-red-900 leading-relaxed space-y-0.5">
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
                  className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#191C1D]"
                >
                  {a.forma ? <strong>{a.forma}</strong> : null}
                  {a.forma && a.concentracao ? " · " : null}
                  {a.concentracao}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Doses */}
        <Section icon={UserIcon} title="Doses">
          <div className="space-y-3">
            {drug.dose_adulto?.padrao && (
              <DoseCard label="Adulto" content={drug.dose_adulto.padrao} extra={drug.dose_adulto.max_diaria ? `Máx: ${drug.dose_adulto.max_diaria}` : undefined} />
            )}
            {drug.dose_pediatrica?.mg_kg_dia && (
              <DoseCard
                label="Pediátrica"
                content={drug.dose_pediatrica.mg_kg_dia}
                extra={[
                  drug.dose_pediatrica.max ? `Máx: ${drug.dose_pediatrica.max}` : null,
                  drug.dose_pediatrica.observacoes,
                ].filter(Boolean).join(" · ")}
              />
            )}
            {drug.dose_idoso?.observacoes && (
              <DoseCard label="Idoso" content={drug.dose_idoso.observacoes} />
            )}
          </div>
        </Section>

        {/* Ajustes */}
        {((drug.ajuste_renal && drug.ajuste_renal.length > 0) ||
          (drug.ajuste_hepatico && drug.ajuste_hepatico.length > 0)) && (
          <Section icon={Info} title="Ajustes">
            {drug.ajuste_renal && drug.ajuste_renal.length > 0 && (
              <div className="mb-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                  Função renal
                </p>
                <div className="space-y-1">
                  {drug.ajuste_renal.map((a, i) => (
                    <div key={i} className="text-sm">
                      <strong className="text-[#191C1D]">{a.condicao}</strong>
                      {a.ajuste && <span className="text-[#4a5568]"> — {a.ajuste}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {drug.ajuste_hepatico && drug.ajuste_hepatico.length > 0 && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                  Função hepática
                </p>
                <div className="space-y-1">
                  {drug.ajuste_hepatico.map((a, i) => (
                    <div key={i} className="text-sm">
                      <strong className="text-[#191C1D]">{a.condicao}</strong>
                      {a.ajuste && <span className="text-[#4a5568]"> — {a.ajuste}</span>}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 mb-2">
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
            <ul className="space-y-1 text-sm text-[#191C1D] leading-relaxed">
              {drug.contraindicacoes.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#94a3b8] shrink-0">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Interações */}
        {drug.interacoes && drug.interacoes.length > 0 && (
          <Section icon={Heart} title="Interações relevantes">
            <div className="space-y-2">
              {drug.interacoes.map((it, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-0.5">
                    <strong className="text-sm text-[#191C1D]">{it.droga}</strong>
                    {it.severidade && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        {it.severidade}
                      </span>
                    )}
                  </div>
                  {it.mecanismo && (
                    <p className="text-xs text-[#4a5568] leading-relaxed">{it.mecanismo}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Efeitos adversos */}
        {drug.efeitos_adversos && drug.efeitos_adversos.length > 0 && (
          <Section icon={Info} title="Efeitos adversos">
            {drug.efeitos_adversos.map((cat, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {cat.categoria && (
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1">
                    {cat.categoria}
                  </p>
                )}
                {cat.lista && cat.lista.length > 0 && (
                  <p className="text-sm text-[#191C1D] leading-relaxed">
                    {cat.lista.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Monitoramento */}
        {drug.monitoramento && drug.monitoramento.length > 0 && (
          <Section icon={Beaker} title="Monitoramento">
            <ul className="space-y-1 text-sm text-[#191C1D]">
              {drug.monitoramento.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#94a3b8] shrink-0">•</span>
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

function DoseCard({ label, content, extra }: { label: string; content: string; extra?: string }) {
  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-[#005344]/4 to-[#C9A84C]/4 border-l-3 border-[#C9A84C]">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8a6f26] mb-1">
        {label}
      </p>
      <p className="text-sm text-[#191C1D] leading-relaxed">{content}</p>
      {extra && <p className="text-xs text-[#4a5568] mt-1">{extra}</p>}
    </div>
  );
}
