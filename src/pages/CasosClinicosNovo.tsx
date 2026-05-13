import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { buildCompleteCase, type CaseBasics } from "@/hooks/useClinicalCases";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, Sparkles, Loader2, Stethoscope, Wand2, CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CasosClinicosNovo() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState<number | "">("");
  const [unidade, setUnidade] = useState<"anos" | "meses" | "dias">("anos");
  const [sexo, setSexo] = useState<"M" | "F" | "I" | "">("");
  const [doenca, setDoenca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [generating, setGenerating] = useState(false);

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

  const valid =
    nome.trim().length >= 1 &&
    typeof idade === "number" && idade > 0 &&
    !!sexo &&
    doenca.trim().length >= 3;

  const handleGenerate = async () => {
    if (!valid || generating) return;
    setGenerating(true);
    try {
      const basics: CaseBasics = {
        paciente_nome: nome.trim(),
        paciente_idade: idade as number,
        paciente_idade_unidade: unidade,
        paciente_sexo: sexo as "M" | "F" | "I",
        doenca_principal: doenca.trim(),
      };
      const res = await buildCompleteCase({ basics, descricao_livre: descricao.trim() });
      toast({
        title: "Caso pronto!",
        description: "PreceptorMED estruturou o caso completo.",
      });
      navigate(`/casos-clinicos/${res.case_id}`);
    } catch (e) {
      toast({ title: "Erro ao gerar caso", description: (e as Error).message, variant: "destructive" });
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/casos-clinicos")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4 group"
          disabled={generating}
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Casos clínicos
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_-12px_rgba(0,109,91,0.18)]"
        >
          {/* Top accent shimmer */}
          <div className="relative h-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />
          </div>

          <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-11">
            {/* Header */}
            <div className="flex items-start gap-3 mb-7">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.15 }}
                className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,109,91,0.4)]"
              >
                <Stethoscope className="w-6 h-6 text-[#C9A84C]" />
              </motion.div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-1.5 flex items-center gap-2">
                  <span className="w-6 h-px bg-[#C9A84C]" />
                  Novo caso clínico
                </p>
                <h1 className="font-['Manrope'] font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-[#191C1D] leading-tight">
                  Conte o caso e o PreceptorMED <em className="not-italic font-medium text-[#8a6f26]">monta tudo</em>.
                </h1>
                <p className="text-sm text-[#4a5568] mt-2 leading-relaxed">
                  Preencha os dados básicos e descreva o caso da forma que vier — alguns detalhes,
                  uma frase, palavras-chave. PreceptorMED estrutura HDA, exame, exames, hipóteses
                  e conduta. Você revisa e edita o que precisar.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Linha 1: Nome */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                  Nome do paciente
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={generating}
                  placeholder="Ex: Caio Silva (pode ser fictício)"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all disabled:opacity-50"
                />
              </div>

              {/* Linha 2: Idade + unidade + sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Idade
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                    disabled={generating}
                    placeholder="65"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Unidade
                  </label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as "anos" | "meses" | "dias")}
                    disabled={generating}
                    className="w-full h-12 px-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all disabled:opacity-50 bg-white"
                  >
                    <option value="anos">anos</option>
                    <option value="meses">meses</option>
                    <option value="dias">dias</option>
                  </select>
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                    Sexo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "M", l: "Masculino" },
                      { v: "F", l: "Feminino" },
                      { v: "I", l: "Intersexo" },
                    ].map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setSexo(s.v as "M" | "F" | "I")}
                        disabled={generating}
                        className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                          sexo === s.v
                            ? "bg-[#005344] text-white border-[#005344] shadow-[0_4px_12px_-4px_rgba(0,109,91,0.45)]"
                            : "bg-white text-[#4a5568] border-slate-200 hover:border-[#005344]/40"
                        }`}
                      >
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Linha 3: Doença */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                  Doença / quadro principal
                </label>
                <input
                  value={doenca}
                  onChange={(e) => setDoenca(e.target.value)}
                  disabled={generating}
                  placeholder="Ex: Insuficiência cardíaca com FE reduzida"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all disabled:opacity-50"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "IAM com supra de ST",
                    "Insuficiência cardíaca",
                    "DM2 descompensada",
                    "Pneumonia comunitária",
                    "AVC isquêmico",
                    "Sepse",
                    "Pancreatite aguda",
                  ].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDoenca(d)}
                      disabled={generating}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-[#4a5568] hover:bg-[#005344]/10 hover:text-[#005344] transition-colors disabled:opacity-50"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linha 4: Descrição livre */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5 flex items-center gap-2">
                  Descreva o caso
                  <span className="text-[#94a3b8] font-normal normal-case tracking-normal">— qualquer detalhe que tem em mente (opcional)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={generating}
                  rows={6}
                  placeholder={`Ex: paciente chega com cansaço aos esforços há 6 meses, piora progressiva, edema MMII, ortopneia, DPN. HAS há 10a, ex-tabagista 30 maços/ano. Eco mostra FE 30%. Já em uso de losartana e HCTZ.

Pode escrever em qualquer ordem, palavras-chave, frase solta. PreceptorMED organiza tudo.`}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm leading-relaxed focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all resize-y disabled:opacity-50"
                />
                <p className="text-[11px] text-[#94a3b8] mt-1.5 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C9A84C]" />
                  Lacunas serão preenchidas pela IA com inferências clínicas plausíveis. Você pode editar tudo depois.
                </p>
              </div>

              {/* Botão gerar */}
              <motion.button
                onClick={handleGenerate}
                disabled={!valid || generating}
                whileHover={valid && !generating ? { scale: 1.01 } : undefined}
                whileTap={valid && !generating ? { scale: 0.98 } : undefined}
                className="w-full h-13 mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden py-4"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={generating ? { x: ["-100%", "200%"] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative inline-flex items-center gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PreceptorMED estruturando o caso…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-[#C9A84C]" />
                      Gerar caso completo
                    </>
                  )}
                </span>
              </motion.button>

              {generating && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-[11px] text-[#4a5568] inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Levo ~10–25s. Em seguida você revisa e edita o que quiser.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer educativo */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 p-4 rounded-xl bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border border-[#005344]/15 flex items-start gap-3"
        >
          <CheckCircle2 className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
          <p className="text-xs text-[#4a5568] leading-relaxed">
            <strong className="text-[#191C1D]">Como funciona:</strong> PreceptorMED usa os dados que
            você forneceu como ÂNCORA (não inventa idade/sexo/doença) e preenche os campos vazios com
            inferências clinicamente plausíveis pra montar um caso didático completo. Depois você
            pode <strong>gerar questões ENAMED</strong> em cima do caso.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
