import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENAMED_PROMPT = `# ROLE
Você é um elaborador de questões para o ENAMED (Exame Nacional de Avaliação da Formação Médica), vinculado ao INEP. Sua missão é elaborar questões no EXATO estilo ENAMED 2025/2026.

# CARACTERÍSTICAS OBRIGATÓRIAS DO ESTILO ENAMED

1. **4 alternativas (A, B, C, D)** — apenas UMA correta
2. **Vinhetas Clínicas Detalhadas** (maioria das questões): cenários com paciente, idade, sintomas, exames, exigindo raciocínio clínico
3. **Enunciados longos** com dados positivos e negativos para confundir/testar atenção
4. **Foco em conduta e diagnóstico** — não memorização pura
5. **Ambiguidade calculada** — distratores muito plausíveis
6. **Baseado em diretrizes atuais** (guidelines brasileiros e internacionais)
7. **Terminologia médica formal**

# ÁREAS DO ENAMED
- Clínica Médica
- Cirurgia
- Ginecologia e Obstetrícia
- Pediatria
- Saúde Coletiva (Medicina Preventiva, Saúde da Família)

# REGRA DE QUANTIDADE
⚠️ Gere EXATAMENTE {{quantidade}} questões. Numere de 1 a {{quantidade}}.

# DISTRIBUIÇÃO
{{distribuicao}}

# FORMATO DE SAÍDA OBRIGATÓRIO

---

## Questão X
*Área: [área] | ENAMED {{ano}}*

[Enunciado clínico completo e detalhado — mínimo 8 linhas para casos clínicos]

**A)** [alternativa]
**B)** [alternativa]
**C)** [alternativa]
**D)** [alternativa]

<details>
<summary>📋 Gabarito e Comentário</summary>

**Gabarito: [LETRA]**

**Comentário:**
[Explicação detalhada do raciocínio clínico, citando guidelines quando aplicável]

**Por que as demais estão incorretas:**
- A) [explicação]
- B) [explicação]
- C) [explicação]

**💡 Ponto-chave:** [insight de estudo relevante]

</details>

---

# DIRETRIZES DE QUALIDADE
- Enunciados realistas com dados de sinais vitais, exames laboratoriais com valores numéricos
- Incluir dados irrelevantes (como na prova real) para testar capacidade de filtragem
- Distratores devem representar erros comuns de raciocínio médico
- Algumas questões devem ter enunciados mais curtos e diretos (30%)
- Incluir questões sobre condutas em emergência, manejo ambulatorial e prevenção
- Foco em temas atuais: Dengue, sepse, rastreamento, saúde do trabalhador, violência, saúde mental`;

const AREAS_MAP: Record<string, string> = {
  clinica_medica: "Clínica Médica",
  cirurgia: "Cirurgia",
  ginecologia_obstetricia: "Ginecologia e Obstetrícia",
  pediatria: "Pediatria",
  saude_coletiva: "Saúde Coletiva",
};

const MAX_CONTENT_LENGTH = 50000;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

    // Check subscription
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("status, plan_type")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    const hasActiveSubscription = subscription?.status === "active" || subscription?.plan_type === "free_access";

    if (!hasActiveSubscription && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Assinatura ativa necessária" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("generation_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .eq("function_name", "generate-enamed")
      .gte("created_at", windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: `Limite de ${RATE_LIMIT_MAX_REQUESTS} gerações a cada ${RATE_LIMIT_WINDOW_MINUTES} minutos.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await serviceClient.from("generation_logs").insert({
      user_id: userData.user.id,
      function_name: "generate-enamed",
    });

    const body = await req.json();
    const { quantidade, area, conteudo_extra } = body;

    const numQuestions = typeof quantidade === "number" ? Math.min(Math.max(quantidade, 5), 100) : 20;
    const sanitizedArea = area && AREAS_MAP[area] ? area : null;

    let distribuicao: string;
    if (sanitizedArea) {
      distribuicao = `Todas as ${numQuestions} questões devem ser de ${AREAS_MAP[sanitizedArea]}.`;
    } else {
      const perArea = Math.floor(numQuestions / 5);
      const remainder = numQuestions - perArea * 5;
      distribuicao = `Distribua proporcionalmente entre as 5 áreas (~${perArea} questões cada, ${remainder > 0 ? `+${remainder} em Clínica Médica` : ""}).`;
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY not configured");
    }

    const systemPrompt = ENAMED_PROMPT
      .replace(/{{quantidade}}/g, String(numQuestions))
      .replace(/{{distribuicao}}/g, distribuicao)
      .replace(/{{ano}}/g, "2025/2026");

    let userPrompt = `Gere EXATAMENTE ${numQuestions} questões no estilo ENAMED 2025/2026.`;
    if (sanitizedArea) {
      userPrompt += ` Todas da área de ${AREAS_MAP[sanitizedArea]}.`;
    }
    if (conteudo_extra && typeof conteudo_extra === "string" && conteudo_extra.trim()) {
      const sanitized = conteudo_extra.trim().slice(0, MAX_CONTENT_LENGTH);
      userPrompt += `\n\nConteúdo de referência para basear as questões:\n${sanitized}`;
    }
    userPrompt += `\n\n⚠️ Gere TODAS as ${numQuestions} questões. NÃO pare antes. Cada questão DEVE ter 4 alternativas (A-D) e gabarito comentado.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 65536,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar questões ENAMED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
              const openAiChunk = { choices: [{ delta: { content } }] };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(openAiChunk)}\n\n`)
              );
            }
          } catch {
            // Ignore
          }
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
    console.error("generate-enamed error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
