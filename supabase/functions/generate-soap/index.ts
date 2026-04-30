// Edge Function: generate-soap
// Recebe consulta_id (transcript ja salvo). Le transcript, manda pra Gemini
// 2.5 Flash com responseSchema rigido pra estruturar em SOAP (S/O/A).
// Phase 4 estendera com P (Plano) + DDx + exames + prescricao.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOAP_SYSTEM_PROMPT = `Voce eh um Preceptor Academico de Medicina especializado em
documentacao clinica. Recebe transcricao de consulta medica em PT-BR e
produz prontuario estruturado em formato SOAP (Subjetivo, Objetivo,
Avaliacao).

REGRAS CRITICAS:
1. Use APENAS informacao presente na transcricao. NAO invente dados,
   sinais vitais, exames ou diagnosticos que o medico nao mencionou.
2. Linguagem medica formal em PT-BR. Use terminologia tecnica:
   "dispneia" (nao "falta de ar"), "cefaleia" (nao "dor de cabeca"),
   "ortopneia", "hemoptise", "odinofagia", etc.
3. Mantenha objetividade. Use 3a pessoa ("paciente refere..." nao
   "voce disse que...").
4. PII: substitua nome completo, CPF, RG, telefone do paciente por
   [REDACTED] se aparecerem na transcricao.
5. Se um campo nao foi abordado, devolva string vazia "" ou array vazio.
   NAO escreva "nao informado" — deixe vazio pro medico preencher.
6. Em "hipoteses_diagnosticas": sugira CIDs apenas quando o medico
   articulou claramente um diagnostico ou suspeita. NAO invente.

ESTRUTURA SOAP:

S (Subjetivo) — o que o paciente reporta:
- queixa_principal: 1 frase com motivo da consulta.
- hda (historia da doenca atual): narrativa cronologica.
- antecedentes_pessoais: comorbidades, cirurgias, alergias declaradas.
- antecedentes_familiares: doencas hereditarias mencionadas.
- medicacoes_em_uso: lista do que paciente declara tomar.
- alergias: medicamentosas e outras.
- habitos: tabagismo, etilismo, atividade fisica, alimentacao.

O (Objetivo) — exame fisico realizado pelo medico:
- sinais_vitais: PA, FC, FR, T, SatO2, peso, altura quando ditos.
- exame_fisico_geral: estado geral, hidratacao, corado, etc.
- exame_fisico_segmentar: por segmento conforme abordado (cardio,
  pulmonar, abdominal, neuro, etc).

A (Avaliacao) — sintese clinica:
- hipoteses_diagnosticas: lista de diagnosticos provaveis ou
  diferenciais mencionados/sugeridos pelo medico, com cid quando claro.
- comentario: paragrafo curto de raciocinio clinico.

Devolva APENAS JSON valido conforme schema. Sem markdown.`;

const SOAP_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    S: {
      type: "OBJECT",
      properties: {
        queixa_principal: { type: "STRING" },
        hda: { type: "STRING" },
        antecedentes_pessoais: { type: "STRING" },
        antecedentes_familiares: { type: "STRING" },
        medicacoes_em_uso: { type: "ARRAY", items: { type: "STRING" } },
        alergias: { type: "ARRAY", items: { type: "STRING" } },
        habitos: { type: "STRING" },
      },
    },
    O: {
      type: "OBJECT",
      properties: {
        sinais_vitais: {
          type: "OBJECT",
          properties: {
            pa: { type: "STRING" },
            fc: { type: "STRING" },
            fr: { type: "STRING" },
            temperatura: { type: "STRING" },
            sato2: { type: "STRING" },
            peso: { type: "STRING" },
            altura: { type: "STRING" },
          },
        },
        exame_fisico_geral: { type: "STRING" },
        exame_fisico_segmentar: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              segmento: { type: "STRING" },
              achados: { type: "STRING" },
            },
          },
        },
      },
    },
    A: {
      type: "OBJECT",
      properties: {
        hipoteses_diagnosticas: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              cid: { type: "STRING" },
              descricao: { type: "STRING" },
              probabilidade: { type: "STRING" },
            },
          },
        },
        comentario: { type: "STRING" },
      },
    },
  },
  required: ["S", "O", "A"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Autenticacao necessaria" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claimsData } = await userClient.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Token invalido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let body: { consulta_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body.consulta_id) {
    return new Response(JSON.stringify({ error: "consulta_id obrigatorio" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: consulta } = await adminClient
    .from("consultas")
    .select("*")
    .eq("id", body.consulta_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!consulta) {
    return new Response(
      JSON.stringify({ error: "Consulta nao encontrada" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  if (!consulta.transcript || consulta.transcript.length < 20) {
    return new Response(
      JSON.stringify({ error: "Transcript vazio ou muito curto" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    await adminClient
      .from("consultas")
      .update({ status: "erro", status_message: "GOOGLE_AI_API_KEY nao configurada" })
      .eq("id", body.consulta_id);
    return new Response(
      JSON.stringify({ error: "GOOGLE_AI_API_KEY nao configurada" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SOAP_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Transcricao da consulta:\n\n${consulta.transcript}\n\nEstruture em SOAP conforme schema.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
          responseSchema: SOAP_RESPONSE_SCHEMA,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini ${response.status}: ${errText.slice(0, 300)}`);
    }
    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini retornou resposta vazia");

    let soap;
    try {
      soap = JSON.parse(text);
    } catch (e) {
      throw new Error(`Falha parse SOAP JSON: ${(e as Error).message}`);
    }

    await adminClient
      .from("consultas")
      .update({
        soap_jsonb: soap,
        status: "pendente_revisao",
      })
      .eq("id", body.consulta_id);

    // Log da chamada
    void adminClient.from("generation_logs").insert({
      user_id: userId,
      function_name: "generate-soap",
    });

    return new Response(
      JSON.stringify({ success: true, consulta_id: body.consulta_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = (err as Error).message ?? "Erro desconhecido";
    console.error("generate-soap fail:", msg);
    await adminClient
      .from("consultas")
      .update({ status: "erro", status_message: msg.slice(0, 500) })
      .eq("id", body.consulta_id);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
