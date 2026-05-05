import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  startCaseChat, replyCaseChat, finalizeCaseChat,
  type ConversationMsg, type BuildCaseResponse,
} from "@/hooks/useClinicalCases";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageSkeleton from "@/components/PageSkeleton";
import UpgradePaywall from "@/components/UpgradePaywall";
import {
  ArrowLeft, Send, Sparkles, Loader2, CheckCircle2, Stethoscope, Flag,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CasosClinicosNovo() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const continuarId = params.get("continuar");

  const [caseId, setCaseId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [placeholder, setPlaceholder] = useState("");
  const [completing, setCompleting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Bootstrap: novo OR continuar
  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!user || !hasAccess) { setBootstrapping(false); return; }

    let alive = true;
    (async () => {
      try {
        if (continuarId) {
          // Carrega caso existente em construção
          const { data, error } = await supabase
            .from("clinical_cases")
            .select("id, conversation, status")
            .eq("id", continuarId)
            .maybeSingle();
          if (error || !data) throw error ?? new Error("Caso não encontrado");
          if (data.status === "complete") {
            navigate(`/casos-clinicos/${data.id}`, { replace: true });
            return;
          }
          if (alive) {
            setCaseId(data.id);
            setConversation((data.conversation as ConversationMsg[]) ?? []);
            // Estima progresso pelo número de mensagens
            setProgress(Math.min(85, ((data.conversation as ConversationMsg[]).length / 2) * 12));
          }
        } else {
          const res = await startCaseChat();
          if (alive) {
            setCaseId(res.case_id);
            setConversation(res.conversation);
            setPlaceholder(res.placeholder_hint ?? "");
            setProgress(res.progress_pct ?? 5);
          }
        }
      } catch (e) {
        toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => { alive = false; };
  }, [authLoading, subLoading, user, hasAccess, continuarId, navigate]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [conversation, sending]);

  if (authLoading || subLoading || bootstrapping) return <PageSkeleton variant="dashboard" />;
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
  if (!caseId) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 px-4 text-center">
          <p className="text-sm text-[#4a5568]">Não foi possível iniciar o caso.</p>
          <button onClick={() => navigate("/casos-clinicos")} className="mt-4 px-4 h-10 rounded-lg bg-[#005344] text-white text-sm font-bold">Voltar</button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || sending) return;
    setSending(true);
    // Otimista
    setConversation((prev) => [...prev, { role: "user", content: txt }]);
    setInput("");
    try {
      const res: BuildCaseResponse = await replyCaseChat(caseId, txt);
      setConversation(res.conversation);
      setProgress(res.progress_pct ?? progress);
      setPlaceholder(res.placeholder_hint ?? "");
      if (res.complete) {
        toast({
          title: "Caso pronto!",
          description: "PreceptorMED estruturou seu caso clínico. Veja abaixo.",
        });
        setTimeout(() => navigate(`/casos-clinicos/${caseId}`), 800);
      }
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
      // remove a msg otimista
      setConversation((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.content === txt)));
      setInput(txt);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFinalize = async () => {
    if (sending || completing) return;
    if (!confirm("Finalizar agora? PreceptorMED vai estruturar o caso com a informação que tem.")) return;
    setCompleting(true);
    try {
      const res = await finalizeCaseChat(caseId);
      setConversation(res.conversation);
      if (res.complete) {
        toast({ title: "Caso pronto!" });
        navigate(`/casos-clinicos/${caseId}`);
      }
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  const lastMsg = conversation[conversation.length - 1];
  const isAssistantTurn = lastMsg?.role === "assistant";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
        <button
          onClick={() => navigate("/casos-clinicos")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4 self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Casos clínicos
        </button>

        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
          <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />

          {/* Header */}
          <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005344]/15 to-[#C9A84C]/15 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-[#005344]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26]">
                PreceptorMED
              </p>
              <h1 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                Construindo caso clínico
              </h1>
            </div>
            {conversation.length > 4 && (
              <button
                onClick={handleFinalize}
                disabled={completing || sending}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold border border-[#005344]/30 text-[#005344] hover:bg-[#005344]/5 disabled:opacity-50"
                title="Estrutura o caso com a informação que já temos"
              >
                {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                Finalizar agora
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-[#005344] to-[#C9A84C] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-4 min-h-[300px]">
            {conversation.map((m, i) => (
              <Message key={i} msg={m} />
            ))}
            {sending && <Message msg={{ role: "assistant", content: "" }} isThinking />}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-4 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder || (isAssistantTurn ? "Sua resposta…" : "Aguarde…")}
                disabled={sending || completing}
                autoFocus
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || completing || !input.trim()}
                className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_-4px_rgba(0,109,91,0.4)]"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            {placeholder && (
              <p className="text-[11px] text-[#94a3b8] mt-2 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Dica: {placeholder}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Message({ msg, isThinking }: { msg: ConversationMsg; isThinking?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#005344] text-white"
            : "bg-slate-50 border border-slate-200 text-[#191C1D]"
        }`}
      >
        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#005344] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#005344] animate-pulse" style={{ animationDelay: "200ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#005344] animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
        ) : (
          renderMarkdown(msg.content)
        )}
      </div>
    </div>
  );
}

// Markdown leve: ** ** vira bold
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}
