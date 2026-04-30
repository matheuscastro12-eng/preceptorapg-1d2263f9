import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import { BookOpen, Sparkles, Calculator, Pill, ListChecks, FileText } from "lucide-react";

const Whitebook = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, reason, loading } = useFeatureAccess("whitebook");

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
        <div className="mb-8">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Whitebook PreceptorMED
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
            Sua referência médica de bolso, com{" "}
            <em className="not-italic font-medium text-[#8a6f26]">IA acoplada</em>.
          </h1>
          <p className="text-sm text-[#4a5568] mt-3 max-w-[60ch] leading-relaxed">
            Drogas, protocolos, calculadoras clínicas e CID-10 — sintetizados de
            fontes públicas brasileiras (ANVISA, diretrizes SBC/SBP/Febrasgo,
            DATASUS) e revisados editorialmente. Pergunte em linguagem natural.
          </p>
        </div>

        {/* Coming soon grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Pill,
              title: "Drogas",
              desc: "Doses, ajuste renal/hepático, gestação, interações.",
              status: "Em curadoria",
            },
            {
              icon: ListChecks,
              title: "Protocolos",
              desc: "Sepse, IAM, AVC, asma, ITU — direto da diretriz brasileira.",
              status: "Em curadoria",
            },
            {
              icon: Calculator,
              title: "Calculadoras",
              desc: "30+ escores: Wells, qSOFA, MELD, NIHSS, CHA₂DS₂-VASc.",
              status: "Próxima fase",
            },
            {
              icon: FileText,
              title: "CID-10",
              desc: "Busca rápida com hierarquia de capítulos.",
              status: "Em curadoria",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(25,28,29,0.04)]"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#005344]/10 to-[#C9A84C]/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#005344]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                      {item.title}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A84C]/15 text-[#8a6f26] font-bold uppercase tracking-wider">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#4a5568] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#8a6f26]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26]">
              Roadmap
            </span>
          </div>
          <p className="text-sm text-[#191C1D] leading-relaxed">
            Próximas semanas: lançamento gradual começando pelas{" "}
            <strong>calculadoras clínicas</strong>, depois drogas e protocolos.
            Você está incluído como assinante atual — sem custo adicional.
          </p>
        </div>

        {/* CTA fechado */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#94a3b8]">
          <BookOpen className="w-3.5 h-3.5" />
          {reason === "admin"
            ? "Você é admin — pode adiantar testes via /admin/whitebook quando disponível"
            : "Conteúdo médico em construção — aviso quando estiver no ar"}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Whitebook;
