import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, FileText, BookOpen, ExternalLink, Pill, ListChecks,
  AlertTriangle, ShieldAlert, ClipboardList, Wand2, Stethoscope,
} from "lucide-react";
import WhitebookAiDrawer from "@/components/whitebook/WhitebookAiDrawer";

interface ItemPrescricao {
  droga?: string;
  dose?: string;
  via?: string;
  frequencia?: string;
  duracao?: string;
  obs?: string;
  drug_slug?: string;
}

interface PrescriptionFull {
  id: string;
  slug: string;
  titulo: string;
  doenca: string;
  condicao_clinica: string | null;
  protocol_slug: string | null;
  contexto: string | null;
  resumo: string | null;
  itens: ItemPrescricao[];
  orientacoes_gerais: string[] | null;
  exames_complementares: string[] | null;
  criterios_internacao: string[] | null;
  criterios_alta: string[] | null;
  alertas: string[] | null;
  fonte: string | null;
  fonte_url: string | null;
  data_diretriz: string | null;
}

const WhitebookPrescription = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<PrescriptionFull | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("wb_prescriptions")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (alive) {
        setPrescription((data as PrescriptionFull) ?? null);
        setLoadingData(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (authLoading || loading || loadingData) return <PageSkeleton variant="dashboard" />;
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

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Prescrição não encontrada
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
          PreceptorBook
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#005344]" />
          </div>
          <div className="flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] mb-1">
              {prescription.doenca}
              {prescription.contexto && ` · ${prescription.contexto}`}
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] leading-[1.1]">
              {prescription.titulo}
            </h1>
            {prescription.condicao_clinica && (
              <p className="text-sm text-[#4a5568] leading-relaxed mt-2">
                <strong className="text-[#191C1D]">Quando usar:</strong>{" "}
                {prescription.condicao_clinica}
              </p>
            )}
            {prescription.resumo && (
              <p className="text-sm text-[#191C1D] leading-relaxed mt-3 p-3 rounded-lg bg-gradient-to-br from-[#005344]/[0.05] to-[#C9A84C]/[0.05] border-l-3 border-[#C9A84C]">
                {prescription.resumo}
              </p>
            )}
          </div>
        </div>

        {/* Banner aviso prescrição */}
        <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 mb-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-700 mb-1">
              Rascunho clínico — não é receita
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              Este é um modelo educacional. A responsabilidade pela prescrição é
              SEMPRE do médico assistente, que deve avaliar o paciente
              individualmente, ajustar doses e considerar comorbidades antes de prescrever.
            </p>
          </div>
        </div>

        {/* Alertas */}
        {prescription.alertas && prescription.alertas.length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-red-700 mb-1">
                Pontos críticos
              </p>
              <ul className="text-sm text-red-900 leading-relaxed space-y-1">
                {prescription.alertas.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Itens da prescrição */}
        {prescription.itens && prescription.itens.length > 0 && (
          <Section icon={ClipboardList} title="Prescrição">
            <ol className="space-y-3">
              {prescription.itens.map((it, i) => (
                <li key={i} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#005344] to-[#003D32] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 p-3.5 rounded-lg bg-gradient-to-br from-[#005344]/[0.04] to-[#C9A84C]/[0.04] border-l-3 border-[#C9A84C]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-[#191C1D] leading-snug flex-1">
                        {it.droga}
                      </p>
                      {it.drug_slug && (
                        <button
                          onClick={() => navigate(`/whitebook/drug/${it.drug_slug}`)}
                          className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[#005344] hover:text-[#003D32]"
                        >
                          <Pill className="w-3 h-3" />
                          Bula
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#191C1D] leading-snug">
                      {[it.dose, it.via, it.frequencia].filter(Boolean).join(" · ")}
                    </p>
                    {it.duracao && (
                      <p className="text-xs text-[#4a5568] mt-1">
                        <strong>Duração:</strong> {it.duracao}
                      </p>
                    )}
                    {it.obs && (
                      <p className="text-xs text-[#4a5568] italic mt-1.5 leading-relaxed">
                        {it.obs}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Orientações gerais */}
        {prescription.orientacoes_gerais && prescription.orientacoes_gerais.length > 0 && (
          <Section icon={Stethoscope} title="Orientações gerais">
            <ul className="space-y-1.5 text-sm text-[#191C1D] leading-relaxed">
              {prescription.orientacoes_gerais.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#005344] shrink-0">→</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Exames */}
        {prescription.exames_complementares && prescription.exames_complementares.length > 0 && (
          <Section icon={ListChecks} title="Exames complementares">
            <div className="flex flex-wrap gap-1.5">
              {prescription.exames_complementares.map((e, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#191C1D]"
                >
                  {e}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Critérios internação */}
        {prescription.criterios_internacao && prescription.criterios_internacao.length > 0 && (
          <Section icon={AlertTriangle} title="Critérios de internação">
            <ul className="space-y-1.5 text-sm text-[#191C1D] leading-relaxed">
              {prescription.criterios_internacao.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600 shrink-0 font-bold">!</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Critérios alta */}
        {prescription.criterios_alta && prescription.criterios_alta.length > 0 && (
          <Section icon={ListChecks} title="Critérios de alta">
            <ul className="space-y-1.5 text-sm text-[#191C1D] leading-relaxed">
              {prescription.criterios_alta.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Protocolo vinculado */}
        {prescription.protocol_slug && (
          <button
            onClick={() => navigate(`/whitebook/protocol/${prescription.protocol_slug}`)}
            className="w-full mt-3 mb-2 inline-flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-br from-[#005344]/10 to-[#C9A84C]/10 border border-[#005344]/20 hover:border-[#005344]/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ListChecks className="w-5 h-5 text-[#005344]" />
              <div className="text-left">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#005344]">
                  Protocolo completo
                </p>
                <p className="text-sm font-semibold text-[#191C1D]">
                  Ver diretriz e conduta passo-a-passo
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180 text-[#005344]" />
          </button>
        )}

        {/* Fonte */}
        {(prescription.fonte || prescription.fonte_url) && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mt-4 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
            <p className="text-xs text-[#4a5568] leading-relaxed">
              <strong>Síntese editorial PreceptorMED.</strong>
              {prescription.fonte && <> Fonte: <strong>{prescription.fonte}</strong>.</>}
              {prescription.fonte_url && (
                <>
                  {" "}
                  <a
                    href={prescription.fonte_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#005344] hover:underline inline-flex items-center gap-0.5"
                  >
                    Ver diretriz
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}{" "}
              Não substitui consulta à diretriz original antes de prescrever.
            </p>
          </div>
        )}
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
        scope={
          prescription
            ? { type: "protocol", id: prescription.slug, label: prescription.titulo }
            : null
        }
      />
    </DashboardLayout>
  );
};

export default WhitebookPrescription;

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
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
