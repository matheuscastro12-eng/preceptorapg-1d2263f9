import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import { Mic, Sparkles, FileText, ShieldCheck, ClipboardList } from "lucide-react";

const Scribe = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, reason, loading } = useFeatureAccess("scribe");

  if (authLoading || loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  // Sem assinatura -> paywall genérico
  if (!hasFeature && reason === "no_subscription") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }

  // Tem assinatura mas não tem convite do beta -> paywall específico
  if (!hasFeature && reason === "no_invite") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <UpgradePaywall variant="beta-only" betaModule="Scribe Clínico" />
        </div>
      </DashboardLayout>
    );
  }

  // Admin ou convidado — placeholder até Phase 3
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Scribe Clínico — Beta fechado
          </p>
          <h1 className="font-['Manrope'] font-bold text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
            Grave a consulta,{" "}
            <em className="not-italic font-medium text-[#8a6f26]">a IA monta o prontuário</em>.
          </h1>
          <p className="text-sm text-[#4a5568] mt-3 max-w-[58ch] leading-relaxed">
            Áudio da consulta → transcrição em PT-BR → SOAP estruturado →
            hipóteses diagnósticas → exames sugeridos → rascunho de prescrição.
            Você revisa cada bloco e assina antes de salvar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Mic,
              title: "Captura de áudio",
              desc: "Gravação direto no navegador. Áudio criptografado e privado, retenção configurável (24h–90d).",
            },
            {
              icon: FileText,
              title: "SOAP automático",
              desc: "S/O/A/P com terminologia médica, redação clínica padrão. Editável campo a campo.",
            },
            {
              icon: ClipboardList,
              title: "DDx + Conduta",
              desc: "Hipóteses diagnósticas com probabilidade, exames sugeridos, rascunho de prescrição.",
            },
            {
              icon: ShieldCheck,
              title: "Compliance LGPD/CFM",
              desc: "Consentimento do paciente registrado, audit log de toda alteração, assinatura eletrônica.",
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
                <div>
                  <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#4a5568] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#8a6f26]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26]">
              Status do beta
            </span>
          </div>
          <p className="text-sm text-[#191C1D] leading-relaxed">
            {reason === "admin"
              ? "Você é admin — quando o módulo for ao ar, terá acesso completo."
              : "Você está na lista do beta fechado. A interface de gravação e revisão será liberada nas próximas semanas. Avisamos por email quando estiver pronta."}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Scribe;
