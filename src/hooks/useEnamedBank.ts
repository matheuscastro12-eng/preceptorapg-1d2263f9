import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type EnamedArea = 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva';

export interface EnamedQuestion {
  id: string;
  numero: number;
  area: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  gabarito: string;
  explicacao: string | null;
  ano: number;
  anulada: boolean;
}

export const AREA_LABELS: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
};

export const useEnamedBank = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<EnamedQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async (opts?: { area?: EnamedArea; limit?: number; shuffle?: boolean }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('enamed_questions')
        .select('*')
        .eq('anulada', false);

      if (opts?.area) {
        query = query.eq('area', opts.area);
      }

      const { data, error } = await query.order('numero', { ascending: true });

      if (error) throw error;

      let result = (data || []) as EnamedQuestion[];

      if (opts?.shuffle) {
        result = result.sort(() => Math.random() - 0.5);
      }

      if (opts?.limit && opts.limit < result.length) {
        result = result.slice(0, opts.limit);
      }

      setQuestions(result);
      return result;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as questões.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveAttempt = useCallback(async (data: {
    modo: string;
    area_filter?: string;
    total_questions: number;
    correct_answers: number;
    percentage: number;
    answers: Record<string, string>;
    source: 'banco' | 'ia';
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('enamed_attempts').insert({
        user_id: session.user.id,
        modo: data.modo,
        area_filter: data.area_filter || null,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        percentage: data.percentage,
        answers: data.answers,
        source: data.source,
      });
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  }, []);

  return { questions, loading, fetchQuestions, saveAttempt };
};
