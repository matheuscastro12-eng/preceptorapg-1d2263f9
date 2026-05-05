// PreceptorMED — gerador de caso clínico estruturado a partir de
// descrição livre do professor.
//
// FLUXO V4 (atual): UMA TELA. Professor descreve o caso em texto livre +
// dados básicos (nome, idade, sexo, doença). IA gera o caso completo
// estruturado de uma vez. Zero perguntas iterativas.
//
// Action única:
//   - "build_complete": { basics, descricao_livre, case_id? }
//     → cria/atualiza caso estruturado, status=complete

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BasicsPayload {
  paciente_nome: string;
  paciente_idade: number;
  paciente_idade_unidade?: "anos" | "meses" | "dias";
  paciente_sexo: "M" | "F" | "I";
  doenca_principal: string;
}

interface ReqBody {
  action: "build_complete";
  case_id?: string;
  basics: BasicsPayload;
  descricao_livre: string;
}

const SEXO_LABEL: Record<string, string> = {
  M: "masculino",
  F: "feminino",
  I: "intersexo / não-binário",
};

const SYSTEM_PROMPT = `Você é o **PreceptorMED**, tutor de medicina brasileiro especialista em criar casos clínicos didáticos.

ENTRADA: você recebe dados básicos de um paciente (nome, idade, sexo, doença principal) + uma DESCRIÇÃO LIVRE escrita pelo professor (pode ser uma frase, um parágrafo ou apenas algumas palavras-chave).

TAREFA: ESTRUTURE um caso clínico DIDÁTICO E COMPLETO a partir disso. Você deve INFERIR e PREENCHER detalhes clinicamente plausíveis quando o professor não especificou — esse é o seu trabalho como suporte. Use seu conhecimento médico pra montar um caso que faça sentido como aula.

REGRAS:
1. **Preencha TODOS os campos do schema**, mesmo que o professor não tenha mencionado. Se ele só disse "IC com FE reduzida em homem 65a", você infere comorbidades plausíveis (HAS, dislipidemia, ex-tabagismo), HDA típica, exame físico esperado, exames já realizados (ECG, eco com FE 30%, BNP elevado, etc), HD (CID I50.2), conduta padrão, pontos de aprendizado.
2. **Use os dados básicos como ANCORAGEM** — não invente outra idade, sexo ou doença. Você desenvolve em volta deles.
3. **RESPEITE INFORMAÇÕES DADAS** pelo professor — se ele disse "ex-tabagista 30 maços/ano", inclua isso. Se ele disse "FE 30%", coloque no eco. Não contradiga.
4. **Adicione granularidade clínica**: valores numéricos plausíveis, nomes de exames específicos (não "exames laboratoriais", mas "Hb 13,2; Cr 1,1; BNP 850; troponina < 0,01"), CIDs corretos.
5. **Linguagem médica BR**: HDA, CID-10, BNP, FE, NYHA, etc.
6. **Pontos de aprendizado** (3-5): algo didático que o professor pode usar como gancho na aula. Ex: "Diferença entre IC com FE reduzida (HFrEF) e preservada (HFpEF) muda a terapia significativamente."
7. **Título**: 1 linha clara. Ex: "ICFEr descompensada em homem 65a com IAM prévio e fibrilação atrial."
8. **Resumo curto**: 1-2 frases. Aparece na lista de casos.

Se a descrição for MUITO vaga (ex: "diabetes"), monte um caso PADRÃO didático coerente com o quadro mais comum (DM2 descompensada por exemplo).

FORMATO: JSON válido conforme schema. Sem markdown, sem texto fora do JSON.`;

const responseSchema = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    resumo_curto: { type: "string" },
    paciente_nome: { type: "string" },
    paciente_idade: { type: "number" },
    paciente_idade_unidade: { type: "string" },
    paciente_sexo: { type: "string" },
    doenca_principal: { type: "string" },
    identificacao: {
      type: "object",
      properties: {
        nome: { type: "string" }, idade: { type: "string" }, sexo: { type: "string" },
        profissao: { type: "string" }, naturalidade: { type: "string" },
      },
    },
    queixa_principal: { type: "string" },
    hda: { type: "string" },
    antecedentes: {
      type: "object",
      properties: {
        pessoais: { type: "string" }, familiares: { type: "string" },
        ginecologicos: { type: "string" }, sociais: { type: "string" },
      },
    },
    medicacoes_alergias: {
      type: "object",
      properties: {
        em_uso: { type: "array", items: { type: "string" } },
        alergias: { type: "array", items: { type: "string" } },
      },
    },
    exame_fisico: {
      type: "object",
      properties: {
        sinais_vitais: {
          type: "object",
          properties: {
            pa: { type: "string" }, fc: { type: "string" }, fr: { type: "string" },
            temp: { type: "string" }, spo2: { type: "string" }, glicemia_capilar: { type: "string" },
          },
        },
        geral: { type: "string" }, segmentar: { type: "string" },
      },
    },
    exames_complementares: {
      type: "array",
      items: {
        type: "object",
        properties: { tipo: { type: "string" }, nome: { type: "string" }, resultado: { type: "string" } },
      },
    },
    hipoteses_diagnosticas: {
      type: "array",
      items: {
        type: "object",
        properties: { cid: { type: "string" }, descricao: { type: "string" }, justificativa: { type: "string" } },
      },
    },
    diagnostico_final: { type: "string" },
    conduta_proposta: { type: "string" },
    evolucao: { type: "string" },
    pontos_aprendizado: { type: "array", items: { type: "string" } },
  },
  required: ["titulo", "resumo_curto", "queixa_principal", "hda", "diagnostico_final", "conduta_proposta", "pontos_aprendizado"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return jsonErr(401, "Sem autenticação");

    const userClient = createClient(SUPA_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const svcClient = createClient(SUPA_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonErr(401, "Usuário inválido");
    const userId = userData.user.id;

    const body: ReqBody = await req.json();
    if (body.action !== "build_complete") {
      return jsonErr(400, "Action inválida. Use build_complete.");
    }

    const b = body.basics;
    if (!b?.paciente_nome || !b?.paciente_idade || !b?.paciente_sexo || !b?.doenca_principal) {
      return jsonErr(400, "Faltam dados básicos (nome, idade, sexo, doença)");
    }
    const idadeUnidade = b.paciente_idade_unidade ?? "anos";
    const sexoLabel = SEXO_LABEL[b.paciente_sexo] ?? "—";
    const descricao = (body.descricao_livre ?? "").trim();

    const userPrompt = `--- DADOS BÁSICOS ---
Nome: ${b.paciente_nome}
Idade: ${b.paciente_idade} ${idadeUnidade}
Sexo: ${sexoLabel} (${b.paciente_sexo})
Doença/quadro principal: ${b.doenca_principal}

--- DESCRIÇÃO LIVRE DO PROFESSOR ---
${descricao || "(não fornecida — gere um caso padrão didático coerente com a doença)"}

--- TAREFA ---
Monte o caso clínico COMPLETO E ESTRUTURADO seguindo o schema. Preserve TODOS os fatos dados pelo professor. Onde houver lacuna, INFIRA detalhes clinicamente plausíveis pra montar um caso didático completo e útil pra aula.`;

    const summary = await callIA(userPrompt);
    if (!summary) {
      return jsonErr(502, "PreceptorMED falhou em gerar o caso. Tente novamente em alguns segundos.");
    }

    // Persistir
    const payload = {
      user_id: userId,
      status: "complete",
      titulo: summary.titulo ?? null,
      resumo_curto: summary.resumo_curto ?? null,
      paciente_nome: summary.paciente_nome ?? b.paciente_nome,
      paciente_idade: summary.paciente_idade ?? b.paciente_idade,
      paciente_idade_unidade: summary.paciente_idade_unidade ?? idadeUnidade,
      paciente_sexo: summary.paciente_sexo ?? b.paciente_sexo,
      doenca_principal: summary.doenca_principal ?? b.doenca_principal,
      caso_estruturado: summary,
      conversation: [
        {
          role: "user",
          content: descricao || "(sem descrição livre)",
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: "Caso clínico montado pelo PreceptorMED.",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    let caseId = body.case_id ?? null;
    if (caseId) {
      const { error: upErr } = await svcClient
        .from("clinical_cases")
        .update(payload)
        .eq("id", caseId)
        .eq("user_id", userId);
      if (upErr) return jsonErr(500, `Erro atualizando caso: ${upErr.message}`);
    } else {
      const { data: row, error: insErr } = await svcClient
        .from("clinical_cases")
        .insert(payload)
        .select("id")
        .single();
      if (insErr || !row) return jsonErr(500, `Erro criando caso: ${insErr?.message ?? ""}`);
      caseId = row.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        case_id: caseId,
        case_summary: summary,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[build-clinical-case] erro fatal:", e);
    return new Response(
      JSON.stringify({ success: false, error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
async function callIA(userPrompt: string): Promise<Record<string, unknown> | null> {
  const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const backoffs = [800, 2000, 5000, 10000];
  let lastErr = "";

  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    try {
      const res = await fetch(geminiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema,
            maxOutputTokens: 16000,
          },
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        lastErr = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
        console.warn(`[callIA] tentativa ${attempt + 1} falhou: ${lastErr}`);
        if (res.status >= 500 || res.status === 429) {
          await sleep(backoffs[attempt]);
          continue;
        }
        return null;
      }

      const out = await res.json();
      const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastErr = "resposta vazia";
        await sleep(backoffs[attempt]);
        continue;
      }

      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        return JSON.parse(cleanText) as Record<string, unknown>;
      } catch (parseErr) {
        lastErr = `JSON parse: ${String(parseErr)}`;
        console.warn(`[callIA] tentativa ${attempt + 1}: ${lastErr}`);
        await sleep(backoffs[attempt]);
      }
    } catch (e) {
      lastErr = String((e as Error).message ?? e);
      console.warn(`[callIA] tentativa ${attempt + 1} exception: ${lastErr}`);
      await sleep(backoffs[attempt]);
    }
  }
  console.error(`[callIA] FALHA após ${backoffs.length} tentativas: ${lastErr}`);
  return null;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
