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

// ────────────────────────────────────────────────────────────
// Drogas + Protocolos + CID-10 — busca lista
// ────────────────────────────────────────────────────────────
export interface DrugListItem {
  id: string;
  slug: string;
  nome_principio: string;
  classe_terapeutica: string | null;
  nome_comercial: string[] | null;
}

export function useWhitebookDrugs(query: string) {
  const [items, setItems] = useState<DrugListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const trimmed = query.trim();
      let q = supabase
        .from("wb_drugs")
        .select("id, slug, nome_principio, classe_terapeutica, nome_comercial")
        .eq("published", true);
      if (trimmed) {
        const ilike = `%${trimmed}%`;
        q = q.or(`nome_principio.ilike.${ilike},classe_terapeutica.ilike.${ilike}`);
      }
      const { data } = await q.order("nome_principio").limit(100);
      if (alive) {
        setItems((data ?? []) as DrugListItem[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return { items, loading };
}

export interface ProtocolListItem {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  resumo: string | null;
}

export function useWhitebookProtocols(query: string) {
  const [items, setItems] = useState<ProtocolListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const trimmed = query.trim();
      let q = supabase
        .from("wb_protocols")
        .select("id, slug, titulo, categoria, resumo")
        .eq("published", true);
      if (trimmed) {
        const ilike = `%${trimmed}%`;
        q = q.or(`titulo.ilike.${ilike},categoria.ilike.${ilike},resumo.ilike.${ilike}`);
      }
      const { data } = await q.order("titulo").limit(100);
      if (alive) {
        setItems((data ?? []) as ProtocolListItem[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return { items, loading };
}

export interface PrescriptionListItem {
  id: string;
  slug: string;
  titulo: string;
  doenca: string;
  contexto: string | null;
  resumo: string | null;
}

export function useWhitebookPrescriptions(query: string) {
  const [items, setItems] = useState<PrescriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const trimmed = query.trim();
      let q = supabase
        .from("wb_prescriptions")
        .select("id, slug, titulo, doenca, contexto, resumo")
        .eq("published", true);
      if (trimmed) {
        const ilike = `%${trimmed}%`;
        q = q.or(
          `titulo.ilike.${ilike},doenca.ilike.${ilike},condicao_clinica.ilike.${ilike},resumo.ilike.${ilike}`,
        );
      }
      const { data } = await q.order("doenca").limit(100);
      if (alive) {
        setItems((data ?? []) as PrescriptionListItem[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return { items, loading };
}

export interface IcdItem {
  code: string;
  descricao_pt: string;
  capitulo: string | null;
  capitulo_titulo: string | null;
}

export function useWhitebookIcd(query: string) {
  const [items, setItems] = useState<IcdItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        // Sem query: lista vazia (CID-10 tem ~14k itens, faz pouco sentido listar)
        if (alive) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const ilike = `%${trimmed}%`;
      const upper = trimmed.toUpperCase();
      const { data } = await supabase
        .from("wb_icd10")
        .select("code, descricao_pt, capitulo, capitulo_titulo")
        .or(`code.ilike.${upper}%,descricao_pt.ilike.${ilike}`)
        .order("code")
        .limit(50);
      if (alive) {
        setItems((data ?? []) as IcdItem[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  return { items, loading };
}
