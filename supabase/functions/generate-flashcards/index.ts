import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ────────────────────────────────────────────────────────────────
// Subseções médicas padrão (fixo). A UI envia o subset que o aluno
// selecionou. A IA preenche `secao` em cada card com EXATAMENTE
// uma das strings da lista enviada.
// ────────────────────────────────────────────────────────────────
const VALID_SECTIONS = [
  "Definição/Classificação",
  "Epidemiologia",
  "Fisiopatologia",
  "Etiologia",
  "Fatores de risco",
  "Quadro clínico",
  "Diagnóstico",
  "Diagnóstico diferencial",
  "Tratamento",
  "Complicações",
  "Prognóstico",
  "Pontos de prova",
] as const;

// Prompt para geração estruturada por tema + seções selecionadas.
function buildStructuredPrompt(opts: {
  topic: string;
  sections: string[];
  customObjectives?: string;
  count: number;
}): string {
  const sectionsList = opts.sections.map((s) => `  - "${s}"`).join("\n");
  const custom = opts.customObjectives?.trim()
    ? `\n\nOBJETIVOS ESPECÍFICOS DO ALUNO (priorize estes pontos, pode criar uma seção "Objetivos específicos" se útil):\n${opts.customObjectives.trim()}`
    : "";

  return `Você é um professor de medicina especialista em criar flashcards para revisão espaçada (algoritmo SM-2).

TAREFA: gerar ${opts.count} flashcards sobre **${opts.topic}**, distribuídos entre as seções selecionadas pelo aluno.

SEÇÕES PERMITIDAS (use EXATAMENTE estas strings no campo "secao"):
${sectionsList}${custom}

REGRAS:
- Total: aproximadamente ${opts.count} flashcards (pode variar ±2)
- Distribua os cards entre as seções acima de forma proporcional ao peso clínico/acadêmico de cada uma (não força distribuição igual)
- Cada flashcard:
  * "front" = pergunta concisa que testa COMPREENSÃO (não memorização rasa)
  * "back" = resposta técnica em 1-4 frases, com terminologia médica precisa, valores numéricos quando relevantes
  * "secao" = uma das strings exatas da lista acima
- Cubra conceitos clinicamente relevantes para PBL, ENAMED e Revalida
- Inclua: mecanismos fisiopatológicos em cascata, critérios diagnósticos (Roma IV, IDSA, etc.), condutas baseadas em diretrizes brasileiras (SBC, FEBRASGO, SBP, MS) quando aplicável
- NÃO crie cards de seções fora da lista permitida
- Markdown simples permitido no back (**negrito** para conceitos-chave)

FORMATO DE SAÍDA (JSON array, sem texto adicional, sem markdown wrapper):
[
  {"front": "Pergunta?", "back": "Resposta técnica.", "secao": "Fisiopatologia"},
  {"front": "Pergunta?", "back": "Resposta técnica.", "secao": "Tratamento"}
]`;
}

// Prompt legado (compatibilidade com chamadas a partir de fechamentos)
const LEGACY_PROMPT = `Você é um professor de medicina especialista em criar flashcards para revisão espaçada.

A partir do conteúdo acadêmico fornecido, gere flashcards de alta qualidade.

REGRAS:
- Gere entre 10 e 20 flashcards dependendo da extensão do conteúdo
- Cada flashcard deve ter uma PERGUNTA (frente) e RESPOSTA (verso)
- Perguntas devem testar compreensão, não memorização superficial
- Respostas devem ser concisas (1-3 frases)
- Cubra os conceitos mais importantes e clinicamente relevantes
- Use terminologia médica adequada

FORMATO DE SAÍDA (JSON array):
[
  {"front": "Pergunta aqui?", "back": "Resposta aqui.", "area": "Área médica"},
  ...
]

Retorne APENAS o JSON array, sem texto adicional, sem markdown.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      // Modo novo: estruturado por tema/seções
      topic,
      sections,
      custom_objectives,
      count,
      // Modo antigo (fechamentos): conteúdo bruto
      content,
      source_id,
      source_type = "resumo",
    } = body as {
      topic?: string;
      sections?: string[];
      custom_objectives?: string;
      count?: number;
      content?: string;
      source_id?: string;
      source_type?: string;
    };

    // Decide qual modo usar
    const isStructured = !!(topic && topic.trim());

    let promptText: string;
    let temaForRow: string | null = null;
    if (isStructured) {
      const validSections = (sections ?? []).filter((s) =>
        (VALID_SECTIONS as readonly string[]).includes(s)
      );
      if (validSections.length === 0) {
        return new Response(
          JSON.stringify({ error: "Selecione pelo menos uma seção" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const safeCount = Math.max(5, Math.min(40, count ?? 15));
      promptText = buildStructuredPrompt({
        topic: topic!.trim(),
        sections: validSections,
        customObjectives: custom_objectives,
        count: safeCount,
      });
      temaForRow = topic!.trim();
    } else {
      if (!content || typeof content !== "string" || content.trim().length < 50) {
        return new Response(
          JSON.stringify({ error: "Conteúdo insuficiente para gerar flashcards" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Trim para não estourar tokens
      const trimmedContent = content.slice(0, 50000);
      promptText = LEGACY_PROMPT + "\n\n---\n\nCONTEÚDO:\n\n" + trimmedContent;
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY not configured");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Erro ao gerar flashcards com IA");
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse flashcards JSON:", rawText.slice(0, 500));
      throw new Error("Formato de resposta inválido da IA");
    }
    jsonStr = jsonMatch[0];

    let flashcards: Array<{ front: string; back: string; area?: string; secao?: string }>;
    try {
      flashcards = JSON.parse(jsonStr);
    } catch {
      console.error("JSON parse error:", jsonStr.slice(0, 500));
      throw new Error("Erro ao interpretar resposta da IA");
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Nenhum flashcard gerado");
    }

    // Insert flashcards into DB
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const rows = flashcards.map((fc) => ({
      user_id: userData.user.id,
      front: fc.front,
      back: fc.back,
      area: fc.area || null,
      tema: temaForRow,                          // tema preenchido no modo estruturado
      secao: isStructured ? (fc.secao || null) : null, // secao só no modo estruturado
      source_type,
      source_id: source_id || null,
    }));

    const { error: insertError } = await serviceClient.from("flashcards").insert(rows);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Erro ao salvar flashcards");
    }

    // Loga atividade pra health score considerar uso de flashcards
    void serviceClient.from("generation_logs").insert({
      user_id: userData.user.id,
      function_name: "generate-flashcards",
    });

    return new Response(
      JSON.stringify({ success: true, count: rows.length, tema: temaForRow }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-flashcards error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
