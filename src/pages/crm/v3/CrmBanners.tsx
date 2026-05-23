/**
 * /admin/crm-mkt/banners — CMS dos banners da home.
 *
 * Permite ao time de marketing cadastrar, ordenar, agendar e desativar
 * banners rotativos exibidos na Landing pelo HeroBannerCarousel.
 *
 * Toda escrita passa pela edge function `crm-admin-actions` (service_role
 * bypassa RLS); leitura admin tambem é via edge fn (lista todos, inclusive
 * inativos). A Landing publica consome a tabela diretamente via RLS.
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CrmShellV3, { PageHero } from "@/components/crm/v3/CrmShellV3";
import {
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Upload, Loader2, X, ExternalLink, EyeOff, Eye,
} from "lucide-react";

const CRM_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-admin-actions`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_label: string;
  cta_link: string;
  link_target: "same" | "new";
  ordem: number;
  ativo: boolean;
  starts_at: string | null;
  ends_at: string | null;
  audience: "all" | "visitors" | "free" | "paid";
  created_at: string;
  updated_at: string;
};

type BannerForm = Omit<Banner, "id" | "created_at" | "updated_at">;

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_label: "Cadastre-se agora",
  cta_link: "/auth?tab=signup",
  link_target: "same",
  ordem: 0,
  ativo: true,
  starts_at: null,
  ends_at: null,
  audience: "all",
};

const AUDIENCE_LABEL: Record<Banner["audience"], string> = {
  all: "Todos",
  visitors: "Visitantes (não logado)",
  free: "Plano gratuito",
  paid: "Plano pago",
};

async function callAction<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = localStorage.getItem("crm_token");
  const res = await fetch(CRM_ACTIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ action, token, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Falha em ${action}`);
  return data as T;
}

async function uploadImageToStorage(file: File): Promise<string> {
  // 1) pede uma URL assinada à edge function
  const { uploadUrl, publicUrl } = await callAction<{ uploadUrl: string; token: string; path: string; publicUrl: string }>(
    "banner_get_upload_url",
    { filename: file.name },
  );
  // 2) PUT direto no Storage
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type, "x-upsert": "true" },
    body: file,
  });
  if (!put.ok) throw new Error("Falha no upload da imagem para o storage");
  return publicUrl;
}

export default function CrmBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-banners"],
    queryFn: async () => {
      const res = await callAction<{ banners: Banner[] }>("banner_list_all");
      return res.banners;
    },
  });

  const banners = data ?? [];
  const isEditing = !!editing || creating;

  const startCreate = () => {
    const nextOrdem = (banners.length > 0 ? Math.max(...banners.map((b) => b.ordem)) : -1) + 1;
    setForm({ ...EMPTY_FORM, ordem: nextOrdem });
    setEditing(null);
    setCreating(true);
  };

  const startEdit = (b: Banner) => {
    setForm({
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      image_url: b.image_url,
      cta_label: b.cta_label,
      cta_link: b.cta_link,
      link_target: b.link_target,
      ordem: b.ordem,
      ativo: b.ativo,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      audience: b.audience,
    });
    setEditing(b);
    setCreating(false);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.image_url) throw new Error("Adicione uma imagem antes de salvar");
      if (!form.cta_link) throw new Error("Link do CTA é obrigatório");
      const payload = {
        ...form,
        title: form.title?.trim() || null,
        subtitle: form.subtitle?.trim() || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editing) {
        await callAction("banner_update", { id: editing.id, banner: payload });
      } else {
        await callAction("banner_create", { banner: payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-banners"] });
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => callAction("banner_delete", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-banners"] }),
  });

  const toggleMut = useMutation({
    mutationFn: async (b: Banner) =>
      callAction("banner_update", { id: b.id, banner: { ativo: !b.ativo } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-banners"] }),
  });

  const reorderMut = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) =>
      callAction("banner_reorder", { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-banners"] }),
  });

  const move = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= banners.length) return;
    const a = banners[idx], b = banners[next];
    reorderMut.mutate([
      { id: a.id, ordem: b.ordem },
      { id: b.id, ordem: a.ordem },
    ]);
  };

  const onPickFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Imagem maior que 10 MB. Reduza antes de enviar.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Banners da home" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · CMS"
          title={<>Banners <em>da home</em></>}
          sub="Carrossel rotativo do topo da landing. Cadastre, ordene, agende e segmente por público."
          actions={
            <button onClick={startCreate} className="crm-btn crm-btn-primary">
              <Plus size={14} /> Novo banner
            </button>
          }
        />

        {isEditing && (
          <section className="crm-card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: "#0F4128" }}>
                {editing ? "Editar banner" : "Novo banner"}
              </h3>
              <button onClick={closeForm} className="crm-btn crm-btn-ghost">
                <X size={14} /> Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Coluna imagem */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-700">Imagem (1920×400 recomendado)</label>
                {form.image_url ? (
                  <div className="relative rounded-md overflow-hidden border border-gray-200">
                    <img src={form.image_url} alt="Preview do banner" className="w-full h-32 object-cover bg-gray-50" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded p-1 hover:bg-black"
                      aria-label="Remover imagem"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-md border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">PNG, JPG, WEBP ou AVIF · até 10 MB</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="crm-btn crm-btn-ghost"
                  >
                    {uploading ? <><Loader2 size={13} className="animate-spin" /> Enviando…</> : <><Upload size={13} /> Enviar imagem</>}
                  </button>
                  <input
                    type="text"
                    placeholder="…ou cole uma URL externa"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                  />
                </div>
              </div>

              {/* Coluna campos */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Título (opcional)</label>
                  <input
                    type="text" value={form.title ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder='Ex.: "Cadastre-se e ganhe 10% OFF"'
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Subtítulo (opcional)</label>
                  <input
                    type="text" value={form.subtitle ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    placeholder='Texto de apoio'
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Texto do botão (CTA)</label>
                    <input
                      type="text" value={form.cta_label}
                      onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Link do CTA *</label>
                    <input
                      type="text" value={form.cta_link} required
                      onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))}
                      placeholder="/auth?tab=signup"
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Abrir em</label>
                    <select
                      value={form.link_target}
                      onChange={(e) => setForm((f) => ({ ...f, link_target: e.target.value as Banner["link_target"] }))}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    >
                      <option value="same">Mesma aba (recomendado)</option>
                      <option value="new">Nova aba</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Público-alvo</label>
                    <select
                      value={form.audience}
                      onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Banner["audience"] }))}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    >
                      <option value="all">Todos</option>
                      <option value="visitors">Visitantes (não logado)</option>
                      <option value="free">Plano gratuito</option>
                      <option value="paid">Plano pago</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Início (opcional)</label>
                    <input
                      type="datetime-local"
                      value={form.starts_at ? form.starts_at.slice(0, 16) : ""}
                      onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Fim (opcional)</label>
                    <input
                      type="datetime-local"
                      value={form.ends_at ? form.ends_at.slice(0, 16) : ""}
                      onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-green-700"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox" checked={form.ativo}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  />
                  <span className="text-xs font-semibold text-gray-700">Ativo (aparece na home se dentro da janela)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              {saveMut.error && (
                <span className="text-xs text-red-600 mr-auto self-center">{(saveMut.error as Error).message}</span>
              )}
              <button onClick={closeForm} className="crm-btn crm-btn-ghost">Cancelar</button>
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !form.image_url || !form.cta_link}
                className="crm-btn crm-btn-primary"
              >
                {saveMut.isPending ? <><Loader2 size={13} className="animate-spin" /> Salvando…</> : "Salvar banner"}
              </button>
            </div>
          </section>
        )}

        <section className="crm-card" style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" /></div>
          ) : banners.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500 mb-3">Nenhum banner cadastrado ainda.</p>
              <button onClick={startCreate} className="crm-btn crm-btn-primary">
                <Plus size={14} /> Criar primeiro banner
              </button>
            </div>
          ) : (
            <table className="crm-tbl">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Ordem</th>
                  <th style={{ width: 140 }}>Imagem</th>
                  <th>Conteúdo</th>
                  <th style={{ width: 120 }}>Público</th>
                  <th style={{ width: 200 }}>Janela</th>
                  <th style={{ width: 80 }}>Status</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b, idx) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => move(idx, -1)} disabled={idx === 0 || reorderMut.isPending} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">
                          <ArrowUp size={14} />
                        </button>
                        <span className="text-xs font-mono">{b.ordem}</span>
                        <button onClick={() => move(idx, 1)} disabled={idx === banners.length - 1 || reorderMut.isPending} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <img src={b.image_url} alt={b.title ?? "banner"} className="w-32 h-12 object-cover rounded bg-gray-100 border border-gray-200" />
                    </td>
                    <td>
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{b.title || <span className="text-gray-400 italic">(sem título)</span>}</div>
                      {b.subtitle && <div className="text-xs text-gray-500 line-clamp-1">{b.subtitle}</div>}
                      <a href={b.cta_link} target="_blank" rel="noreferrer" className="text-[11px] text-green-700 hover:underline inline-flex items-center gap-1 mt-0.5">
                        <span className="font-medium">{b.cta_label}</span>
                        <ExternalLink size={10} />
                        <span className="text-gray-400 font-mono">{b.cta_link}</span>
                      </a>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600">{AUDIENCE_LABEL[b.audience]}</span>
                    </td>
                    <td>
                      <div className="text-[11px] text-gray-500 leading-relaxed">
                        {b.starts_at ? <>de <strong>{new Date(b.starts_at).toLocaleString("pt-BR")}</strong></> : <span className="text-gray-400">sem início</span>}
                        <br />
                        {b.ends_at ? <>até <strong>{new Date(b.ends_at).toLocaleString("pt-BR")}</strong></> : <span className="text-gray-400">sem fim</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleMut.mutate(b)}
                        disabled={toggleMut.isPending}
                        className={`crm-btn ${b.ativo ? "crm-btn-ghost" : "crm-btn-ghost"} text-xs`}
                        title={b.ativo ? "Desativar" : "Ativar"}
                      >
                        {b.ativo ? <><Eye size={12} /> Ativo</> : <><EyeOff size={12} /> Inativo</>}
                      </button>
                    </td>
                    <td className="text-right">
                      <button onClick={() => startEdit(b)} className="crm-btn crm-btn-ghost text-xs">
                        <Edit3 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => { if (confirm("Excluir este banner? A imagem do storage também será removida.")) deleteMut.mutate(b.id); }}
                        disabled={deleteMut.isPending}
                        className="crm-btn crm-btn-ghost text-xs text-red-600"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}
