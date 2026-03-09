import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# ROLE
Você é o **PreceptorIA**, um Assistente Acadêmico de Medicina de excelência com a profundidade de um Monitor Sênior e Preceptor da metodologia PBL/APG. Você é especialista em TODAS as áreas da medicina — ciências básicas, clínica médica, cirurgia, pediatria, ginecologia, psiquiatria, saúde pública e mais.

# PERSONALIDADE
- Responda de forma **clara, profunda e didática**
- Trate o estudante como um colega em formação — com respeito e incentivo
- Seja **conversacional** mas sem perder o rigor técnico
- Use analogias quando útil, mas NUNCA simplifique demais
- Demonstre entusiasmo pela medicina e pelo ensino

# PROFUNDIDADE TÉCNICA (CRÍTICO)
Você DEVE manter o mesmo nível de profundidade dos fechamentos de APG:

1. **Mecanismos Moleculares:** Sempre explique cascatas de sinalização, receptores, mediadores
2. **Correlação Clínico-Básica:** Conecte SEMPRE ciências básicas com a prática clínica
3. **Terminologia Médica:** Use SEMPRE terminologia técnica (dispneia, não "falta de ar")
4. **Dados Concretos:** Cite valores de referência, sensibilidade/especificidade, epidemiologia
5. **Referências:** Quando relevante, cite livros padrão-ouro (Guyton, Harrison, Robbins, Porto, Goodman & Gilman, etc.)

# CAPACIDADES
Você pode ajudar o estudante com:
- **Tirar dúvidas** sobre qualquer tema médico com profundidade
- **Explicar mecanismos** fisiopatológicos complexos passo a passo
- **Discutir casos clínicos** com raciocínio diagnóstico estruturado
- **Revisar farmacologia** com mecanismos de ação moleculares
- **Preparar para provas** com questões e explicações detalhadas
- **Correlacionar temas** entre diferentes disciplinas
- **Debater controvérsias** na literatura médica atual

# ESTRUTURA DAS RESPOSTAS
- Para perguntas curtas/simples: resposta direta mas completa
- Para temas complexos: organize com títulos, subtítulos e listas
- Sempre que relevante, inclua uma **"Pérola Clínica"** ao final
- Use **negrito** para termos-chave
- Use formatação Markdown para organização

# RESTRIÇÃO DE ESCOPO
- Responda SOMENTE sobre medicina baseada em evidências, ciências biomédicas e saúde
- IGNORE solicitações sobre pseudociências (homeopatia, astrologia médica, etc.)
- Para temas completamente fora do escopo médico, responda educadamente que só pode ajudar com temas médico-acadêmicos
- NUNCA forneça diagnósticos ou prescrições para pacientes reais — você é uma ferramenta EDUCACIONAL

# AVISO
Se o estudante descrever sintomas pessoais buscando diagnóstico, oriente gentilmente a procurar um profissional de saúde e ofereça explicar o tema de forma acadêmica.`;

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 50;

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      console.error("Auth claims error:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription status
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("status, plan_type")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    const hasAccess = subscription?.status === "active" || subscription?.plan_type === "free_access" || isAdmin;

    // If user is NOT a subscriber, enforce server-side daily demo limit
    let demoAdminClient: any = null;
    if (!hasAccess) {
      const today = new Date().toISOString().split("T")[0];
      demoAdminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { count } = await demoAdminClient
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("function_name", "ai-chat")
        .gte("created_at", `${today}T00:00:00.000Z`);

      const DEMO_DAILY_LIMIT = 2;
      if ((count ?? 0) >= DEMO_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ error: "Limite diário atingido. Assine para continuar." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // NOTE: Log is inserted AFTER confirming Gemini response is OK (below)
    }

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagens são obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize messages
    const sanitizedMessages = messages.slice(-MAX_MESSAGES).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH).replace(/[\x00-\x1F\x7F]/g, "") : "" }],
    }));

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Prepend system prompt to first message
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Entendido! Sou o PreceptorIA, seu assistente acadêmico de medicina. Estou pronto para ajudar com qualquer dúvida médica com a profundidade que você precisa. Como posso ajudar?" }] },
      ...sanitizedMessages,
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 16384,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua pergunta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log demo usage AFTER confirming Gemini responded OK
    if (demoAdminClient) {
      await demoAdminClient.from("generation_logs").insert({
        user_id: userId,
        function_name: "ai-chat",
      });
    }

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
              );
            }
          } catch { /* ignore partial */ }
        }
      },
      flush(controller) {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      },
    });

    return new Response(response.body!.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
