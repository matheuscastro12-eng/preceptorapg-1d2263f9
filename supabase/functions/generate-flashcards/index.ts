import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLASHCARD_PROMPT = `Você é um professor de medicina especialista em criar flashcards para revisão espaçada.

A partir do conteúdo acadêmico fornecido, gere flashcards de alta qualidade.

REGRAS:
- Gere entre 10 e 20 flashcards dependendo da extensão do conteúdo
- Cada flashcard deve ter uma PERGUNTA (frente) e RESPOSTA (verso)
- Perguntas devem testar compreensão, não memorização superficial
- Respostas devem ser concisas (1-3 frases)
- Cubra os conceitos mais importantes e clinicamente relevantes
- Use terminologia médica adequada
- Inclua: definições, mecanismos, diagnósticos diferenciais, condutas

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
    const { content, source_id, source_type = "resumo" } = body;

    if (!content || typeof content !== "string" || content.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Conteúdo insuficiente para gerar flashcards" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY not configured");
    }

    // Trim content to avoid token limits
    const trimmedContent = content.slice(0, 50000);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: FLASHCARD_PROMPT + "\n\n---\n\nCONTEÚDO:\n\n" + trimmedContent }] },
        ],
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

    let flashcards: Array<{ front: string; back: string; area?: string }>;
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
      source_type,
      source_id: source_id || null,
    }));

    const { error: insertError } = await serviceClient.from("flashcards").insert(rows);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Erro ao salvar flashcards");
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
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
