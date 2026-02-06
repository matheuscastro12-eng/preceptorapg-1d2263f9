import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DifficultyLevel = 'basico' | 'residencia';

export interface ExamConfig {
  quantidade: number;
  nivel: DifficultyLevel;
  simulationMode: boolean;
}

export const useExamGenerator = () => {
  const { toast } = useToast();
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const generate = useCallback(async (conteudo: string, config: ExamConfig) => {
    if (!conteudo.trim()) {
      toast({
        title: 'Conteúdo obrigatório',
        description: 'Selecione pelo menos um fechamento ou seminário da biblioteca.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setResultado('');
    setHasStartedReceiving(false);
    setIsComplete(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exam`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conteudo,
            quantidade: config.quantidade,
            nivel: config.nivel,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar a prova');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  if (!hasStartedReceiving) {
                    setHasStartedReceiving(true);
                  }
                  fullText += content;
                  setResultado(fullText);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      setIsComplete(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível gerar a prova.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [toast, hasStartedReceiving]);

  const reset = useCallback(() => {
    setResultado('');
    setGenerating(false);
    setHasStartedReceiving(false);
    setIsComplete(false);
  }, []);

  return {
    resultado,
    generating,
    hasStartedReceiving,
    isComplete,
    generate,
    reset,
  };
};
