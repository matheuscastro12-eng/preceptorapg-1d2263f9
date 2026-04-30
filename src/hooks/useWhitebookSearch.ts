import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalculatorListItem {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  quando_usar: string | null;
  fonte: string | null;
}

/**
 * Busca calculadoras publicadas. Se `query` vier vazio, retorna todas
 * ordenadas por categoria + nome. Se vier termo, usa websearch_to_tsquery
 * com peso A=nome / B=categoria / C=descricao / D=quando_usar.
 */
export function useWhitebookCalculators(query: string) {
  const [items, setItems] = useState<CalculatorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        const { data } = await supabase
          .from("wb_calculators")
          .select("id, slug, nome, categoria, descricao, quando_usar, fonte")
          .eq("published", true)
          .order("categoria", { ascending: true })
          .order("nome", { ascending: true });
        if (alive) {
          setItems((data ?? []) as CalculatorListItem[]);
          setLoading(false);
        }
        return;
      }
      // Full-text via RPC (mais flexivel que filtro PostgREST direto)
      // Aqui usamos PostgREST com `or` em ilike fallback + tsvector
      // websearch quando disponivel. Pra simplicidade do MVP, usamos
      // ilike em nome/descricao — eh suficiente pra 20-30 itens.
      const ilike = `%${trimmed}%`;
      const { data } = await supabase
        .from("wb_calculators")
        .select("id, slug, nome, categoria, descricao, quando_usar, fonte")
        .eq("published", true)
        .or(
          `nome.ilike.${ilike},categoria.ilike.${ilike},descricao.ilike.${ilike},quando_usar.ilike.${ilike}`,
        )
        .order("nome", { ascending: true })
        .limit(50);
      if (alive) {
        setItems((data ?? []) as CalculatorListItem[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return { items, loading };
}

export interface CalculatorFull extends CalculatorListItem {
  definicao: unknown;
  fonte_url: string | null;
}

export function useCalculator(slug: string | undefined) {
  const [calc, setCalc] = useState<CalculatorFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("wb_calculators")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (alive) {
        setCalc((data as CalculatorFull) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return { calc, loading };
}
