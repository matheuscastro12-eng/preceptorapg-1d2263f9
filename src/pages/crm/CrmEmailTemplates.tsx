import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/crm/supabase";
import { Mail, Save, Eye, Loader2, FileText, Check } from "lucide-react";
import { toast } from "sonner";

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
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" /> Templates de Email
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Personalize o assunto, preview e corpo de cada automacao. Usa <code className="text-green-400">{"{{nome}}"}</code> para substituir pelo nome do destinatario.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Lista de templates */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Templates ({templates.length})</p>
          </div>
          <div className="divide-y divide-gray-800/50 max-h-[600px] overflow-y-auto crm-scrollbar">
            {templates.map((t) => (
              <button
                key={t.trigger_name}
                onClick={() => setSelected(t.trigger_name)}
                className={`w-full text-left px-3 py-2.5 hover:bg-gray-800/50 transition-colors ${
                  selected === t.trigger_name ? "bg-green-900/20 border-l-2 border-green-400" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <p className="text-sm font-medium text-white truncate">{t.label}</p>
                </div>
                {t.description && (
                  <p className="text-[11px] text-gray-500 mt-0.5 pl-5 truncate">{t.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {current && (
          <div className="space-y-4">
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assunto</label>
                <input
                  value={draft.subject}
                  onChange={(e) => { setDraft({ ...draft, subject: e.target.value }); setSaved(false); }}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview (texto curto mostrado na caixa)</label>
                <input
                  value={draft.preview}
                  onChange={(e) => { setDraft({ ...draft, preview: e.target.value }); setSaved(false); }}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Corpo do email (HTML)</span>
                  <span className="text-[10px] text-gray-500 normal-case font-normal">
                    Variaveis: <code className="text-green-400">{"{{nome}}"}</code>
                  </span>
                </label>
                <textarea
                  value={draft.body_html}
                  onChange={(e) => { setDraft({ ...draft, body_html: e.target.value }); setSaved(false); }}
                  rows={12}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-green-600 resize-y"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-700 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? "Salvo" : saving ? "Salvando..." : "Salvar"}
                </button>
                <span className="text-[11px] text-gray-500">
                  Ultima edicao: {new Date(current.updated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-white">Preview</p>
                <span className="text-[11px] text-gray-500 ml-auto">Renderizado com nome = "Matheus"</span>
              </div>
              <div className="bg-gray-800 p-4">
                <div className="text-xs text-gray-400 mb-2"><strong>De:</strong> PreceptorMED &lt;noreply@thepreceptor.com.br&gt;</div>
                <div className="text-xs text-gray-400 mb-3"><strong>Assunto:</strong> {draft.subject}</div>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px] border border-gray-700 rounded bg-white"
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
