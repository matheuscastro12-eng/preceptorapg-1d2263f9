import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, AlertTriangle, Loader2, X } from "lucide-react";

/**
 * Modal de termo de uso do Scribe — exibido na primeira vez que o medico
 * acessa o modulo. Aceite eh registrado em scribe_beta_invites.tos_accepted_at.
 *
 * O texto eh redacao propria, breve, citando CFM/LGPD por referencia.
 * Antes de lancamento aberto pra terceiros, sugiro substituir por texto
 * revisado por advogado.
 */
const ScribeTosModal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState({
    responsabilidade: false,
    lgpd: false,
    rascunho: false,
  });
  const [saving, setSaving] = useState(false);

  // Checa se usuario ja aceitou
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("scribe_beta_invites")
        .select("user_id, tos_accepted_at")
        .eq("user_id", user.id)
        .maybeSingle();
      // Se nao tem invite (admin sem linha), nao mostra modal — admin pode
      // criar invite pra si depois se quiser. Se tem invite mas nao aceitou ainda, mostra.
      if (alive && data && !data.tos_accepted_at) {
        setOpen(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const allAccepted = accepted.responsabilidade && accepted.lgpd && accepted.rascunho;

  const handleAccept = async () => {
    if (!user || !allAccepted) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("scribe_beta_invites")
        .update({ tos_accepted_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Termo aceito" });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3 shrink-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#005344]" />
          </div>
          <div className="flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] mb-0.5">
              Beta fechado · Termo de uso
            </p>
            <h2 className="font-['Manrope'] font-bold text-xl text-[#191C1D] tracking-[-0.015em]">
              Antes de começar a usar o Scribe Clínico
            </h2>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-[#191C1D] leading-relaxed">
          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-2">
              O que é o Scribe
            </h3>
            <p>
              Ferramenta de apoio à documentação clínica que transcreve áudio
              de consulta e estrutura o conteúdo em prontuário SOAP. Toda
              saída da IA é considerada <strong>rascunho</strong> até a
              revisão e assinatura eletrônica do médico.
            </p>
          </div>

          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-2">
              Responsabilidade médica (CFM)
            </h3>
            <p>
              O médico é o responsável legal pelo conteúdo do prontuário,
              independentemente da participação da IA. As resoluções do CFM
              que regem prontuário (1.821/2007) e uso de TI em medicina
              (2.299/2021) continuam aplicáveis. Você revisa cada campo,
              edita o que for necessário e assina antes de salvar.
            </p>
          </div>

          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-2">
              Dados sensíveis e LGPD
            </h3>
            <p>
              Áudio e prontuário contêm dado sensível de saúde (LGPD Art. 11).
              Você precisa do consentimento expresso do paciente <strong>antes</strong>{" "}
              de gravar — o app pede que você registre o método (verbal
              gravado, papel, digital ou testemunha) em cada consulta.
            </p>
            <p className="mt-2">
              Áudio fica criptografado em repouso no Supabase com RLS estrita
              (apenas você acessa). Retenção padrão de 30 dias (configurável
              entre 24h e 90d). Texto SOAP fica retido conforme prazo CFM.
              Auditoria de cada alteração é gravada automaticamente.
            </p>
          </div>

          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-2">
              Prescrição
            </h3>
            <p>
              A IA pode <strong>sugerir</strong> rascunho de prescrição
              baseado no que você disse durante a consulta. <strong>Nunca</strong>{" "}
              prescreve por conta própria. Cada item da prescrição precisa
              ser revisado quanto a dose, frequência, duração e
              contraindicações antes da assinatura. PDF emitido em rascunho
              traz marca d'água visível.
            </p>
          </div>

          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-[#191C1D] mb-2">
              Limitações do beta
            </h3>
            <p>
              Esta versão é beta fechado para validação. Pode haver erros de
              transcrição em áudios ruidosos, com terminologia muito
              específica ou múltiplos falantes simultâneos. Reporte
              problemas pra ajudar a calibrar antes do lançamento aberto.
            </p>
          </div>

          {/* Aceites */}
          <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Confirme cada item para ativar o módulo
              </span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.responsabilidade}
                onChange={(e) =>
                  setAccepted({ ...accepted, responsabilidade: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-[#005344]"
              />
              <span className="text-sm text-amber-900">
                Sou médico ou residente regularmente inscrito e{" "}
                <strong>assumo responsabilidade integral</strong> pelo
                conteúdo dos prontuários gerados (CFM 1.821/2007 e 2.299/2021).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.lgpd}
                onChange={(e) => setAccepted({ ...accepted, lgpd: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-[#005344]"
              />
              <span className="text-sm text-amber-900">
                Comprometo-me a obter <strong>consentimento expresso</strong>{" "}
                de cada paciente antes da gravação (LGPD Art. 11) e respeitar
                a revogação a qualquer tempo.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.rascunho}
                onChange={(e) => setAccepted({ ...accepted, rascunho: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-[#005344]"
              />
              <span className="text-sm text-amber-900">
                Entendo que <strong>tudo que a IA gera é rascunho</strong>,
                inclusive sugestões de prescrição. Reviso cada campo antes
                de assinar e exportar.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-[#94a3b8]">
            Aceite registrado com data/hora no seu perfil de beta.
          </p>
          <button
            onClick={handleAccept}
            disabled={!allAccepted || saving}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white font-bold text-sm font-['Manrope'] shadow-[0_4px_12px_-4px_rgba(0,109,91,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Aceitar e ativar Scribe
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScribeTosModal;
