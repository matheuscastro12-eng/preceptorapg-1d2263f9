import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/crm/supabase";
import { Mail, Save, Eye, Loader2, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/crm/RichTextEditor";

interface Template {
  trigger_name: string;
  label: string;
  subject: string;
  preview: string | null;
  body_html: string;
  description: string | null;
  variables: string[];
  updated_at: string;
}

const WRAPPER = (body: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#1B5E3B;padding:24px;text-align:center">
    <h1 style="color:#C9A84C;margin:0;font-size:22px">PreceptorMED</h1>
  </div>
  <div style="padding:32px 28px">${body}</div>
  <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:11px;color:#999">
    Preceptor Group &copy; 2026 &middot; Voce recebeu este email por ser assinante do PreceptorMED
  </div>
</div>`;

export default function CrmEmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; preview: string; body_html: string }>({
    subject: "", preview: "", body_html: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_email_templates")
      .select("*")
      .order("label");
    setTemplates((data ?? []) as Template[]);
    if ((data?.length ?? 0) > 0 && !selected) setSelected(data![0].trigger_name);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const current = useMemo(
    () => templates.find((t) => t.trigger_name === selected) ?? null,
    [templates, selected]
  );

  useEffect(() => {
    if (current) {
      setDraft({
        subject: current.subject,
        preview: current.preview ?? "",
        body_html: current.body_html,
      });
      setSaved(false);
    }
  }, [current]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("crm_email_templates")
      .update({
        subject: draft.subject,
        preview: draft.preview,
        body_html: draft.body_html,
        updated_at: new Date().toISOString(),
      })
      .eq("trigger_name", selected);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Template salvo");
      setSaved(true);
      await load();
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const previewHtml = useMemo(() => {
    const body = draft.body_html.replace(/\{\{nome\}\}/g, "Matheus");
    return WRAPPER(body);
  }, [draft.body_html]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-green-900/40 bg-gradient-to-br from-green-950/60 via-gray-900 to-gray-900 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Templates de Email</h1>
              <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                Personalize cada automacao com um editor estilo Word. Use <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">{"{{nome}}"}</code> para incluir o nome do destinatario automaticamente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Lista de templates */}
        <div className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden h-fit sticky top-4">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/80">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Automacoes
            </p>
          </div>
          <div className="divide-y divide-gray-800/40 max-h-[620px] overflow-y-auto crm-scrollbar py-1">
            {templates.map((t) => (
              <button
                key={t.trigger_name}
                onClick={() => setSelected(t.trigger_name)}
                className={`group w-full text-left px-4 py-3 transition-all ${
                  selected === t.trigger_name
                    ? "bg-gradient-to-r from-green-500/15 to-transparent border-l-[3px] border-green-400"
                    : "border-l-[3px] border-transparent hover:bg-gray-800/40"
                }`}
              >
                <p className={`text-sm font-semibold truncate ${selected === t.trigger_name ? "text-white" : "text-gray-200 group-hover:text-white"}`}>
                  {t.label}
                </p>
                {t.description && (
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{t.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Editor + Preview side by side */}
        {current && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Editor */}
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Editando</p>
                  <h2 className="text-base font-bold text-white truncate">{current.label}</h2>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    saved
                      ? "bg-green-500/20 text-green-300 border border-green-500/40"
                      : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/30"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? "Salvo" : saving ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Assunto do email
                  </label>
                  <input
                    value={draft.subject}
                    onChange={(e) => { setDraft({ ...draft, subject: e.target.value }); setSaved(false); }}
                    placeholder="Ex: Voce tem 20% OFF esperando..."
                    className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Pre-visualizacao <span className="text-gray-600 font-normal normal-case">(texto cinza que aparece na caixa de entrada ao lado do assunto)</span>
                  </label>
                  <input
                    value={draft.preview}
                    onChange={(e) => { setDraft({ ...draft, preview: e.target.value }); setSaved(false); }}
                    placeholder="Frase curta que chama atencao"
                    className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Conteudo do email
                  </label>
                  <RichTextEditor
                    value={draft.body_html}
                    onChange={(html) => { setDraft({ ...draft, body_html: html }); setSaved(false); }}
                  />
                  <p className="text-[11px] text-gray-500 mt-2 flex items-start gap-1.5">
                    <span className="text-green-400">💡</span>
                    <span>Use a barra para formatar como no Word. O botao <code className="text-green-400 bg-green-500/10 px-1 py-0.5 rounded">+ {"{{nome}}"}</code> insere o nome do destinatario onde o cursor estiver.</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-800/60 text-[11px] text-gray-500">
                  Ultima edicao: {new Date(current.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Preview — simula caixa de entrada */}
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden xl:sticky xl:top-4 xl:h-fit">
              <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-bold text-white">Pre-visualizacao</p>
                <span className="text-[10px] text-gray-500 ml-auto bg-gray-800/60 px-2 py-0.5 rounded-full">
                  nome = "Matheus"
                </span>
              </div>
              <div className="p-4 bg-gradient-to-b from-gray-800/60 to-gray-900/40">
                {/* Mock inbox header */}
                <div className="bg-white rounded-t-xl border border-gray-200 px-5 py-4 space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[11px] font-semibold text-gray-500 w-16 shrink-0">De:</span>
                    <span className="text-xs text-gray-900">PreceptorMED <span className="text-gray-500">&lt;noreply@thepreceptor.com.br&gt;</span></span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-[11px] font-semibold text-gray-500 w-16 shrink-0">Assunto:</span>
                    <span className="text-sm font-semibold text-gray-900">{draft.subject || <em className="text-gray-400 font-normal">(vazio)</em>}</span>
                  </div>
                  {draft.preview && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-semibold text-gray-500 w-16 shrink-0">Preview:</span>
                      <span className="text-xs text-gray-500 italic">{draft.preview}</span>
                    </div>
                  )}
                </div>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[560px] border border-t-0 border-gray-200 rounded-b-xl bg-white"
                  title="preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
