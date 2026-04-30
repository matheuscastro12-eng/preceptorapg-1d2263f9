import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useCalculator, type CalculatorFull } from "@/hooks/useWhitebookSearch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import CalculatorRenderer, {
  type CalculatorDef,
} from "@/components/whitebook/CalculatorRenderer";
import WhitebookAiDrawer from "@/components/whitebook/WhitebookAiDrawer";
import { ArrowLeft, Calculator, Wand2 } from "lucide-react";

const WhitebookCalculator = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, loading } = useFeatureAccess("whitebook");
  const navigate = useNavigate();
  const { calc, loading: loadingCalc } = useCalculator(slug);
  const [aiOpen, setAiOpen] = useState(false);

  if (authLoading || loading || loadingCalc) {
    return <PageSkeleton variant="dashboard" />;
  }
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

  if (!calc) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#191C1D] mb-2">
            Calculadora não encontrada
          </h1>
          <p className="text-sm text-[#4a5568] mb-6">
            O slug solicitado não existe ou não está publicado.
          </p>
          <button
            onClick={() => navigate("/whitebook")}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#191C1D] text-white text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar pro Whitebook
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const fullCalc = calc as CalculatorFull;
  const def = fullCalc.definicao as CalculatorDef;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/whitebook")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Whitebook
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-3">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#005344]" />
            </div>
            <div className="flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] mb-1">
                {fullCalc.categoria}
              </p>
              <h1 className="font-['Manrope'] font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-[#191C1D] leading-[1.1]">
                {fullCalc.nome}
              </h1>
            </div>
          </div>
          {fullCalc.descricao && (
            <p className="text-sm text-[#191C1D] leading-relaxed mb-2">
              {fullCalc.descricao}
            </p>
          )}
          {fullCalc.quando_usar && (
            <p className="text-xs text-[#4a5568] leading-relaxed">
              <strong>Quando usar:</strong> {fullCalc.quando_usar}
            </p>
          )}
        </div>

        {/* Renderer */}
        <CalculatorRenderer
          def={def}
          fonte={fullCalc.fonte}
          fonteUrl={fullCalc.fonte_url}
        />
      </div>

      {/* Floating AI button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] transition-shadow"
      >
        <Wand2 className="w-4 h-4 text-[#C9A84C]" />
        Pergunte à IA
      </button>

      <WhitebookAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        scope={fullCalc ? { type: "calculator", id: fullCalc.slug, label: fullCalc.nome } : null}
      />
    </DashboardLayout>
  );
};

export default WhitebookCalculator;
