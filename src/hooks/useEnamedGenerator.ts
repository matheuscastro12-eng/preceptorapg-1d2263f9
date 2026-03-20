import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEnamedGenerator = () => {
  const { toast } = useToast();
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const generate = useCallback(async (opts: {
    quantidade: number;
    area?: string;
    conteudo_extra?: string;
  }) => {
    setGenerating(true);
    setResultado('');
    setHasStartedReceiving(false);
    setIsComplete(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-enamed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            quantidade: opts.quantidade,
            area: opts.area || null,
            conteudo_extra: opts.conteudo_extra || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar questões ENAMED');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let started = false;
      let buffer = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            // Keep last incomplete line in buffer
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === '[DONE]') continue;
                if (!jsonStr) continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    if (!started) { started = true; setHasStartedReceiving(true); }
                    fullText += content;
                    setResultado(fullText);
                  }
                } catch { /* ignore malformed chunk */ }
              }
            }
          }
        } catch (streamError) {
          console.warn('Stream interrupted:', streamError);
        }
      }

      // Always mark as complete when stream ends, even if interrupted
      if (fullText) {
        setResultado(fullText);
      }
      setIsComplete(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível gerar.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setResultado('');
    setGenerating(false);
    setHasStartedReceiving(false);
    setIsComplete(false);
  }, []);

  return { resultado, generating, hasStartedReceiving, isComplete, generate, reset };
};
