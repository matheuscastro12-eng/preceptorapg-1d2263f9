import { useState } from "react";
import { Users, Plus, X, Loader2, LayoutGrid, List, Trash2, Edit2 } from "lucide-react";
import { useMembros, useCreateMembro, useUpdateMembro, useDeleteMembro } from "@/hooks/useTime";
import type { MembroInsert, Membro } from "@/hooks/useTime";
import MetricCard from "@/components/crm/MetricCard";

const AREA_LABELS: Record<string, string> = { tech: "Tech", marketing: "Marketing", ops: "Operacoes", comercial: "Comercial" };
const AREA_COLORS: Record<string, string> = { tech: "#3b82f6", marketing: "#8b5cf6", ops: "#f59e0b", comercial: "#16a34a" };
const VINCULO_LABELS: Record<string, string> = { socio: "Socio", clt: "CLT", pj: "PJ", estagio: "Estagio", voluntario: "Voluntario" };
const VINCULO_COLORS: Record<string, { bg: string; text: string }> = {
  socio: { bg: "bg-yellow-900/30", text: "text-yellow-400" },
  clt: { bg: "bg-green-900/30", text: "text-green-400" },
  pj: { bg: "bg-blue-900/30", text: "text-blue-400" },
  estagio: { bg: "bg-purple-900/30", text: "text-purple-400" },
  voluntario: { bg: "bg-gray-800", text: "text-gray-400" },
};

const INITIALS_COLORS = ["#ef4444", "#3b82f6", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

function getInitials(nome: string) {
  return nome.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getInitialsColor(nome: string) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

const emptyForm: MembroInsert = {
  nome: "", cargo: "", area: "tech", vinculo: "pj", data_entrada: new Date().toISOString().split("T")[0],
  status: "ativo", email: "", linkedin: "", aniversario: "", cidade: "", foto_url: "",
};

export default function AdminTime() {
  const [areaFilter, setAreaFilter] = useState("");
  const [vinculoFilter, setVinculoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MembroInsert>({ ...emptyForm });

  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: membros, isLoading } = useMembros({
    area: areaFilter || undefined,
    vinculo: vinculoFilter || undefined,
    status: statusFilter || undefined,
  });
  const createMembro = useCreateMembro();
  const updateMembro = useUpdateMembro();
  const deleteMembro = useDeleteMembro();

  // Populate form when editing
  const openEdit = (m: Membro) => {
    setForm({
      nome: m.nome, cargo: m.cargo, area: m.area, vinculo: m.vinculo,
      data_entrada: m.data_entrada, status: m.status,
      email: m.email ?? "", linkedin: m.linkedin ?? "",
      aniversario: m.aniversario ?? "", cidade: m.cidade ?? "", foto_url: m.foto_url ?? "",
    });
    setEditingMembro(m);
    setShowForm(true);
  };

  // Override setEditingMembro+setShowForm to also populate form
  const originalSetEditingMembro = setEditingMembro;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cargo) return;
    const clean = { ...form };
    if (!clean.foto_url) clean.foto_url = null;
    if (!clean.email) clean.email = null;
    if (!clean.linkedin) clean.linkedin = null;
    if (!clean.aniversario) clean.aniversario = null;
    if (!clean.cidade) clean.cidade = null;

    if (editingMembro) {
      await updateMembro.mutateAsync({ id: editingMembro.id, data: clean });
    } else {
      await createMembro.mutateAsync(clean);
    }
    setForm({ ...emptyForm });
    setEditingMembro(null);
    setShowForm(false);
  };

  const ativos = (membros ?? []).filter((m) => m.status === "ativo").length;
  const areas = new Set((membros ?? []).map((m) => m.area)).size;

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ativos} membros ativos em {areas} areas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded-md ${viewMode === "cards" ? "bg-[#C9A84C] text-gray-900" : "text-gray-400"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md ${viewMode === "table" ? "bg-[#C9A84C] text-gray-900" : "text-gray-400"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />Novo Membro
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
          <option value="">Todas areas</option>
          {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={vinculoFilter} onChange={(e) => setVinculoFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
          <option value="">Todos vinculos</option>
          {Object.entries(VINCULO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
          <option value="">Todos status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(membros ?? []).map((m) => {
            const vc = VINCULO_COLORS[m.vinculo] ?? VINCULO_COLORS.voluntario;
            return (
              <div key={m.id} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  {m.foto_url ? (
                    <img src={m.foto_url} alt={m.nome} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: getInitialsColor(m.nome) }}>
                      {getInitials(m.nome)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{m.nome}</p>
                    <p className="text-xs text-gray-400">{m.cargo}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${m.status === "ativo" ? "bg-green-400" : "bg-gray-600"}`} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Area</span>
                    <span className="text-xs font-medium" style={{ color: AREA_COLORS[m.area] }}>{AREA_LABELS[m.area] ?? m.area}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Vinculo</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${vc.bg} ${vc.text}`}>
                      {VINCULO_LABELS[m.vinculo] ?? m.vinculo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Entrada</span>
                    <span className="text-xs text-gray-300">{new Date(m.data_entrada).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {m.cidade && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Cidade</span>
                      <span className="text-xs text-gray-400">{m.cidade}</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-800/50">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-500 hover:text-[#C9A84C] hover:bg-gray-800 transition-colors">
                    <Edit2 className="w-3 h-3" />Editar
                  </button>
                  {confirmDel === m.id ? (
                    <div className="flex gap-1 ml-auto">
                      <button onClick={() => { deleteMembro.mutate(m.id); setConfirmDel(null); }} className="px-2 py-1 rounded text-[10px] bg-red-600 text-white">Sim</button>
                      <button onClick={() => setConfirmDel(null)} className="px-2 py-1 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(m.id)} className="ml-auto p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Membro", "Cargo", "Area", "Vinculo", "Entrada", "Status", "Cidade", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {(membros ?? []).map((m) => {
                  const vc = VINCULO_COLORS[m.vinculo] ?? VINCULO_COLORS.voluntario;
                  return (
                    <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {m.foto_url ? (
                            <img src={m.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                              style={{ backgroundColor: getInitialsColor(m.nome) }}>
                              {getInitials(m.nome)}
                            </div>
                          )}
                          <span className="text-white font-medium">{m.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{m.cargo}</td>
                      <td className="py-3 px-4"><span style={{ color: AREA_COLORS[m.area] }} className="text-xs font-medium">{AREA_LABELS[m.area]}</span></td>
                      <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${vc.bg} ${vc.text}`}>{VINCULO_LABELS[m.vinculo]}</span></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(m.data_entrada).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 px-4"><div className={`w-2 h-2 rounded-full ${m.status === "ativo" ? "bg-green-400" : "bg-gray-600"}`} /></td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{m.cidade ?? "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { openEdit(m); }} className="p-1 text-gray-600 hover:text-[#C9A84C] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          {confirmDel === m.id ? (
                            <>
                              <button onClick={() => { deleteMembro.mutate(m.id); setConfirmDel(null); }} className="px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white">Sim</button>
                              <button onClick={() => setConfirmDel(null)} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDel(m.id)} className="p-1 text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(membros ?? []).length === 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum membro encontrado</p>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editingMembro ? "Editar Membro" : "Novo Membro"}</h2>
              <button onClick={() => { setShowForm(false); setEditingMembro(null); setForm({ ...emptyForm }); }} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cargo *</label>
                  <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
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
                  <select value={form.vinculo} onChange={(e) => setForm({ ...form, vinculo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    {Object.entries(VINCULO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data Entrada</label>
                  <input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cidade</label>
                  <input value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Aniversario</label>
                  <input type="date" value={form.aniversario ?? ""} onChange={(e) => setForm({ ...form, aniversario: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
                <input value={form.linkedin ?? ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <button type="submit" disabled={createMembro.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {createMembro.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {(createMembro.isPending || updateMembro.isPending) ? "Salvando..." : editingMembro ? "Salvar Alteracoes" : "Cadastrar Membro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
