import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useClinicalCase, generateCaseQuestions, deleteClinicalCase, SEXO_LABEL } from "@/hooks/useClinicalCases";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, Stethoscope, Sparkles, Loader2, FileQuestion, Trash2,
  ChevronDown, ChevronUp, Check, X as XIcon, Download, Plus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CasoClinico() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { caseData, questions, loading, reload } = useClinicalCase(id);
  const navigate = useNavigate();

  const [generating, setGenerating] = useState(false);
  const [nQuestions, setNQuestions] = useState(3);
  const [showGenForm, setShowGenForm] = useState(false);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [revealedQId, setRevealedQId] = useState<string | null>(null);

  if (authLoading || subLoading || loading) return <PageSkeleton variant="dashboard" />;
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
  if (!caseData) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 px-4 text-center">
          <p className="font-['Manrope'] font-bold text-xl text-[#191C1D]">Caso não encontrado</p>
          <button onClick={() => navigate("/casos-clinicos")} className="mt-4 px-4 h-10 rounded-lg bg-[#005344] text-white text-sm font-bold">Voltar</button>
        </div>
      </DashboardLayout>
    );
  }

  const cs = (caseData.caso_estruturado ?? {}) as Record<string, any>;
  const isComplete = caseData.status === "complete";

  const handleGenerate = async () => {
    if (!isComplete) return;
    setGenerating(true);
    try {
      const res = await generateCaseQuestions(caseData.id, nQuestions);
      toast({ title: `${res.count} questão(ões) gerada(s)` });
      setShowGenForm(false);
      await reload();
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Apagar este caso e todas as ${questions.length} questão(ões)? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteClinicalCase(caseData.id);
      toast({ title: "Caso apagado" });
      navigate("/casos-clinicos");
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (!isComplete) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 px-4 text-center">
          <p className="font-['Manrope'] font-bold text-xl text-[#191C1D] mb-2">Caso ainda em construção</p>
          <p className="text-sm text-[#4a5568] mb-4">Continue a conversa pra finalizar o caso.</p>
          <button onClick={() => navigate(`/casos-clinicos/novo?continuar=${caseData.id}`)} className="px-5 h-11 rounded-xl bg-[#005344] text-white text-sm font-bold">
            Continuar conversa
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <button
            onClick={() => navigate("/casos-clinicos")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Casos clínicos
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-[#4a5568] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Apagar
          </button>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-5 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
          <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
          <div className="px-5 sm:px-8 py-6 sm:py-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-[#005344]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] mb-1">
                  Caso clínico
                </p>
                <h1 className="font-['Manrope'] font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-[#191C1D] leading-tight">
                  {caseData.titulo ?? "—"}
                </h1>
                <p className="text-sm text-[#4a5568] mt-2 leading-relaxed">
                  {caseData.resumo_curto ?? ""}
                </p>
              </div>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Mini label="Paciente" value={caseData.paciente_nome ?? "—"} />
              <Mini label="Idade" value={caseData.paciente_idade ? `${caseData.paciente_idade} ${caseData.paciente_idade_unidade}` : "—"} />
              <Mini label="Sexo" value={caseData.paciente_sexo ? (SEXO_LABEL[caseData.paciente_sexo] ?? caseData.paciente_sexo) : "—"} />
              <Mini label="Doença" value={caseData.doenca_principal ?? "—"} />
            </div>
          </div>
        </div>

        {/* Caso estruturado */}
        <div className="space-y-3 mb-6">
          {cs.queixa_principal && <Section title="Queixa principal">{cs.queixa_principal}</Section>}

          {cs.hda && <Section title="HDA — História da doença atual">{cs.hda}</Section>}

          {cs.antecedentes && (
            <Section title="Antecedentes">
              <div className="space-y-1.5">
                {cs.antecedentes.pessoais && <SubLine label="Pessoais" value={cs.antecedentes.pessoais} />}
                {cs.antecedentes.familiares && <SubLine label="Familiares" value={cs.antecedentes.familiares} />}
                {cs.antecedentes.ginecologicos && <SubLine label="Gineco-obstétricos" value={cs.antecedentes.ginecologicos} />}
                {cs.antecedentes.sociais && <SubLine label="Sociais" value={cs.antecedentes.sociais} />}
              </div>
            </Section>
          )}

          {cs.medicacoes_alergias && (
            <Section title="Medicações e alergias">
              {Array.isArray(cs.medicacoes_alergias.em_uso) && cs.medicacoes_alergias.em_uso.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1">Em uso</p>
                  <ul className="text-sm space-y-0.5">
                    {cs.medicacoes_alergias.em_uso.map((m: string, i: number) => (
                      <li key={i} className="text-[#191C1D]">• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(cs.medicacoes_alergias.alergias) && cs.medicacoes_alergias.alergias.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-red-700 mb-1">Alergias</p>
                  <ul className="text-sm space-y-0.5">
                    {cs.medicacoes_alergias.alergias.map((a: string, i: number) => (
                      <li key={i} className="text-red-900">• {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {cs.exame_fisico && (
            <Section title="Exame físico">
              {cs.exame_fisico.sinais_vitais && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  {Object.entries(cs.exame_fisico.sinais_vitais)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{k}</p>
                        <p className="text-sm font-mono text-[#191C1D]">{String(v)}</p>
                      </div>
                    ))}
                </div>
              )}
              {cs.exame_fisico.geral && <p className="text-sm leading-relaxed mb-2"><strong>Geral:</strong> {cs.exame_fisico.geral}</p>}
              {cs.exame_fisico.segmentar && <p className="text-sm leading-relaxed"><strong>Segmentar:</strong> {cs.exame_fisico.segmentar}</p>}
            </Section>
          )}

          {Array.isArray(cs.exames_complementares) && cs.exames_complementares.length > 0 && (
            <Section title="Exames complementares">
              <div className="space-y-2">
                {cs.exames_complementares.map((e: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-[#005344]">{e.nome ?? e.tipo}</p>
                    <p className="text-sm text-[#191C1D] mt-0.5 whitespace-pre-wrap">{e.resultado}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(cs.hipoteses_diagnosticas) && cs.hipoteses_diagnosticas.length > 0 && (
            <Section title="Hipóteses diagnósticas">
              <div className="space-y-2">
                {cs.hipoteses_diagnosticas.map((h: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      {h.cid && <span className="font-mono text-[10px] font-bold text-amber-800 px-1.5 py-0.5 rounded bg-amber-200">{h.cid}</span>}
                      <p className="text-sm font-bold text-amber-900">{h.descricao}</p>
                    </div>
                    {h.justificativa && <p className="text-xs text-amber-900 leading-relaxed">{h.justificativa}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cs.diagnostico_final && (
            <Section title="Diagnóstico final" highlight>
              {cs.diagnostico_final}
            </Section>
          )}

          {cs.conduta_proposta && <Section title="Conduta proposta">{cs.conduta_proposta}</Section>}

          {cs.evolucao && <Section title="Evolução">{cs.evolucao}</Section>}

          {Array.isArray(cs.pontos_aprendizado) && cs.pontos_aprendizado.length > 0 && (
            <Section title="Pontos de aprendizado" highlight>
              <ul className="space-y-1.5">
                {cs.pontos_aprendizado.map((p: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Geração de questões */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-[#005344]" />
              <p className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                Questões deste caso
              </p>
              <span className="text-xs font-mono text-[#94a3b8]">({questions.length})</span>
            </div>
            <button
              onClick={() => setShowGenForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#005344] text-white text-xs font-bold hover:bg-[#003D32] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Gerar questões
            </button>
          </div>

          {showGenForm && (
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-1.5">
                  Quantas questões
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={nQuestions}
                  onChange={(e) => setNQuestions(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="w-24 h-10 px-3 rounded-lg border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344]"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold disabled:opacity-50"
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</> : <><Sparkles className="w-4 h-4 text-[#C9A84C]" /> Gerar {nQuestions}</>}
              </button>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#94a3b8]">
              Nenhuma questão gerada ainda. Clique em "Gerar questões" pra começar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q) => {
                const isExpanded = expandedQId === q.id;
                const isRevealed = revealedQId === q.id;
                return (
                  <div key={q.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-['Manrope'] font-bold text-xs text-[#005344]">Q{q.ordem}</span>
                        {q.dificuldade && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            q.dificuldade === "facil" ? "bg-emerald-100 text-emerald-700" :
                            q.dificuldade === "dificil" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {q.dificuldade}
                          </span>
                        )}
                        {q.area && <span className="text-[10px] text-[#94a3b8]">{q.area}</span>}
                      </div>
                      <button
                        onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                        className="text-[#94a3b8] hover:text-[#005344]"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-[#191C1D] leading-relaxed mb-3 whitespace-pre-wrap">{q.enunciado}</p>

                    {isExpanded && (
                      <>
                        <div className="space-y-1.5 mb-3">
                          {q.alternativas.map((a) => {
                            const isCorrect = a.letra === q.letra_correta;
                            return (
                              <div
                                key={a.letra}
                                className={`flex gap-2 p-2.5 rounded-lg border text-sm ${
                                  isRevealed
                                    ? isCorrect
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-slate-200 bg-white"
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                              >
                                <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                  isRevealed && isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-[#4a5568]"
                                }`}>
                                  {isRevealed && isCorrect ? <Check className="w-3.5 h-3.5" /> : a.letra}
                                </span>
                                <div className="flex-1">
                                  <p className={isRevealed && isCorrect ? "text-emerald-900 font-medium" : "text-[#191C1D]"}>{a.texto}</p>
                                  {isRevealed && (
                                    <p className="text-xs text-[#4a5568] mt-1 italic">{a.justificativa}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!isRevealed ? (
                          <button
                            onClick={() => setRevealedQId(q.id)}
                            className="text-xs font-semibold text-[#005344] hover:text-[#003D32]"
                          >
                            Revelar gabarito ↓
                          </button>
                        ) : q.comentario_geral && (
                          <div className="p-3 rounded-lg bg-[#005344]/5 border-l-2 border-[#005344] text-xs text-[#191C1D] leading-relaxed">
                            <strong>Comentário:</strong> {q.comentario_geral}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer educacional */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-[#4a5568] leading-relaxed">
          Conteúdo gerado por IA com finalidade educacional. Use o caso e as questões como ponto
          de partida para aulas/discussões — revise e adapte ao seu contexto antes de aplicar.
        </div>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={`bg-white rounded-2xl border p-5 shadow-[0_1px_2px_rgba(25,28,29,0.04)] ${
      highlight ? "border-[#C9A84C]/40 bg-gradient-to-br from-[#C9A84C]/5 to-transparent" : "border-slate-200"
    }`}>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#005344] mb-2.5 flex items-center gap-2">
        <span className="w-4 h-px bg-[#C9A84C]" />
        {title}
      </p>
      <div className="text-sm text-[#191C1D] leading-relaxed">{children}</div>
    </section>
  );
}

function SubLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-[#191C1D]">
      <strong className="text-[#4a5568]">{label}:</strong> {value}
    </p>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#191C1D] truncate" title={value}>{value}</p>
    </div>
  );
}
