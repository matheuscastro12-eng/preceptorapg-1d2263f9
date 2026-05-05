import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft, Send, Sparkles, Loader2, Stethoscope, Flag, User as UserIcon,
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
  // Índice da última mensagem do assistant que devemos animar com typewriter
  const [typewriterIdx, setTypewriterIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bootstrappedRef = useRef(false);

  const userId = user?.id;

  // Bootstrap
  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!userId || !hasAccess) { setBootstrapping(false); return; }
    if (bootstrappedRef.current) { setBootstrapping(false); return; }
    bootstrappedRef.current = true;

    let alive = true;
    (async () => {
      try {
        if (continuarId) {
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
            const conv = (data.conversation as ConversationMsg[]) ?? [];
            setCaseId(data.id);
            setConversation(conv);
            setProgress(Math.min(85, (conv.length / 2) * 12));
            // Sem typewriter ao continuar (mensagens já lidas)
            setTypewriterIdx(null);
          }
        } else {
          const res = await startCaseChat();
          if (alive) {
            setCaseId(res.case_id);
            setConversation(res.conversation);
            setPlaceholder(res.placeholder_hint ?? "");
            setProgress(res.progress_pct ?? 5);
            // Animar a saudação inicial
            setTypewriterIdx(res.conversation.length - 1);
            navigate(`/casos-clinicos/novo?continuar=${res.case_id}`, { replace: true });
          }
        }
      } catch (e) {
        toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, subLoading, userId, hasAccess, continuarId]);

  // Auto-scroll suave a cada nova msg
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
    setConversation((prev) => [...prev, { role: "user", content: txt }]);
    setInput("");
    try {
      const res: BuildCaseResponse = await replyCaseChat(caseId, txt);
      setConversation(res.conversation);
      setProgress(res.progress_pct ?? progress);
      setPlaceholder(res.placeholder_hint ?? "");
      // Marca o último item (resposta nova do assistant) pra typewriter
      setTypewriterIdx(res.conversation.length - 1);
      if (res.complete) {
        toast({
          title: "Caso pronto!",
          description: "PreceptorMED estruturou seu caso clínico.",
        });
        setTimeout(() => navigate(`/casos-clinicos/${caseId}`), 1200);
      }
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
      setConversation((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.content === txt)));
      setInput(txt);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleFinalize = async () => {
    if (sending || completing) return;
    if (!confirm("Finalizar agora? PreceptorMED vai estruturar o caso com a informação que tem.")) return;
    setCompleting(true);
    try {
      const res = await finalizeCaseChat(caseId);
      setConversation(res.conversation);
      setTypewriterIdx(res.conversation.length - 1);
      if (res.complete) {
        toast({ title: "Caso pronto!" });
        setTimeout(() => navigate(`/casos-clinicos/${caseId}`), 1000);
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
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/casos-clinicos")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] mb-4 self-start group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Casos clínicos
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_-12px_rgba(0,109,91,0.18),0_1px_2px_rgba(25,28,29,0.04)] relative"
        >
          {/* Background grid sutil */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #005344 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Top accent gradient com animação shimmer */}
          <div className="relative h-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />
          </div>

          {/* Header */}
          <div className="relative px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center gap-3 bg-white/80 backdrop-blur">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] flex items-center justify-center shrink-0 shadow-[0_4px_12px_-2px_rgba(0,109,91,0.4)]"
            >
              <Stethoscope className="w-5 h-5 text-[#C9A84C]" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26] flex items-center gap-1.5">
                PreceptorMED
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </p>
              <h1 className="font-['Manrope'] font-bold text-base text-[#191C1D]">
                Construindo caso clínico
              </h1>
            </div>
            <AnimatePresence>
              {conversation.length > 4 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFinalize}
                  disabled={completing || sending}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold border border-[#005344]/30 text-[#005344] hover:bg-[#005344]/5 disabled:opacity-50 transition-colors"
                  title="Estrutura o caso com a informação que já temos"
                >
                  {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                  Finalizar
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar com shimmer */}
          <div className="relative h-1 bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#005344] via-[#006D5B] to-[#C9A84C] relative"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 min-h-[300px]">
            <AnimatePresence initial={false}>
              {conversation.map((m, i) => (
                <Message
                  key={i}
                  msg={m}
                  isFresh={i === typewriterIdx}
                  onTypewriterDone={() => {
                    if (i === typewriterIdx) setTypewriterIdx(null);
                  }}
                />
              ))}
              {sending && <ThinkingMessage key="thinking" />}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="relative border-t border-slate-100 p-4 shrink-0 bg-gradient-to-b from-white to-slate-50/50">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <motion.input
                ref={inputRef}
                whileFocus={{ scale: 1.005 }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder || (isAssistantTurn ? "Sua resposta…" : "Aguarde…")}
                disabled={sending || completing}
                autoFocus
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-all disabled:opacity-50"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                disabled={sending || completing || !input.trim()}
                className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_18px_-4px_rgba(0,109,91,0.45)] relative overflow-hidden"
              >
                {/* Hover shine */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <AnimatePresence mode="wait">
                  {sending ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, rotate: 45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -45 }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
            <AnimatePresence>
              {placeholder && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-[11px] text-[#94a3b8] mt-2 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#C9A84C]" />
                  Dica: {placeholder}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Avatar
function Avatar({ role }: { role: "assistant" | "user" }) {
  if (role === "assistant") {
    return (
      <motion.div
        layout
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] flex items-center justify-center shadow-[0_3px_10px_-2px_rgba(0,109,91,0.4)]"
      >
        <Stethoscope className="w-4 h-4 text-[#C9A84C]" />
      </motion.div>
    );
  }
  return (
    <motion.div
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center"
    >
      <UserIcon className="w-4 h-4 text-slate-600" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mensagem com slide-in animado
function Message({
  msg, isFresh, onTypewriterDone,
}: {
  msg: ConversationMsg;
  isFresh?: boolean;
  onTypewriterDone?: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, x: isUser ? 16 : -16 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <Avatar role={msg.role} />
      <motion.div
        whileHover={{ scale: 1.005 }}
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-[#005344] to-[#003D32] text-white rounded-br-md"
            : "bg-white border border-slate-200 text-[#191C1D] rounded-bl-md"
        }`}
      >
        {isFresh && !isUser ? (
          <Typewriter text={msg.content} onDone={onTypewriterDone} />
        ) : (
          renderMarkdown(msg.content)
        )}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Indicador "pensando" com onda
function ThinkingMessage() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex items-end gap-2.5"
    >
      <Avatar role="assistant" />
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-[#005344]"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Typewriter effect — simula digitação da IA
function Typewriter({
  text, onDone, speed = 16,
}: {
  text: string;
  onDone?: () => void;
  speed?: number;
}) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const inc = Math.max(1, Math.floor(text.length / 200)); // mais rápido em texto longo
    const timer = window.setInterval(() => {
      i = Math.min(text.length, i + inc + 1);
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(timer);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <>
      {renderMarkdown(shown)}
      {!done && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-[#005344] ml-0.5 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </>
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
