import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Send, Bot, User, MessageCircle, X, Sparkles, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ContextChatProps {
  context: string;
  contextLabel?: string;
}

const CONTEXT_SUGGESTIONS = [
  'Resuma os pontos principais',
  'O que eu preciso memorizar?',
  'Explique o primeiro tópico com mais detalhes',
  'Quais são as aplicações clínicas?',
];

const ContextChat = ({ context, contextLabel = 'conteúdo gerado' }: ContextChatProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset chat when context changes significantly
  useEffect(() => {
    setMessages([]);
  }, [context]);

  const stripMarkdown = (md: string) =>
    md.replace(/#{1,6}\s?/g, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').replace(/---/g, '').replace(/- /g, '• ').trim();

  const handleCopy = useCallback(async (msg: ChatMessage) => {
    await navigator.clipboard.writeText(stripMarkdown(msg.content));
    setCopiedId(msg.id);
    toast({ title: 'Copiado!' });
    setTimeout(() => setCopiedId(null), 2000);
  }, [toast]);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setIsStreaming(true);
    setInput('');

    const systemContext = `Você é o PreceptorMED, um preceptor médico acadêmico. O estudante está revisando o seguinte ${contextLabel}. Responda dúvidas APENAS sobre este conteúdo, de forma concisa e didática. Se a pergunta não tiver relação com o conteúdo, redirecione educadamente.\n\n--- CONTEÚDO DE REFERÊNCIA ---\n${context}\n--- FIM DO CONTEÚDO ---`;

    const allMessages = [
      { role: 'system' as const, content: systemContext },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

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
      const message = e instanceof Error ? e.message : 'Erro ao processar sua pergunta.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== assistantId),
        { id: assistantId, role: 'assistant', content: `⚠️ ${message}` },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [context, contextLabel, messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    streamChat(input.trim());
  }, [input, isStreaming, streamChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center lg:relative lg:right-auto lg:bottom-auto lg:h-auto lg:w-auto lg:rounded-none lg:bg-transparent lg:shadow-none lg:text-foreground lg:hover:scale-100"
        title="Tirar dúvidas"
      >
        {/* Mobile: floating button */}
        <MessageCircle className="h-5 w-5 lg:hidden" />
        {/* Desktop: sidebar trigger */}
        <div className="hidden lg:flex flex-col items-center gap-1 px-2 py-4 rounded-l-xl border border-r-0 border-border/30 bg-card/80 backdrop-blur-sm hover:bg-primary/10 transition-colors cursor-pointer">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
            Dúvidas
          </span>
        </div>
      </motion.button>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 z-50 w-[340px] sm:w-[380px] border-l border-border/30 bg-background/95 backdrop-blur-xl flex flex-col shadow-2xl lg:relative lg:w-[340px] lg:shadow-none lg:z-auto"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold">Tire Dúvidas</span>
            <p className="text-[10px] text-muted-foreground leading-none">sobre o {contextLabel}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-3">
          {isEmpty ? (
            <div className="text-center py-8 px-2">
              <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground/80 mb-1">
                Dúvidas sobre o conteúdo?
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Pergunte e o PreceptorMED responde com base no {contextLabel}.
              </p>
              <div className="space-y-1.5">
                {CONTEXT_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => streamChat(s)}
                    className="w-full text-left p-2.5 rounded-lg border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all text-xs text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="shrink-0 h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] group/msg ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-xl rounded-br-sm px-3 py-2'
                      : 'bg-secondary/30 border border-border/30 rounded-xl rounded-bl-sm px-3 py-2'
                  }`}>
                    {m.role === 'assistant' ? (
                      <>
                        {!m.content && isStreaming && m.id === messages[messages.length - 1]?.id && (
                          <div className="flex items-center gap-2 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[wave_1.2s_ease-in-out_infinite]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[wave_1.2s_ease-in-out_0.2s_infinite]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[wave_1.2s_ease-in-out_0.4s_infinite]" />
                          </div>
                        )}
                        {m.content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                            <MarkdownRenderer content={m.content} isTyping={isStreaming && m.id === messages[messages.length - 1]?.id} />
                          </div>
                        )}
                        {m.content && !(isStreaming && m.id === messages[messages.length - 1]?.id) && (
                          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border/10 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => handleCopy(m)}>
                              {copiedId === m.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="shrink-0 h-6 w-6 rounded-md bg-muted flex items-center justify-center mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border/20 p-3">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Pergunte sobre o conteúdo..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[36px] max-h-[80px] resize-none text-xs"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0 h-9 w-9 rounded-lg"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContextChat;
