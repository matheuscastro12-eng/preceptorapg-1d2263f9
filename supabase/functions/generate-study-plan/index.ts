// Edge function: gera cronograma de estudo dia-a-dia via Gemini.
// Input: { prova_nome, prova_data, topicos_input, horas_dia }
// Output: cria study_plans + study_plan_days; retorna plan_id
//
// Lógica de distribuição:
//   - 65% dias = aprendizado (conteúdo novo + flashcards do tema)
//   - 25% = consolidação (revisão flashcards + simulado curto)
//   - 10% finais = revisão final (simulado completo + revisão geral)
//   - últimos 1-2 dias = descanso leve

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

interface ReqBody {
  prova_nome: string;
  prova_data: string; // YYYY-MM-DD
  topicos_input: string;
  horas_dia: number;
}

interface AtividadeIA {
  tipo: "fechamento" | "flashcards" | "questoes" | "revisao_flash" | "leitura";
  tema: string;
  descricao: string;
  estimativa_min: number;
  quantidade?: number;
}

interface DiaIA {
  data: string;
  topico_principal: string;
  fase: "aprendizado" | "consolidacao" | "revisao_final" | "descanso";
  atividades: AtividadeIA[];
}

function dateRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function classifyPhase(diaIdx: number, totalDias: number): DiaIA["fase"] {
  const pctRestante = (totalDias - diaIdx) / totalDias;
  if (totalDias - diaIdx <= 1) return "descanso";
  if (totalDias - diaIdx <= 4) return "revisao_final";
  if (pctRestante < 0.3) return "consolidacao";
  return "aprendizado";
}

const planSchema = {
  type: "object",
  properties: {
    topicos_normalizados: {
      type: "array",
      items: { type: "string" },
      description: "Lista de tópicos do estudante normalizada (ex: 'cardio' → 'Cardiologia'; 'icc' → 'Insuficiência Cardíaca')",
    },
    distribuicao: {
      type: "array",
      description: "Para cada dia já com fase pré-definida, retorne o tópico principal e atividades concretas.",
      items: {
        type: "object",
        properties: {
          data: { type: "string" },
          topico_principal: { type: "string" },
          atividades: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                tipo: { type: "string", enum: ["fechamento", "flashcards", "questoes", "revisao_flash", "leitura"] },
                tema: { type: "string", description: "Tema específico (ex: 'IAM com supra de ST')" },
                descricao: { type: "string", description: "Frase curta acionável (1 linha)" },
                estimativa_min: { type: "number" },
                quantidade: { type: "number", description: "Quando aplicável (ex: 3 questões, 10 flashcards)" },
              },
              required: ["tipo", "tema", "descricao", "estimativa_min"],
            },
          },
        },
        required: ["data", "topico_principal", "atividades"],
      },
    },
  },
  required: ["topicos_normalizados", "distribuicao"],
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

    // Gate: apenas pagantes (status active + plan != free_access)
    const { data: sub } = await svcClient
      .from("subscriptions")
      .select("status, plan_type")
      .eq("user_id", userId)
      .maybeSingle();

    const isPago = sub?.status === "active" && sub?.plan_type && !["none", "free_access"].includes(sub.plan_type);
    const { data: roleRow } = await svcClient.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    const isAdmin = roleRow?.role === "admin";

    if (!isPago && !isAdmin) {
      return jsonErr(403, "Cronograma é exclusivo para assinantes pagos. Faça upgrade para criar seu plano de estudos.");
    }

    const body: ReqBody = await req.json();
    if (!body.prova_nome || !body.prova_data || !body.topicos_input) {
      return jsonErr(400, "Faltam campos obrigatórios");
    }
    const horas = Math.max(1, Math.min(8, body.horas_dia ?? 2));

    const provaDate = new Date(body.prova_data + "T00:00:00Z");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (provaDate <= today) {
      return jsonErr(400, "Data da prova deve ser no futuro");
    }
    const diasDisp = dateRange(today, provaDate);
    if (diasDisp.length > 180) {
      return jsonErr(400, "Cronograma máximo de 180 dias");
    }

    // Pré-classifica fases por dia
    const total = diasDisp.length;
    const skeleton = diasDisp.map((d, idx) => ({
      data: d,
      fase: classifyPhase(idx, total),
    }));

    // ===== Chamada IA =====
    const systemPrompt = `Você é tutor de medicina brasileiro. Vai criar um cronograma de estudo dia-a-dia para um estudante que tem prova "${body.prova_nome}" em ${body.prova_data} (${total} dias incluindo hoje), com ${horas}h disponíveis por dia.

Tópicos brutos do estudante:
"""${body.topicos_input}"""

REGRAS DE DISTRIBUIÇÃO:
1. Normalize os tópicos: corrija abreviações ("cardio" → "Cardiologia"), expanda siglas ("ICC" → "Insuficiência Cardíaca"), agrupe sinônimos.
2. Para cada dia, escolha 1 tópico principal e gere 2-4 atividades concretas que cabem em ~${horas}h.
3. Tipos de atividade disponíveis:
   - "fechamento": gerar resumo de PBL com fisiopatologia em cascata (use para conteúdo novo, ~25-30 min cada)
   - "flashcards": criar deck de 8-12 cards do tema (~15-20 min)
   - "questoes": fazer simulado de N questões (3-10), ~5 min por questão
   - "revisao_flash": revisar flashcards já criados (~10-15 min)
   - "leitura": ler diretrizes/Harrison sobre tópico (~30 min)
4. Fases já estão definidas. Respeite:
   - "aprendizado" (início): 1 fechamento + 1 flashcards + 1 questoes (3-5 q)
   - "consolidacao" (meio): 1 fechamento curto OU revisão + flashcards + questoes
   - "revisao_final" (final): SOMENTE revisao_flash + questoes (5-10 q misturadas)
   - "descanso" (último dia): 1 atividade leve (revisao_flash de 15 min) + descanso.
5. NÃO repita o mesmo tema 2 dias seguidos. Distribua os tópicos cobrindo TODOS antes de revisar.
6. Use linguagem brasileira ("você", informal, prática). Descrição = 1 linha acionável: "Gere fechamento de IAM com supra incluindo manejo agudo".
7. Temas devem ser específicos, não genéricos: "ICC com fração de ejeção reduzida", não "ICC".

Responda APENAS o JSON estruturado conforme o schema.`;

    const userPrompt = `Dias com fases já definidas (${total} dias):\n${JSON.stringify(skeleton)}\n\nTópicos do estudante: ${body.topicos_input}\nHoras por dia: ${horas}h`;

    // gemini-2.0-flash: sem "thinking" (que no 2.5-flash consumia os
    // maxOutputTokens antes de emitir o JSON, truncando a resposta e
    // quebrando o JSON.parse -> "Falha ao gerar plano"). 2.0-flash lida
    // muito bem com responseSchema/JSON estruturado e output grande.
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

    let lastErr: string | null = null;
    let parsed: { topicos_normalizados: string[]; distribuicao: DiaIA[] } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(geminiURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.6,
              responseMimeType: "application/json",
              responseSchema: planSchema,
              maxOutputTokens: 32000,
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
        const finishReason = out?.candidates?.[0]?.finishReason;
        let text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastErr = `Resposta vazia da IA (finishReason=${finishReason ?? "?"})`;
          console.warn("[generate-study-plan]", lastErr, JSON.stringify(out?.candidates?.[0] ?? out).slice(0, 500));
          continue;
        }
        // Resiliencia: remove fences markdown se o modelo encapsular o JSON
        text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        if (finishReason === "MAX_TOKENS") {
          // JSON provavelmente truncado — registra e tenta de novo
          lastErr = "Resposta truncada (MAX_TOKENS)";
          console.warn("[generate-study-plan] MAX_TOKENS — JSON truncado, retry");
          continue;
        }
        try {
          parsed = JSON.parse(text);
        } catch (pe) {
          lastErr = `JSON invalido: ${String(pe)} — inicio: ${text.slice(0, 200)}`;
          console.warn("[generate-study-plan]", lastErr);
          continue;
        }
        break;
      } catch (e) {
        lastErr = String(e);
        console.warn("[generate-study-plan] attempt", attempt, "erro:", lastErr);
        await new Promise((r) => setTimeout(r, [1000, 3000, 9000][attempt] ?? 3000));
      }
    }

    if (!parsed || !parsed.distribuicao || parsed.distribuicao.length === 0) {
      console.error("[generate-study-plan] falha final:", lastErr);
      return jsonErr(502, `Falha ao gerar plano: ${lastErr ?? "desconhecido"}`);
    }

    // ===== Marcar plano anterior como abandonado se existir =====
    await svcClient
      .from("study_plans")
      .update({ status: "abandoned" })
      .eq("user_id", userId)
      .eq("status", "active");

    // ===== Inserir plano =====
    const { data: planRow, error: planErr } = await svcClient
      .from("study_plans")
      .insert({
        user_id: userId,
        prova_nome: body.prova_nome,
        prova_data: body.prova_data,
        topicos_input: body.topicos_input,
        topicos_normalizados: parsed.topicos_normalizados ?? [],
        horas_dia: horas,
        status: "active",
        raw_plan: parsed,
        generation_meta: { model: "gemini-2.5-flash", attempts: 1 },
      })
      .select()
      .single();

    if (planErr || !planRow) {
      return jsonErr(500, `Falha ao salvar plano: ${planErr?.message ?? ""}`);
    }

    // ===== Inserir dias =====
    const skelMap = new Map(skeleton.map((s) => [s.data, s.fase]));
    const dayRows = parsed.distribuicao
      .filter((d) => skelMap.has(d.data))
      .map((d) => ({
        plan_id: planRow.id,
        user_id: userId,
        data: d.data,
        topico_principal: d.topico_principal,
        fase: skelMap.get(d.data),
        atividades: (d.atividades ?? []).map((a) => ({
          ...a,
          concluida: false,
          completed_at: null,
          item_ref: null,
        })),
        concluido_pct: 0,
      }));

    const { error: daysErr } = await svcClient.from("study_plan_days").insert(dayRows);
    if (daysErr) {
      console.error("[generate-study-plan] falha ao inserir dias:", daysErr);
      return jsonErr(500, `Falha ao salvar dias: ${daysErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: planRow.id,
        total_dias: dayRows.length,
        topicos_normalizados: parsed.topicos_normalizados,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-study-plan] erro:", e);
    return jsonErr(500, String((e as Error).message ?? e));
  }
});

function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
