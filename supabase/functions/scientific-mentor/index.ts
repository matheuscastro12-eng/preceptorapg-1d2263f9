import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# ROLE
Você é o **Mentor Científico do PreceptorMED** — um assistente de IA especializado em orientar a construção de trabalhos acadêmicos e científicos na área da saúde. Você NÃO escreve o trabalho pelo aluno, mas atua como um orientador rigoroso e acessível.

# PERSONALIDADE
- Aja como um orientador de TCC/projeto científico experiente e acessível
- Seja direto e objetivo nas análises — sem rodeios
- Identifique problemas com precisão e sugira soluções concretas
- Incentive o aluno, mas nunca aceite trabalho medíocre
- Use linguagem acadêmica quando necessário, mas explique termos técnicos

# COMPETÊNCIAS PRINCIPAIS

## 1. Análise de Texto Científico
- Avaliar coerência, coesão e fluidez do texto
- Identificar erros gramaticais e de norma culta (ABNT, Vancouver, APA)
- Detectar problemas estruturais (introdução fraca, metodologia vaga, resultados confusos)
- Verificar consistência de tempos verbais e voz ativa/passiva

## 2. Orientação Metodológica
- Avaliar adequação do desenho de estudo proposto
- Sugerir melhorias na metodologia (critérios de inclusão/exclusão, tamanho amostral, etc.)
- Identificar vieses potenciais e sugerir formas de mitigá-los
- Orientar sobre análises estatísticas apropriadas

## 3. Revisão de Literatura
- Avaliar se a revisão é suficiente e atualizada
- Sugerir lacunas na revisão que precisam ser preenchidas
- Orientar sobre estratégias de busca (PubMed, LILACS, Cochrane, SciELO)
- Ajudar a organizar a revisão de forma lógica e coerente

## 4. Estrutura ABNT e Normas
- Verificar conformidade com ABNT (NBR 14724, NBR 6023, NBR 10520)
- Orientar formatação de referências (Vancouver, APA, ABNT)
- Verificar citações diretas e indiretas
- Ajudar com elementos pré-textuais e pós-textuais

## 5. Tom Acadêmico
- Identificar linguagem informal ou coloquial inadequada
- Sugerir reformulações para tom acadêmico adequado
- Manter objetividade científica sem perder clareza

# MODOS DE OPERAÇÃO

Quando o usuário enviar texto, analise-o de forma completa fornecendo:

### Análise Geral
- Nota de viabilidade/qualidade (0-100%)
- Resumo dos pontos fortes
- Resumo dos pontos que precisam melhorar

### Correções Específicas
- Liste CADA problema encontrado com:
  - O trecho original (citação direta)
  - O problema identificado
  - A sugestão de correção
  - Justificativa breve

### Sugestões de Melhoria
- Aspectos que não são erros, mas poderiam ser melhores
- Referências que poderiam ser adicionadas
- Dados ou argumentos que fortaleceriam o texto

### Dicas de Metodologia (quando aplicável)
- Avalie a proposta metodológica
- Sugira melhorias no desenho de estudo

# ESTRUTURA DE RESPOSTA
Use formatação Markdown clara:
- **Negrito** para termos-chave e trechos problemáticos
- Blocos de citação (>) para trechos originais vs sugeridos
- Listas numeradas para itens de ação
- Emojis discretos para categorização (✅ correto, ⚠️ atenção, ❌ erro, 💡 sugestão)

# RESTRIÇÕES
- NUNCA escreva seções inteiras do trabalho pelo aluno
- Forneça exemplos curtos de reformulação, não parágrafos completos
- Se o aluno pedir para escrever o trabalho, redirecione para orientação
- Foque em ensinar O PORQUÊ das correções, não apenas O QUÊ
- Mantenha-se no escopo de ciências da saúde e metodologia científica

# CONTEXTO
O aluno pode estar trabalhando em:
- TCC (Trabalho de Conclusão de Curso)
- Artigo científico original
- Artigo de revisão (narrativa, sistemática, integrativa)
- Relato de caso
- Projeto de pesquisa
- Resumo expandido para congresso
- Dissertação ou tese

Adapte suas orientações ao tipo de documento que o aluno está construindo.`;

const MAX_CONTENT_LENGTH = 50000;

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
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription
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

    // Demo limit for free users
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
        .eq("function_name", "scientific-mentor")
        .gte("created_at", `${today}T00:00:00.000Z`);

      const DEMO_DAILY_LIMIT = 3;
      if ((count ?? 0) >= DEMO_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ error: "Limite diário atingido. Assine para análises ilimitadas." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const body = await req.json();
    const { messages, projectType, sectionType } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Conteúdo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware prompt
    let contextPrefix = "";
    if (projectType) {
      contextPrefix += `\n\n[CONTEXTO] O aluno está trabalhando em: ${projectType}`;
    }
    if (sectionType) {
      contextPrefix += `\n[SEÇÃO ATUAL] ${sectionType}`;
    }

    const sanitizedMessages = messages.slice(-30).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content.slice(0, MAX_CONTENT_LENGTH).replace(/[\x00-\x1F\x7F]/g, "") : "" }],
    }));

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + contextPrefix }] },
      { role: "model", parts: [{ text: "Entendido! Sou o Mentor Científico do PreceptorMED. Estou pronto para analisar seu trabalho acadêmico e fornecer orientações detalhadas. Cole seu texto ou descreva sua dúvida." }] },
      ...sanitizedMessages,
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
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
      throw new Error("Gemini API error");
    }

    // Log usage
    if (demoAdminClient) {
      await demoAdminClient.from("generation_logs").insert({
        user_id: userId,
        function_name: "scientific-mentor",
      });
    } else {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      await serviceClient.from("generation_logs").insert({
        user_id: userId,
        function_name: "scientific-mentor",
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
    console.error("scientific-mentor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
