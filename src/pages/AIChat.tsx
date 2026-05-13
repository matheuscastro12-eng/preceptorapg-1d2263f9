import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2, User, Copy, FileDown, Check, BookOpen } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '@/components/PageSkeleton';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import UpgradePaywall from '@/components/UpgradePaywall';
import { useDemoLimit } from '@/hooks/useDemoLimit';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Explique a fisiopatologia da insuficiência cardíaca congestiva',
  'Quais são os mecanismos de ação dos beta-bloqueadores?',
  'Descreva a cascata de coagulação e suas implicações clínicas',
  'Como funciona o eixo hipotálamo-hipófise-adrenal?',
  'Diagnóstico diferencial de dor torácica aguda',
  'Explique a regulação do equilíbrio ácido-base renal',
];

const AIChat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscriber, remainingPrompts, hasReachedLimit, dailyLimit, usedToday, incrementUsage, loading: demoLoading } = useDemoLimit();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stripMarkdown = (md: string) =>
    md.replace(/#{1,6}\s?/g, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').replace(/---/g, '').replace(/- /g, '• ').trim();

  const handleCopy = async (msg: ChatMessage) => {
    await navigator.clipboard.writeText(stripMarkdown(msg.content));
    setCopiedId(msg.id);
    toast({ title: 'Copiado!', description: 'Resposta copiada para a área de transferência.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePDF = (msg: ChatMessage) => {
    const container = document.createElement('div');
    container.className = 'markdown-content';
    const el = document.getElementById(`msg-${msg.id}`);
    if (el) {
      container.innerHTML = el.innerHTML;
    } else {
      container.innerText = msg.content;
    }
    const idx = messages.findIndex(m => m.id === msg.id);
    const question = idx > 0 ? messages[idx - 1]?.content : 'PreceptorMED';
    exportToPDF({ tema: question.slice(0, 100), contentElement: container });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    if (!isSubscriber && hasReachedLimit) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setIsStreaming(true);
    setInput('');

    if (!isSubscriber) {
      incrementUsage();
    }

    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: allMessages }),
          signal: controller.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch { /* partial json */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const message = e instanceof Error ? e.message : 'Erro ao processar sua pergunta. Tente novamente.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== assistantId),
        { id: assistantId, role: 'assistant', content: `⚠️ ${message}` },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    if (!isSubscriber && hasReachedLimit) return;
    streamChat(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setIsStreaming(false);
  };

  if (authLoading || demoLoading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const isEmpty = messages.length === 0;

  return (
    <DashboardLayout mainClassName="!p-0 flex-1 flex flex-col overflow-hidden" hideFooter>
      {/* Toolbar — pmed editorial */}
      <div className="shrink-0 bg-white border-b border-slate-100">
        {/* Ribbon top — verde + ouro */}
        <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="PreceptorMED" className="h-8 w-8" />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 leading-none">
                <span className="w-5 h-px bg-[#C9A84C]" />
                Preceptor virtual
              </p>
              <span className="block font-['Manrope'] font-bold text-[15px] tracking-[-0.01em] text-[#191C1D] mt-1 leading-none">
                PreceptorMED <em className="not-italic font-medium text-[#8a6f26]">Chat</em>
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-[#4a5568] hover:text-red-600 gap-1.5 text-xs font-semibold"
            disabled={isEmpty && !isStreaming}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar conversa</span>
          </Button>
        </div>
      </div>

      {/* Demo banner */}
      {!isSubscriber && !hasReachedLimit && (
        <UpgradePaywall variant="banner" remainingPrompts={remainingPrompts} dailyLimit={dailyLimit} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#fafbfa]">
        {hasReachedLimit && !isSubscriber ? (
          <div className="h-full flex items-center justify-center px-4">
            <UpgradePaywall variant="chat-limit" remainingPrompts={remainingPrompts} dailyLimit={dailyLimit} />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-xl w-full"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
                <span className="w-6 h-px bg-[#C9A84C]" />
                Nova conversa
                <span className="w-6 h-px bg-[#C9A84C]" />
              </p>
              <h1 className="font-['Manrope'] font-bold text-[26px] sm:text-[32px] tracking-[-0.025em] leading-[1.1] text-[#191C1D] mb-3">
                Pergunte como{' '}
                <em className="not-italic font-medium text-[#8a6f26]">
                  conversaria com seu preceptor
                </em>
                .
              </h1>
              <p className="text-sm text-[#4a5568] leading-relaxed max-w-[48ch] mx-auto mb-8">
                Raciocínio clínico, mecanismos moleculares, condutas baseadas em diretrizes.
                Cada resposta substantiva vem com referências do PubMed.
              </p>

              {!isSubscriber && (
                <div className="mb-7 px-4 py-3 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-left max-w-md mx-auto">
                  <p className="text-[11.5px] text-[#4a5568] leading-relaxed">
                    <span className="font-bold text-[#8a6f26]">Modo demonstração</span> — você tem{' '}
                    <span className="font-bold text-[#191C1D]">{remainingPrompts}</span> perguntas grátis hoje.{' '}
                    <button
                      onClick={() => navigate('/pricing')}
                      className="font-bold text-[#005344] hover:underline"
                    >
                      Assine pra ilimitado →
                    </button>
                  </p>
                </div>
              )}

              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#94a3b8] mb-3">
                Sugestões para começar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => streamChat(s)}
                    className="group text-left p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005344] hover:shadow-[0_4px_12px_-4px_rgba(0,109,91,0.18)] transition-all text-[12.5px] text-[#3E4945] leading-relaxed"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] group-hover:text-[#005344] mb-1.5 transition-colors">
                      <span className="w-3 h-px bg-current" />
                      Tema {i + 1}
                    </span>
                    <span className="block">{s}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="shrink-0 h-9 w-9 rounded-xl overflow-hidden mt-1 ring-1 ring-slate-200">
                      <img src={logoIcon} alt="PreceptorMED" className="h-9 w-9" />
                    </div>
                  )}
                  <div
                    className={`group/msg pmed-bubble ${m.role === 'user' ? 'pmed-bubble--user' : 'pmed-bubble--ai'}`}
                    style={{ maxWidth: m.role === 'user' ? '75%' : '85%' }}
                  >
                    {m.role === 'assistant' ? (
                      <>
                        {!m.content && isStreaming && m.id === messages[messages.length - 1]?.id && (
                          <div className="flex items-center gap-2 py-2 px-1">
                            <span className="h-2 w-2 rounded-full bg-[#005344] animate-[wave_1.2s_ease-in-out_infinite]" />
                            <span className="h-2 w-2 rounded-full bg-[#005344] animate-[wave_1.2s_ease-in-out_0.2s_infinite]" />
                            <span className="h-2 w-2 rounded-full bg-[#005344] animate-[wave_1.2s_ease-in-out_0.4s_infinite]" />
                            <span className="text-[11px] font-medium text-[#94a3b8] ml-1 uppercase tracking-wider">Elaborando resposta</span>
                          </div>
                        )}
                        {m.content && (
                          <div id={`msg-${m.id}`} className="prose prose-sm max-w-none text-[13.5px] leading-relaxed text-[#3E4945] prose-headings:font-['Manrope'] prose-headings:text-[#191C1D] prose-headings:tracking-[-0.01em] prose-strong:text-[#191C1D] prose-a:text-[#005344] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">
                            <MarkdownRenderer content={m.content} isTyping={isStreaming && m.id === messages[messages.length - 1]?.id} />
                          </div>
                        )}
                        {m.content && !(isStreaming && m.id === messages[messages.length - 1]?.id) && (
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] gap-1" onClick={() => handleCopy(m)}>
                              {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === m.id ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] gap-1" onClick={() => handlePDF(m)}>
                              <FileDown className="h-3 w-3" /> PDF
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-[#005344] to-[#006D5B] flex items-center justify-center mt-1 shadow-[0_2px_6px_-2px_rgba(0,83,68,0.4)]">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input — editorial style match com InputPanel */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-5">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="flex gap-2.5 items-end">
            <div className={`flex-1 relative rounded-xl border-2 transition-all ${
              input.trim()
                ? 'border-[#005344] bg-white shadow-[0_0_0_4px_rgba(0,109,91,0.06)]'
                : 'border-slate-200 bg-slate-50/60'
            }`}>
              <Textarea
                ref={textareaRef}
                placeholder={hasReachedLimit && !isSubscriber ? 'Limite diário atingido — assine pra continuar' : 'Pergunte sobre qualquer tema médico…'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[48px] max-h-[140px] resize-none text-[14px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-['DM_Sans'] text-[#191C1D] placeholder:text-[#94a3b8]"
                rows={1}
                disabled={isStreaming || (hasReachedLimit && !isSubscriber)}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || (hasReachedLimit && !isSubscriber)}
              className="shrink-0 h-12 w-12 rounded-xl flex items-center justify-center text-white transition-all disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: input.trim() && !isStreaming && !(hasReachedLimit && !isSubscriber)
                  ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)'
                  : '#94a3b8',
                boxShadow: input.trim() && !isStreaming && !(hasReachedLimit && !isSubscriber)
                  ? '0 6px 16px -6px rgba(0,109,91,0.45)'
                  : 'none',
              }}
            >
              {input.trim() && !isStreaming && !(hasReachedLimit && !isSubscriber) && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              )}
              <Send className="h-4 w-4 relative" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#005344]">
              <BookOpen className="h-3 w-3" />
              <span>Respostas com referências PubMed</span>
            </div>
            <p className="text-[10px] text-[#94a3b8]">Ferramenta educacional · CFM 2.338/2023</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat;
