import { useState } from "react";
import {
  Search, UserPlus, Clock, CheckCircle, Plus, X, Loader2,
  ExternalLink, Star, ArrowLeft, Briefcase, Trash2,
} from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";
import {
  useVagas, useCandidatosByVaga, useContratacaoMetricas,
  useCreateVaga, useCreateCandidato, useUpdateCandidatoEtapa, useUpdateCandidato,
  useDeleteVaga, useDeleteCandidato,
} from "@/hooks/useContratacoes";
import type { VagaInsert, CandidatoInsert, Candidato, Vaga } from "@/hooks/useContratacoes";

const AREA_LABELS: Record<string, string> = { tech: "Tech", marketing: "Marketing", ops: "Operacoes", comercial: "Comercial" };
const VINCULO_LABELS: Record<string, string> = { socio: "Socio", clt: "CLT", pj: "PJ", estagio: "Estagio", voluntario: "Voluntario" };
const URG_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: "bg-red-900/30", text: "text-red-400", label: "Alta" },
  media: { bg: "bg-yellow-900/30", text: "text-yellow-400", label: "Media" },
  baixa: { bg: "bg-gray-800", text: "text-gray-400", label: "Baixa" },
};
const STATUS_LABELS: Record<string, string> = { rascunho: "Rascunho", divulgada: "Divulgada", entrevistas: "Entrevistas", oferta: "Oferta", encerrada: "Encerrada" };

const ETAPAS = ["triagem", "rh", "tecnica", "case", "oferta", "aprovado"] as const;
const ETAPA_LABELS: Record<string, string> = {
  triagem: "Triagem", rh: "RH", tecnica: "Tecnica", case: "Case", oferta: "Oferta", aprovado: "Aprovado", recusado: "Recusado",
};
const ETAPA_COLORS: Record<string, string> = {
  triagem: "#6b7280", rh: "#3b82f6", tecnica: "#8b5cf6", case: "#f59e0b", oferta: "#16a34a", aprovado: "#16a34a", recusado: "#ef4444",
};
const FONTE_LABELS: Record<string, string> = { indicacao: "Indicacao", linkedin: "LinkedIn", site: "Site", outro: "Outro" };

export default function AdminContratacoes() {
  const { data: vagas, isLoading } = useVagas();
  const { data: metricas } = useContratacaoMetricas();
  const [selectedVaga, setSelectedVaga] = useState<string | null>(null);
  const [showVagaForm, setShowVagaForm] = useState(false);
  const [showCandForm, setShowCandForm] = useState(false);
  const [selectedCand, setSelectedCand] = useState<Candidato | null>(null);

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  const m = metricas ?? { vagasAbertas: 0, candidatosEmProcesso: 0, tempoMedio: "—", taxaAprovacao: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {selectedVaga ? (
            <button onClick={() => setSelectedVaga(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-1">
              <ArrowLeft className="w-3.5 h-3.5" />Voltar as vagas
            </button>
          ) : null}
          <h1 className="text-2xl font-bold text-white">Contratacoes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pipeline de vagas e candidatos</p>
        </div>
        {!selectedVaga && (
          <button onClick={() => setShowVagaForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />Nova Vaga
          </button>
        )}
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Vagas Abertas" value={m.vagasAbertas} icon={Search} color="blue" subtitle="Em andamento" />
        <MetricCard title="Candidatos" value={m.candidatosEmProcesso} icon={UserPlus} color="purple" subtitle="Em processo" />
        <MetricCard title="Tempo Medio" value={m.tempoMedio} icon={Clock} color="gold" subtitle="Por processo" />
        <MetricCard title="Taxa Aprovacao" value={`${m.taxaAprovacao}%`} icon={CheckCircle} color="green" subtitle="Aprovados/total" />
      </div>

      {/* Vagas ou Kanban */}
      {!selectedVaga ? (
        <VagasList vagas={vagas ?? []} onSelect={setSelectedVaga} />
      ) : (
        <KanbanBoard vagaId={selectedVaga} vaga={(vagas ?? []).find((v) => v.id === selectedVaga)!}
          onAddCandidato={() => setShowCandForm(true)} onClickCand={setSelectedCand} />
      )}

      {/* Modals */}
      {showVagaForm && <VagaFormModal onClose={() => setShowVagaForm(false)} />}
      {showCandForm && selectedVaga && <CandidatoFormModal vagaId={selectedVaga} onClose={() => setShowCandForm(false)} />}
      {selectedCand && <CandidatoDetailModal candidato={selectedCand} onClose={() => setSelectedCand(null)} />}
    </div>
  );
}

// ── Vagas List ───────────────────────────────────────────────
function VagasList({ vagas, onSelect }: { vagas: Vaga[]; onSelect: (id: string) => void }) {
  const deleteVaga = useDeleteVaga();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vagas.map((v) => {
        const urg = URG_CONFIG[v.urgencia] ?? URG_CONFIG.baixa;
        return (
          <div key={v.id} onClick={() => onSelect(v.id)}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-gray-700 hover:shadow-lg transition-all relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{v.titulo}</h3>
                <p className="text-xs text-gray-400">{AREA_LABELS[v.area]} &middot; {VINCULO_LABELS[v.vinculo_desejado]}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${urg.bg} ${urg.text}`}>{urg.label}</span>
            </div>
            <div className="space-y-2 text-xs">
              {(v.faixa_min || v.faixa_max) && (
                <div className="flex justify-between"><span className="text-gray-500">Faixa</span>
                  <span className="text-gray-300">R$ {v.faixa_min?.toLocaleString("pt-BR") ?? "—"} - {v.faixa_max?.toLocaleString("pt-BR") ?? "—"}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Abertura</span><span className="text-gray-300">{new Date(v.data_abertura).toLocaleDateString("pt-BR")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Candidatos</span><span className="text-white font-medium">{v.candidatos_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className="text-[#C9A84C] font-medium">{STATUS_LABELS[v.status] ?? v.status}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-800/50 flex justify-end">
              {confirmDel === v.id ? (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); deleteVaga.mutate(v.id); setConfirmDel(null); }} className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white">Excluir</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setConfirmDel(v.id); }} className="p-1 text-gray-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      {vagas.length === 0 && (
        <div className="col-span-full bg-gray-900/80 border border-gray-800 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma vaga cadastrada</p>
        </div>
      )}
    </div>
  );
}

// ── Kanban Board ─────────────────────────────────────────────
function KanbanBoard({ vagaId, vaga, onAddCandidato, onClickCand }: {
  vagaId: string; vaga: Vaga;
  onAddCandidato: () => void; onClickCand: (c: Candidato) => void;
}) {
  const { data: candidatos } = useCandidatosByVaga(vagaId);
  const updateEtapa = useUpdateCandidatoEtapa();
  const deleteCandidato = useDeleteCandidato();
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrop = (etapa: string) => {
    if (!dragId) return;
    updateEtapa.mutate({ id: dragId, etapa });
    setDragId(null);
  };

  const allEtapas = [...ETAPAS, "recusado" as const];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">{vaga.titulo}</h2>
          <p className="text-xs text-gray-500">{AREA_LABELS[vaga.area]} &middot; {(candidatos ?? []).length} candidatos</p>
        </div>
        <button onClick={onAddCandidato}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
          <UserPlus className="w-3.5 h-3.5" />Novo Candidato
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {allEtapas.map((etapa) => {
          const cards = (candidatos ?? []).filter((c) => c.etapa === etapa);
          const isRecusado = etapa === "recusado";
          return (
            <div key={etapa}
              className={`flex-shrink-0 w-56 rounded-xl border ${isRecusado ? "border-red-800/40 bg-red-900/10" : "border-gray-800 bg-gray-900/60"}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(etapa)}
            >
              <div className="p-3 border-b border-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ETAPA_COLORS[etapa] }} />
                  <span className="text-xs font-semibold text-gray-300">{ETAPA_LABELS[etapa]}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{cards.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {cards.map((c) => (
                  <div key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onClick={() => onClickCand(c)}
                    className="bg-gray-800/80 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700 relative group"
                  >
                    <button onClick={(e) => { e.stopPropagation(); deleteCandidato.mutate(c.id); }}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-sm font-medium text-white mb-1">{c.nome}</p>
                    <div className="flex items-center gap-2">
                      {c.fonte && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-400">
                          {FONTE_LABELS[c.fonte] ?? c.fonte}
                        </span>
                      )}
                      {c.linkedin && <ExternalLink className="w-3 h-3 text-blue-400" />}
                    </div>
                    {c.fit_cultural && (
                      <div className="flex gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${s <= c.fit_cultural! ? "text-[#C9A84C] fill-[#C9A84C]" : "text-gray-700"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vaga Form Modal ──────────────────────────────────────────
function VagaFormModal({ onClose }: { onClose: () => void }) {
  const createVaga = useCreateVaga();
  const [form, setForm] = useState<VagaInsert>({
    titulo: "", area: "tech", vinculo_desejado: "pj", faixa_min: null, faixa_max: null, urgencia: "media", status: "rascunho",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo) return;
    await createVaga.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nova Vaga</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Titulo *</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Area</label>
              <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vinculo</label>
              <select value={form.vinculo_desejado} onChange={(e) => setForm({ ...form, vinculo_desejado: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {Object.entries(VINCULO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Faixa Min (R$)</label>
              <input type="number" value={form.faixa_min ?? ""} onChange={(e) => setForm({ ...form, faixa_min: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Faixa Max (R$)</label>
              <input type="number" value={form.faixa_max ?? ""} onChange={(e) => setForm({ ...form, faixa_max: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Urgencia</label>
              <select value={form.urgencia} onChange={(e) => setForm({ ...form, urgencia: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                <option value="alta">Alta</option><option value="media">Media</option><option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createVaga.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {createVaga.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {createVaga.isPending ? "Salvando..." : "Criar Vaga"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Candidato Form Modal ─────────────────────────────────────
function CandidatoFormModal({ vagaId, onClose }: { vagaId: string; onClose: () => void }) {
  const createCand = useCreateCandidato();
  const [form, setForm] = useState<CandidatoInsert>({ vaga_id: vagaId, nome: "", linkedin: "", fonte: "linkedin", etapa: "triagem" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return;
    await createCand.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Novo Candidato</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome *</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
            <input value={form.linkedin ?? ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fonte</label>
              <select value={form.fonte ?? ""} onChange={(e) => setForm({ ...form, fonte: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {Object.entries(FONTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Etapa Inicial</label>
              <select value={form.etapa ?? "triagem"} onChange={(e) => setForm({ ...form, etapa: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {ETAPAS.map((e) => <option key={e} value={e}>{ETAPA_LABELS[e]}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createCand.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {createCand.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {createCand.isPending ? "Salvando..." : "Adicionar Candidato"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Candidato Detail Modal ───────────────────────────────────
function CandidatoDetailModal({ candidato, onClose }: { candidato: Candidato; onClose: () => void }) {
  const updateCand = useUpdateCandidato();
  const [feedback, setFeedback] = useState(candidato.feedback ?? "");
  const [fit, setFit] = useState(candidato.fit_cultural ?? 0);
  const [dataPrev, setDataPrev] = useState(candidato.data_prevista_inicio ?? "");
  const [obs, setObs] = useState(candidato.observacoes ?? "");

  const handleSave = async () => {
    await updateCand.mutateAsync({
      id: candidato.id,
      data: { feedback, fit_cultural: fit || null, data_prevista_inicio: dataPrev || null, observacoes: obs || null },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">{candidato.nome}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${ETAPA_COLORS[candidato.etapa]}20`, color: ETAPA_COLORS[candidato.etapa] }}>
                {ETAPA_LABELS[candidato.etapa]}
              </span>
              {candidato.fonte && <span className="text-xs text-gray-500">{FONTE_LABELS[candidato.fonte] ?? candidato.fonte}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        {/* Timeline */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 mb-3">Progresso</p>
          <div className="flex items-center gap-1">
            {[...ETAPAS, "recusado" as const].map((e, i) => {
              const isCurrent = candidato.etapa === e;
              const idx = ETAPAS.indexOf(candidato.etapa as typeof ETAPAS[number]);
              const isPast = idx >= 0 && ETAPAS.indexOf(e as typeof ETAPAS[number]) <= idx && e !== "recusado";
              const isRecusado = e === "recusado" && candidato.etapa === "recusado";
              return (
                <div key={e} className="flex-1">
                  <div className={`h-1.5 rounded-full ${isRecusado ? "bg-red-500" : isPast ? "bg-[#C9A84C]" : "bg-gray-800"}`} />
                  <p className={`text-[9px] mt-1 text-center ${isCurrent ? "text-white font-semibold" : "text-gray-600"}`}>
                    {ETAPA_LABELS[e]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {candidato.linkedin && (
          <a href={candidato.linkedin} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-4">
            <ExternalLink className="w-3 h-3" />LinkedIn
          </a>
        )}

        <div className="space-y-4">
          {/* Fit Cultural */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Fit Cultural</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setFit(s)}
                  className="p-0.5"><Star className={`w-5 h-5 ${s <= fit ? "text-[#C9A84C] fill-[#C9A84C]" : "text-gray-700"}`} /></button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Data Prevista Inicio</label>
            <input type="date" value={dataPrev} onChange={(e) => setDataPrev(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Observacoes</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none" />
          </div>

          <button onClick={handleSave} disabled={updateCand.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {updateCand.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {updateCand.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-600">
          Adicionado em {new Date(candidato.created_at).toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}
