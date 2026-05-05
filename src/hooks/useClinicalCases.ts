import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConversationMsg {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
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

export interface BuildCaseResponse {
  success: boolean;
  case_id: string;
  conversation: ConversationMsg[];
  next_question?: string;
  field_hint?: string;
  placeholder_hint?: string;
  progress_pct?: number;
  complete: boolean;
  case_summary?: Record<string, unknown>;
  error?: string;
}

export async function startCaseChat(): Promise<BuildCaseResponse> {
  const { data, error } = await supabase.functions.invoke("build-clinical-case", { body: { action: "start" } });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? "Falha ao iniciar");
  return data;
}

export async function replyCaseChat(
  caseId: string,
  userMessage: string,
): Promise<BuildCaseResponse> {
  const { data, error } = await supabase.functions.invoke("build-clinical-case", {
    body: { action: "reply", case_id: caseId, user_message: userMessage },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? "Falha");
  return data;
}

export async function finalizeCaseChat(caseId: string): Promise<BuildCaseResponse> {
  const { data, error } = await supabase.functions.invoke("build-clinical-case", {
    body: { action: "finalize", case_id: caseId },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? "Falha");
  return data;
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
