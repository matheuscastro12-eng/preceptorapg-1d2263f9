// PreceptorMED conduz a construção de um caso clínico via chat.
// O modelo decide a próxima pergunta OU finaliza o caso quando tem
// informação suficiente. Steps base sempre cobertos: nome → idade →
// sexo → doença/queixa → adaptativo (HDA, antecedentes, exame, exames).
//
// Action types:
//   - "start": cria caso + retorna primeira pergunta
//   - "reply": adiciona resposta do user, retorna próxima pergunta OU finaliza
//   - "finalize": força finalização com info atual

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

interface ConversationMsg {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

interface ReqBody {
  action: "start" | "reply" | "finalize";
  case_id?: string;
  user_message?: string;
}

const SYSTEM_PROMPT = `Você é o **PreceptorMED**, um tutor de medicina brasileiro que conduz a construção de um caso clínico para fins didáticos (aula, discussão em PBL, simulação).

OBJETIVO: ajudar o professor/médico a montar um caso clínico ESTRUTURADO e DIDÁTICO em até 8-12 perguntas. Comece pelo básico (nome, idade, sexo, doença/queixa) e depois adapte as perguntas em função da doença mencionada.

REGRAS DE CONDUÇÃO:
1. Faça UMA pergunta por vez. Curta, clara, direta.
2. Comece SEMPRE pela ordem: nome do paciente (pode ser fictício) → idade → sexo → qual o quadro clínico/doença que vai discutir.
3. Após o quadro, adapte. Exemplos:
   - Doença = "IAM com supra de ST" → pergunte: dor irradia? fatores associados? comorbidades CV? medicações em uso? primeiro evento?
   - Doença = "DM2 descompensada" → pergunte: tempo de DM, tratamento atual, gatilho da descompensação, glicemias recentes, sintomas atuais
   - Doença = "Pneumonia comunitária" → pergunte: idade × fatores de risco, tabagismo, comorbidades pulmonares, vacinação, sinais vitais à apresentação
4. Pergunte exame físico relevante (sinais vitais sempre, achados do sistema afetado).
5. Pergunte exames complementares feitos (se já fez ECG, lab, imagem — quais valores).
6. Após ~8 perguntas OU quando tiver dados suficientes, FINALIZE com action="finalize" e estruture o caso completo.

ESTILO:
- Tom: PROFISSIONAL mas acolhedor. "Beleza", "vamos lá", "ótimo".
- Use linguagem médica BR (não use "history", "chief complaint" — use "HDA", "queixa").
- Se a resposta do user for vaga ("dor"), pergunte específico ("Onde dói? Tipo da dor? Fatores de melhora?").
- NÃO faça mais que UMA pergunta por turno.
- NÃO sugira diagnóstico até o user pedir OU até a finalização.

QUANDO FINALIZAR:
- Estruture caso_estruturado com TODOS os campos do schema (preencha vazio se não tiver info).
- titulo: sintetize em 1 linha (ex: "DM2 descompensada em mulher de 65a com cetoacidose").
- resumo_curto: 1-2 frases pra listagem ("Caso de DM2 com CAD precipitada por infecção urinária. Inclui manejo agudo.").
- pontos_aprendizado: 3-5 takeaways didáticos do caso.

FORMATO DE RESPOSTA: SEMPRE JSON válido conforme schema fornecido.`;

const responseSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["ask", "finalize"] },
    next_question: {
      type: "string",
      description: "Pergunta para o user (se action='ask'). NULL se action='finalize'.",
    },
    field_hint: {
      type: "string",
      description: "Identificador do campo que esta pergunta tenta preencher (ex: 'paciente_idade', 'hda', 'exame_fisico'). Pra UI mostrar contexto.",
    },
    placeholder_hint: {
      type: "string",
      description: "Placeholder de exemplo pra ajudar o user a responder (ex: 'Ex: 65 anos, hipertensa há 10 anos').",
    },
    progress_pct: {
      type: "number",
      description: "Estimativa de quão completo está o caso (0-100). Use pra UI mostrar barra de progresso.",
    },
    case_summary: {
      type: "object",
      description: "Preenchido APENAS quando action='finalize'.",
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
            nome: { type: "string" },
            idade: { type: "string" },
            sexo: { type: "string" },
            profissao: { type: "string" },
            naturalidade: { type: "string" },
          },
        },
        queixa_principal: { type: "string" },
        hda: { type: "string" },
        antecedentes: {
          type: "object",
          properties: {
            pessoais: { type: "string" },
            familiares: { type: "string" },
            ginecologicos: { type: "string" },
            sociais: { type: "string" },
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
                pa: { type: "string" },
                fc: { type: "string" },
                fr: { type: "string" },
                temp: { type: "string" },
                spo2: { type: "string" },
                glicemia_capilar: { type: "string" },
              },
            },
            geral: { type: "string" },
            segmentar: { type: "string" },
          },
        },
        exames_complementares: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tipo: { type: "string" },
              nome: { type: "string" },
              resultado: { type: "string" },
            },
          },
        },
        hipoteses_diagnosticas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cid: { type: "string" },
              descricao: { type: "string" },
              justificativa: { type: "string" },
            },
          },
        },
        diagnostico_final: { type: "string" },
        conduta_proposta: { type: "string" },
        evolucao: { type: "string" },
        pontos_aprendizado: { type: "array", items: { type: "string" } },
      },
    },
  },
  required: ["action"],
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

    let caseRow: { id: string; conversation: ConversationMsg[]; status: string } | null = null;

    // ─────────── START ───────────
    if (body.action === "start") {
      const { data: row, error: insErr } = await svcClient
        .from("clinical_cases")
        .insert({ user_id: userId, conversation: [], status: "building" })
        .select("id, conversation, status")
        .single();
      if (insErr || !row) return jsonErr(500, `Erro criando caso: ${insErr?.message ?? ""}`);
      caseRow = { id: row.id, conversation: row.conversation as ConversationMsg[], status: row.status };

      const greeting = "Olá 👋 Vamos montar um caso clínico juntos. **Qual o nome do paciente?** (pode ser fictício, só pra dar identidade ao caso)";
      const updated: ConversationMsg[] = [{ role: "assistant", content: greeting, timestamp: new Date().toISOString() }];

      await svcClient.from("clinical_cases").update({ conversation: updated }).eq("id", caseRow.id);
      return jsonOk({
        case_id: caseRow.id,
        conversation: updated,
        next_question: greeting,
        field_hint: "paciente_nome",
        placeholder_hint: "Ex: Maria Silva, ou apenas 'Maria'",
        progress_pct: 5,
        complete: false,
      });
    }

    // ─────────── REPLY / FINALIZE ───────────
    if (!body.case_id) return jsonErr(400, "case_id obrigatório");
    const { data: existing, error: getErr } = await svcClient
      .from("clinical_cases")
      .select("id, conversation, status, user_id")
      .eq("id", body.case_id)
      .maybeSingle();
    if (getErr || !existing) return jsonErr(404, "Caso não encontrado");
    if (existing.user_id !== userId) return jsonErr(403, "Sem acesso a este caso");
    if (existing.status === "complete") return jsonErr(400, "Caso já finalizado");

    const conv: ConversationMsg[] = (existing.conversation ?? []) as ConversationMsg[];
    if (body.user_message) {
      conv.push({ role: "user", content: body.user_message.trim(), timestamp: new Date().toISOString() });
    }

    const forceFinalize = body.action === "finalize";

    // Monta prompt pra IA
    const conversationText = conv
      .map((m) => `${m.role === "assistant" ? "PreceptorMED" : "Professor"}: ${m.content}`)
      .join("\n\n");

    const prompt = forceFinalize
      ? `Conversa até agora:\n\n${conversationText}\n\n--- INSTRUÇÃO ---\nO usuário pediu pra FINALIZAR o caso. Estruture COMPLETAMENTE o caso clínico no schema fornecido. Se tiver buracos, preencha "não informado" mas TENTE inferir do contexto quando razoável.\n\nResponda com action="finalize" e case_summary preenchido.`
      : `Conversa até agora:\n\n${conversationText}\n\n--- INSTRUÇÃO ---\nVocê é o PreceptorMED. Avalie a conversa e decida:\n1. Se ainda falta informação clinicamente importante, faça UMA próxima pergunta (action="ask").\n2. Se já tem nome+idade+sexo+doença+HDA+exame físico+exames complementares (ou pelo menos 6-7 dessas dimensões), FINALIZE (action="finalize").\n\nNUNCA faça mais que 12 perguntas no total. Se já estamos perto disso, finalize.`;

    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    let lastErr: string | null = null;
    let parsed: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(geminiURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.6,
              responseMimeType: "application/json",
              responseSchema,
              maxOutputTokens: 16000,
            },
          }),
        });
        if (!res.ok) {
          lastErr = `Gemini ${res.status}: ${await res.text().catch(() => "")}`;
          if (res.status >= 500) {
            await new Promise((r) => setTimeout(r, [1000, 3000, 9000][attempt] ?? 3000));
            continue;
          }
          return jsonErr(502, lastErr);
        }
        const out = await res.json();
        const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastErr = "Resposta vazia da IA";
          continue;
        }
        parsed = JSON.parse(text);
        break;
      } catch (e) {
        lastErr = String(e);
        await new Promise((r) => setTimeout(r, [1000, 3000, 9000][attempt] ?? 3000));
      }
    }

    if (!parsed) return jsonErr(502, `Falha IA: ${lastErr}`);

    // Adiciona resposta IA na conversa
    const aiMsg = parsed.action === "finalize"
      ? "Caso clínico montado. Veja a estrutura completa abaixo. ✨"
      : (parsed.next_question ?? "Qual a próxima informação?");
    conv.push({ role: "assistant", content: aiMsg, timestamp: new Date().toISOString() });

    // Persiste
    if (parsed.action === "finalize" && parsed.case_summary) {
      const cs = parsed.case_summary;
      await svcClient.from("clinical_cases").update({
        conversation: conv,
        status: "complete",
        titulo: cs.titulo ?? null,
        resumo_curto: cs.resumo_curto ?? null,
        paciente_nome: cs.paciente_nome ?? null,
        paciente_idade: cs.paciente_idade ?? null,
        paciente_idade_unidade: cs.paciente_idade_unidade ?? "anos",
        paciente_sexo: cs.paciente_sexo ?? null,
        doenca_principal: cs.doenca_principal ?? null,
        caso_estruturado: cs,
      }).eq("id", body.case_id);

      return jsonOk({
        case_id: body.case_id,
        conversation: conv,
        complete: true,
        case_summary: cs,
        progress_pct: 100,
      });
    } else {
      await svcClient.from("clinical_cases").update({ conversation: conv }).eq("id", body.case_id);
      return jsonOk({
        case_id: body.case_id,
        conversation: conv,
        next_question: parsed.next_question,
        field_hint: parsed.field_hint ?? null,
        placeholder_hint: parsed.placeholder_hint ?? null,
        progress_pct: parsed.progress_pct ?? null,
        complete: false,
      });
    }
  } catch (e) {
    console.error("[build-clinical-case] erro:", e);
    return jsonErr(500, String((e as Error).message ?? e));
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify({ success: true, ...(data as object) }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
