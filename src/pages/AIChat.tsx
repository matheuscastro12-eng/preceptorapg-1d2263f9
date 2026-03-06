import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Stethoscope, Sparkles, Trash2, Bot, User, Copy, FileDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/utils/pdfExport';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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
    // Find the rendered message element
    const el = document.getElementById(`msg-${msg.id}`);
    if (el) {
      container.innerHTML = el.innerHTML;
    } else {
      container.innerText = msg.content;
    }
    // Find the user question that preceded this answer
    const idx = messages.findIndex(m => m.id === msg.id);
    const question = idx > 0 ? messages[idx - 1]?.content : 'PreceptorIA';
    exportToPDF({ tema: question.slice(0, 100), contentElement: container });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setInput('');

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

      // Create assistant message with loading state
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

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
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Chat error:', e);
      setMessages(prev => [
        ...prev.filter(m => m.id !== assistantId),
        { id: assistantId, role: 'assistant', content: `⚠️ ${e.message || 'Erro ao processar sua pergunta. Tente novamente.'}` },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
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

  if (authLoading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const isEmpty = messages.length === 0;

  return (
    <PageTransition className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/20 backdrop-blur-xl bg-background/90 z-10">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">PreceptorIA</span>
              <span className="text-[10px] text-muted-foreground block leading-none">Chat Acadêmico</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-destructive gap-1"
            disabled={isEmpty && !isStreaming}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center px-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Olá! Sou o <span className="text-primary">PreceptorIA</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Seu assistente acadêmico de medicina com a mesma profundidade dos fechamentos de APG. 
                Pergunte qualquer coisa — de bioquímica molecular a raciocínio clínico.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => streamChat(s)}
                    className="text-left p-3 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all text-xs text-muted-foreground hover:text-foreground leading-relaxed"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="container max-w-3xl px-4 py-4 space-y-4">
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
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] sm:max-w-[75%] group/msg ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                      : 'bg-secondary/30 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3'
                  }`}>
                    {m.role === 'assistant' ? (
                      <>
                        {m.content ? (
                          <div id={`msg-${m.id}`} className={`prose prose-sm dark:prose-invert max-w-none text-sm ${isStreaming && m.id === messages[messages.length - 1]?.id ? 'typing-cursor' : ''}`}>
                            <MarkdownRenderer content={m.content} isTyping={isStreaming && m.id === messages[messages.length - 1]?.id} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 py-1 px-1">
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                          </div>
                        )}
                        {m.content && !(isStreaming && m.id === messages[messages.length - 1]?.id) && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                              onClick={() => handleCopy(m)}
                            >
                              {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === m.id ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                              onClick={() => handlePDF(m)}
                            >
                              <FileDown className="h-3 w-3" />
                              PDF
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/20 bg-background/90 backdrop-blur-xl p-3 sm:p-4">
        <div className="container max-w-3xl flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Pergunte sobre qualquer tema médico..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          PreceptorIA é uma ferramenta educacional. Sempre valide com fontes primárias.
        </p>
      </div>
    </PageTransition>
  );
};

export default AIChat;
