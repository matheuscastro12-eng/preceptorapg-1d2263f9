import { useState } from "react";
import { X, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabaseCrm } from "@/integrations/supabase/crm-client";

interface SendEmailModalProps {
  to: string;
  nome: string;
  onClose: () => void;
}

export default function SendEmailModal({ to, nome, onClose }: SendEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-custom-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            to,
            subject,
            message,
            senderName: "Equipe Preceptor",
          }),
        }
      );

      const data = await resp.json();
      if (data.success) {
        setResult({ success: true });
      } else {
        setResult({ success: false, error: data.error || "Erro ao enviar" });
      }
    } catch (err) {
      setResult({ success: false, error: "Erro de conexao" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm sm:max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Enviar Email</h3>
            <p className="text-xs text-gray-500 mt-0.5">Para: {nome} ({to})</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {result?.success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-white">Email enviado com sucesso!</p>
              <p className="text-xs text-gray-500 mt-1">Para: {to}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700">
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Assunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex: Sobre sua assinatura..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C] transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mensagem</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem aqui..."
                  rows={6}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Sera enviado como noreply@thepreceptor.com.br com layout PreceptorMED</p>
              </div>

              {result?.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{result.error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Enviando..." : "Enviar Email"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
