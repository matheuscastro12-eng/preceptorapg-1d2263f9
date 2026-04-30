import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, ListChecks, AlertTriangle, BookOpen, ExternalLink,
  CheckCircle2, Stethoscope, ShieldAlert,
} from "lucide-react";

interface CriterioItem {
  item?: string;
  detalhe?: string;
}
interface CondutaPasso {
  ordem?: number;
  acao?: string;
  detalhe?: string;
}

interface ProtocolFull {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  nivel_atencao: string | null;
  resumo: string | null;
  criterios_diagnosticos: CriterioItem[] | null;
  conduta_passos: CondutaPasso[] | null;
  exames_solicitar: string[] | null;
  red_flags: string[] | null;
  fonte: string | null;
  fonte_url: string | null;
  data_diretriz: string | null;
}

const WhitebookProtocol = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const [proto, setProto] = useState<ProtocolFull | null>(null);
  const [loadingProto, setLoadingProto] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("wb_protocols")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (alive) {
        setProto((data as ProtocolFull) ?? null);
        setLoadingProto(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (authLoading || loading || loadingProto) return <PageSkeleton variant="dashboard" />;
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

  if (!proto) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Protocolo não encontrado
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

  const sortedPassos = (proto.conduta_passos ?? []).slice().sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
  );

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

        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
            <ListChecks className="w-6 h-6 text-[#005344]" />
          </div>
          <div className="flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] mb-1">
              {proto.categoria}
              {proto.nivel_atencao && ` · Nível ${proto.nivel_atencao}`}
            </p>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] leading-[1.1]">
              {proto.titulo}
            </h1>
            {proto.resumo && (
              <p className="text-sm text-[#191C1D] leading-relaxed mt-3">
                {proto.resumo}
              </p>
            )}
          </div>
        </div>

        {/* Red flags */}
        {proto.red_flags && proto.red_flags.length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-red-700 mb-1">
                Red flags — escalonar imediatamente
              </p>
              <ul className="text-sm text-red-900 leading-relaxed space-y-0.5">
                {proto.red_flags.map((rf, i) => (
                  <li key={i}>• {rf}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Critérios diagnósticos */}
        {proto.criterios_diagnosticos && proto.criterios_diagnosticos.length > 0 && (
          <Section icon={Stethoscope} title="Critérios diagnósticos">
            <div className="space-y-2">
              {proto.criterios_diagnosticos.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  {c.item && (
                    <p className="text-sm font-bold text-[#191C1D] mb-0.5">{c.item}</p>
                  )}
                  {c.detalhe && (
                    <p className="text-xs text-[#4a5568] leading-relaxed">{c.detalhe}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Conduta passo-a-passo */}
        {sortedPassos.length > 0 && (
          <Section icon={CheckCircle2} title="Conduta">
            <ol className="space-y-2.5">
              {sortedPassos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#005344] to-[#003D32] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {p.ordem ?? i + 1}
                  </div>
                  <div className="flex-1">
                    {p.acao && (
                      <p className="text-sm font-bold text-[#191C1D] leading-snug">
                        {p.acao}
                      </p>
                    )}
                    {p.detalhe && (
                      <p className="text-xs text-[#4a5568] leading-relaxed mt-1">
                        {p.detalhe}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Exames */}
        {proto.exames_solicitar && proto.exames_solicitar.length > 0 && (
          <Section icon={ListChecks} title="Exames a solicitar">
            <div className="flex flex-wrap gap-1.5">
              {proto.exames_solicitar.map((e, i) => (
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

        {/* Fonte */}
        {(proto.fonte || proto.fonte_url) && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mt-6 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
            <p className="text-xs text-[#4a5568] leading-relaxed">
              <strong>Síntese editorial PreceptorMED.</strong>
              {proto.fonte && <> Fonte: <strong>{proto.fonte}</strong>.</>}
              {proto.fonte_url && (
                <>
                  {" "}
                  <a
                    href={proto.fonte_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#005344] hover:underline inline-flex items-center gap-0.5"
                  >
                    Ver diretriz
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}{" "}
              Não substitui consulta à diretriz original antes de tomar conduta clínica.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhitebookProtocol;

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ListChecks;
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
