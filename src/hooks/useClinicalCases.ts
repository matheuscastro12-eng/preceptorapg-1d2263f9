import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuestionOption {
  label: string;
  value?: string;
}

export interface ConversationMsg {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
  options?: QuestionOption[];
  multiple?: boolean;
  allow_free_text?: boolean;
}

export interface ClinicalCase {
  id: string;
  user_id: string;
  paciente_nome: string | null;
  paciente_idade: number | null;
  paciente_idade_unidade: string;
  paciente_sexo: "M" | "F" | "I" | null;
  doenca_principal: string | null;
  caso_estruturado: Record<string, unknown> | null;
  conversation: ConversationMsg[];
  status: "building" | "complete" | "archived";
  titulo: string | null;
  resumo_curto: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseQuestion {
  id: string;
  case_id: string;
  ordem: number;
  enunciado: string;
  alternativas: Array<{ letra: string; texto: string; correta: boolean; justificativa: string }>;
  letra_correta: string;
  comentario_geral: string | null;
  area: string | null;
  dificuldade: "facil" | "media" | "dificil";
  created_at: string;
}

export function useClinicalCasesList() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("clinical_cases")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setCases((data ?? []) as ClinicalCase[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);
  return { cases, loading, error, reload };
}

export function useClinicalCase(id: string | undefined) {
  const [caseData, setCaseData] = useState<ClinicalCase | null>(null);
  const [questions, setQuestions] = useState<CaseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const [cRes, qRes] = await Promise.all([
      supabase.from("clinical_cases").select("*").eq("id", id).maybeSingle(),
      supabase.from("clinical_case_questions").select("*").eq("case_id", id).order("ordem", { ascending: true }),
    ]);
    if (cRes.error) setError(cRes.error.message);
    else setCaseData(cRes.data as ClinicalCase | null);
    if (!qRes.error) setQuestions((qRes.data ?? []) as CaseQuestion[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);
  return { caseData, questions, loading, error, reload };
}

export interface CaseBasics {
  paciente_nome: string;
  paciente_idade: number;
  paciente_idade_unidade?: "anos" | "meses" | "dias";
  paciente_sexo: "M" | "F" | "I";
  doenca_principal: string;
}

export interface BuildCompleteResponse {
  success: boolean;
  case_id: string;
  case_summary: Record<string, unknown>;
  error?: string;
}

/**
 * Modelo V4: form único. Professor escreve descrição livre + dados
 * básicos; IA gera o caso clínico estruturado completo de uma vez.
 *
 * Usa fetch direto (não supabase.functions.invoke) pra ter controle
 * total da resposta — a invoke() do supabase-js v2 mascara o body de
 * erro em "non-2xx status code" sem expor a mensagem real do edge.
 */
export async function buildCompleteCase(input: {
  basics: CaseBasics;
  descricao_livre: string;
  case_id?: string;
}): Promise<BuildCompleteResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sessão expirada — faça login novamente.");
  }

  const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const url = `${SUPA_URL}/functions/v1/build-clinical-case`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": ANON_KEY,
      },
      body: JSON.stringify({
        action: "build_complete",
        basics: input.basics,
        descricao_livre: input.descricao_livre,
        case_id: input.case_id,
      }),
    });
  } catch (e) {
    throw new Error(`Falha de rede: ${(e as Error).message}`);
  }

  // Tenta sempre ler o body como JSON — edge function retorna
  // { success, error?, ... } mesmo em status >= 400
  let body: { success?: boolean; error?: string; case_id?: string; case_summary?: Record<string, unknown> } = {};
  try {
    body = await response.json();
  } catch {
    // Body não é JSON — provavelmente erro do gateway/Supabase
  }

  if (!response.ok || body.success === false) {
    const msg = body.error
      ? String(body.error)
      : `HTTP ${response.status} ${response.statusText || "sem detalhes"}`;
    throw new Error(msg);
  }

  if (!body.case_id) {
    throw new Error("Resposta sem case_id");
  }

  return {
    success: true,
    case_id: body.case_id,
    case_summary: body.case_summary ?? {},
  };
}

export async function generateCaseQuestions(caseId: string, n: number): Promise<{ count: number }> {
  const { data, error } = await supabase.functions.invoke("generate-case-questions", {
    body: { case_id: caseId, n },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? "Falha");
  return data;
}

export async function deleteClinicalCase(id: string) {
  const { error } = await supabase.from("clinical_cases").delete().eq("id", id);
  if (error) throw error;
}

export const SEXO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  I: "Intersexo / não-binário",
};
