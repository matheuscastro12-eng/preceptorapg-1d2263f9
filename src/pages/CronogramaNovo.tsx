import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { createStudyPlan } from "@/hooks/useStudyPlan";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import { ArrowLeft, ArrowRight, Calendar, Loader2, Sparkles, Target, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PROVA_EXAMPLES = [
  "Prova de Cardiologia",
  "ENAMED 2026",
  "Revalida Brasil",
  "P1 de Clínica Médica",
  "P2 de Pediatria",
  "Residência USP-SP",
];

const TOPICO_PLACEHOLDER = `Cardio, ICC, FA, IAM, hipertensão
Pneumo: PAC, asma, DPOC
Endócrino: DM2, tireoide, dislipidemia`;

export default function CronogramaNovo() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [provaNome, setProvaNome] = useState("");
  const [provaData, setProvaData] = useState("");
  const [topicos, setTopicos] = useState("");
  const [horasDia, setHorasDia] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading || subLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <UpgradePaywall variant="feature-locked" />
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const oneEighty = new Date(Date.now() + 86400000 * 180).toISOString().slice(0, 10);

  const validStep1 = provaNome.trim().length >= 3 && provaData >= tomorrow;
  const validStep2 = topicos.trim().length >= 5;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createStudyPlan({
        prova_nome: provaNome.trim(),
        prova_data: provaData,
        topicos_input: topicos.trim(),
        horas_dia: horasDia,
      });
      toast({
        title: "Plano criado!",
        description: `${res.total_dias} dias planejados. Bora estudar.`,
      });
      navigate(`/cronograma`);
    } catch (e) {
      toast({
        title: "Erro ao gerar plano",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/cronograma")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cronograma
        </button>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                step >= n ? "bg-[#005344]" : "bg-slate-200"
              } transition-colors`}
            />
          ))}
        </div>

        {/* Step 1 — Prova */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
              <Target className="w-6 h-6 text-[#005344]" />
            </div>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] mb-2">
              Qual prova é essa?
            </h1>
            <p className="text-sm text-[#4a5568] mb-8 leading-relaxed">
              Pode ser uma prova de faculdade, residência ou simulado importante.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
                  Nome da prova
                </label>
                <input
                  value={provaNome}
                  onChange={(e) => setProvaNome(e.target.value)}
                  placeholder="Ex: P1 de Clínica Médica"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {PROVA_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setProvaNome(ex)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-[#4a5568] hover:bg-[#005344]/10 hover:text-[#005344] transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
                  Data da prova
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                  <input
                    type="date"
                    value={provaData}
                    min={tomorrow}
                    max={oneEighty}
                    onChange={(e) => setProvaData(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow"
                  />
                </div>
                <p className="text-[11px] text-[#94a3b8] mt-1.5">
                  Mínimo 1 dia, máximo 180 dias a partir de hoje.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!validStep1}
              className="w-full mt-8 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#005344] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#003D32] transition-colors"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Tópicos */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#005344]" />
            </div>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] mb-2">
              O que vai cair?
            </h1>
            <p className="text-sm text-[#4a5568] mb-6 leading-relaxed">
              Lista os tópicos do jeito que vier — abreviações, siglas, mistura de áreas. A IA normaliza tudo.
            </p>

            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
                Tópicos da prova
              </label>
              <textarea
                value={topicos}
                onChange={(e) => setTopicos(e.target.value)}
                placeholder={TOPICO_PLACEHOLDER}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm leading-relaxed focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow resize-none font-mono"
                autoFocus
              />
              <p className="text-[11px] text-[#94a3b8] mt-1.5">
                Pode ser uma linha só, lista por vírgula, ou bem detalhado. Tanto faz.
              </p>
            </div>

            <div className="flex gap-2 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-5 h-12 rounded-xl text-sm font-bold text-[#4a5568] hover:bg-slate-100 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!validStep2}
                className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#005344] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#003D32] transition-colors"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Horas + revisão */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-[#005344]" />
            </div>
            <h1 className="font-['Manrope'] font-bold text-3xl tracking-[-0.02em] text-[#191C1D] mb-2">
              Quanto tempo por dia?
            </h1>
            <p className="text-sm text-[#4a5568] mb-8 leading-relaxed">
              Seja realista — melhor 2h consistentes que 6h num dia só.
            </p>

            <div className="bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/20 rounded-2xl p-6 mb-6">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-['Manrope'] font-bold text-5xl text-[#005344]">{horasDia}</span>
                <span className="text-base font-semibold text-[#4a5568]">{horasDia === 1 ? "hora" : "horas"} / dia</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={horasDia}
                onChange={(e) => setHorasDia(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#005344]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94a3b8] mt-1">
                <span>1h</span>
                <span>2h</span>
                <span>3h</span>
                <span>4h</span>
                <span>5h</span>
                <span>6h</span>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-2.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1">
                Pronto pra gerar
              </p>
              <Resumo label="Prova" value={provaNome} />
              <Resumo label="Data" value={new Date(provaData + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
              <Resumo label="Tempo" value={`${horasDia}h por dia`} />
              <Resumo label="Tópicos" value={topicos.replace(/\n/g, " · ").substring(0, 80) + (topicos.length > 80 ? "..." : "")} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="px-5 h-12 rounded-xl text-sm font-bold text-[#4a5568] hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.4)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    IA montando seu plano (~30s)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                    Gerar meu cronograma
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-[#94a3b8] font-medium w-16 shrink-0">{label}</span>
      <span className="text-[#191C1D] flex-1 truncate">{value}</span>
    </div>
  );
}
