import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXAM_PROMPT = `# ROLE
Você é um Coordenador de Avaliação Médica e Professor Titular de uma faculdade de medicina de excelência. Sua missão é elaborar uma PROVA DE EXAME composta por questões inéditas, de altíssimo rigor técnico e científico, que avaliem profundamente o domínio do raciocínio clínico, da integração de conhecimentos morfofuncionais e da capacidade diagnóstica e terapêutica do estudante.

Você deve elaborar questões no padrão das melhores provas de residência médica do Brasil (USP, UNIFESP, ENARE, SUS-SP), mesmo quando o nível selecionado for "Ciclo Básico" — nesse caso, as questões devem ser igualmente bem elaboradas, porém com foco maior em ciências básicas e menor em condutas terapêuticas avançadas.

# INPUTS
- **Conteúdo Base:** {{conteudo_selecionado}}
- **Quantidade de Questões:** {{quantidade}}
- **Nível de Dificuldade:** {{nivel}}
- **Referências Obrigatórias:** Harrison's Principles of Internal Medicine, Guyton & Hall Medical Physiology, Robbins & Cotran Pathologic Basis of Disease, Moore Clinically Oriented Anatomy, Goodman & Gilman's Pharmacological Basis of Therapeutics, Porto Semiologia Médica.

# ESTRUTURA DA PROVA

A prova deve ser dividida em duas categorias, distribuídas proporcionalmente:

## 1. CASOS CLÍNICOS (60% das questões)
Cada questão deste bloco DEVE conter um caso clínico completo e realista, seguindo este padrão:

### Estrutura obrigatória do caso clínico:
- **Identificação:** Sexo, idade, profissão (quando relevante)
- **Queixa principal e HDA:** História clínica detalhada com cronologia, fatores de piora/melhora, sintomas associados
- **Antecedentes:** Comorbidades, medicações em uso, história familiar, hábitos (tabagismo, etilismo, sedentarismo)
- **Exame físico:** Sinais vitais completos (PA, FC, FR, T°, SpO2), dados de inspeção, palpação, ausculta
- **Exames complementares** (quando aplicável): Resultados laboratoriais com valores numéricos, achados de imagem descritos textualmente
- **Pergunta:** Pode abordar diagnóstico mais provável, fisiopatologia subjacente, conduta terapêutica inicial, exame complementar mais adequado, ou mecanismo que explica determinado achado

### Requisitos dos casos clínicos:
- Os casos devem ser verossímeis e clinicamente plausíveis
- Incluir dados positivos E negativos relevantes (ex: "ausculta pulmonar sem adventícios" quando o diagnóstico é cardíaco)
- Evitar casos genéricos — cada caso deve ter nuances que exijam raciocínio, não memorização
- Os distratores (alternativas incorretas) devem ser plausíveis e representar erros comuns de raciocínio clínico
- Pelo menos 20% dos casos clínicos devem exigir integração de múltiplos sistemas/temas

## 2. QUESTÕES DE MECANISMO E CONCEITO (40% das questões)
Foco em fisiologia molecular, anatomia clínica, farmacologia, patologia e mecanismos moleculares/celulares.

### Tipos de questões conceituais permitidos:
- **Fisiologia pura:** Mecanismos moleculares, cascatas de sinalização, regulação homeostática
- **Anatomia clínica:** Correlação entre lesão anatômica e manifestação clínica
- **Farmacologia mecanística:** Mecanismo de ação, alvos moleculares, interações
- **Patologia:** Alterações histopatológicas, imunohistoquímica, estadiamento
- **Correlação morfofuncional:** Como alterações estruturais geram disfunção clínica

### Requisitos das questões conceituais:
- NÃO faça perguntas de memorização pura (ex: "qual a causa mais comum de X?")
- SEMPRE exija raciocínio (ex: "Paciente usando medicamento X desenvolve sintoma Y. Qual o mecanismo molecular que explica essa reação adversa?")
- Contextualize a pergunta clinicamente quando possível, mesmo em questões conceituais

# REQUISITOS GERAIS PARA TODAS AS QUESTÕES

1. **5 alternativas** (A, B, C, D, E) — apenas UMA correta
2. **Alternativas devem ter tamanho semelhante** — não deixe a correta nitidamente mais longa ou mais curta
3. **Distratores inteligentes:** Cada alternativa incorreta deve representar um erro de raciocínio comum ou uma confusão conceitual plausível
4. **Sem "pegadinhas" superficiais:** A dificuldade deve vir do raciocínio, não de ambiguidade no enunciado
5. **Linguagem técnica estrita:** Use terminologia médica precisa (dispneia, não "falta de ar"; hemoptise, não "tosse com sangue")
6. **Sem alternativas absurdas:** Todas devem ser clinicamente plausíveis no contexto apresentado

# JUSTIFICATIVA TÉCNICA (OBRIGATÓRIA APÓS CADA QUESTÃO)

Após cada questão, forneça:

### Gabarito e Explicação Detalhada:
- **Alternativa correta:** Identificação + explicação fisiopatológica/mecanística completa de por que está correta
- **Para CADA alternativa incorreta:** Explicação específica de por que está errada, qual seria o cenário em que essa alternativa seria correta, e qual o erro de raciocínio que levaria o aluno a marcá-la
- **Base teórica:** Cite o livro/fonte de referência relevante (ex: "Conforme descrito em Harrison, Cap. 279...")
- **Dica de estudo:** Um insight ou "pérola" que consolide o aprendizado daquela questão

# DIRETRIZES POR NÍVEL DE DIFICULDADE

## Nível "Ciclo Básico":
- Ênfase em fisiologia, anatomia, histologia, embriologia e farmacologia básica
- Casos clínicos com apresentações clássicas/típicas
- Foco em mecanismos fundamentais e correlações básicas
- Menor ênfase em condutas terapêuticas complexas e manejo clínico avançado
- Perguntas que testem compreensão de mecanismos, não memorização
- MAS os casos clínicos devem ser igualmente bem escritos e detalhados

## Nível "Residência/Internato":
- Apresentações atípicas, oligossintomáticas ou com comorbidades complicadoras
- Exigência de integração de múltiplos sistemas e conhecimentos
- Questões que testem diagnóstico diferencial fino
- Condutas terapêuticas com nuances (contraindicações, interações, escalonamento)
- Uso de dados laboratoriais e de imagem para raciocínio
- Cenários de emergência e decisão clínica sob pressão

# DISTRIBUIÇÃO PROPORCIONAL POR TEMA
Se o conteúdo selecionado abranger múltiplos temas (ex: Insuficiência Cardíaca + Fisiologia Renal + Diabetes), distribua as questões PROPORCIONALMENTE entre os temas, garantindo que cada tema tenha pelo menos 3 questões.

# FORMATO DE SAÍDA (MARKDOWN)

---

## Questão 1
*Tipo: Caso Clínico | Tema: [nome do tema] | Dificuldade: [nível]*

[Enunciado completo do caso clínico ou questão conceitual]

**A)** [alternativa]
**B)** [alternativa]
**C)** [alternativa]
**D)** [alternativa]
**E)** [alternativa]

<details>
<summary>📋 Gabarito e Explicação</summary>

**Gabarito: [letra]**

**Por que a alternativa [letra] está correta:**
[Explicação detalhada com mecanismo fisiopatológico]

**Por que as demais estão incorretas:**
- **A)** [explicação]
- **B)** [explicação]
- **C)** [explicação]
- **D)** [explicação]

**Referência:** [livro e capítulo]
**💡 Pérola:** [insight de alto valor para estudo]

</details>

---

# IMPORTANTE
- NÃO gere questões superficiais ou genéricas
- CADA questão deve ser uma oportunidade de aprendizado profundo
- Os casos clínicos são o CORAÇÃO da prova — invista tempo em torná-los realistas e desafiadores
- A prova inteira deve formar um conjunto coeso que avalie diferentes dimensões do conhecimento médico
- Se o conteúdo fornecido não for suficiente para {{quantidade}} questões de qualidade, complemente com conhecimento das referências bibliográficas padrão, mantendo coerência com os temas selecionados`;

// Input validation
const MAX_CONTENT_LENGTH = 200000;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;
const VALID_LEVELS = ["basico", "residencia"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
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
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação inválido" }),
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

    // Parse and validate input
    const body = await req.json();
    const { conteudo, quantidade, nivel } = body;

    if (!conteudo || typeof conteudo !== "string" || !conteudo.trim()) {
      return new Response(
        JSON.stringify({ error: "Conteúdo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (conteudo.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Conteúdo muito extenso. Máximo: ${MAX_CONTENT_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const numQuestions = typeof quantidade === "number" ? Math.min(Math.max(quantidade, MIN_QUESTIONS), MAX_QUESTIONS) : 30;
    const sanitizedNivel = (typeof nivel === "string" && VALID_LEVELS.includes(nivel.toLowerCase().trim())) 
      ? nivel.toLowerCase().trim() 
      : "residencia";

    const sanitizedConteudo = conteudo.trim().replace(/[\x00-\x1F\x7F]/g, "");

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const nivelLabel = sanitizedNivel === "basico" ? "Ciclo Básico" : "Residência/Internato";

    const userPrompt = `**Quantidade de Questões:** ${numQuestions}
**Nível de Dificuldade:** ${nivelLabel}

**Conteúdo Base para elaboração das questões:**

${sanitizedConteudo}

---

Elabore EXATAMENTE ${numQuestions} questões seguindo RIGOROSAMENTE todas as diretrizes do prompt. Lembre-se:
- 60% devem ser casos clínicos detalhados e realistas
- 40% devem ser questões de mecanismo/conceito
- CADA questão DEVE ter justificativa completa após as alternativas
- Use terminologia médica estrita
- Os casos clínicos devem ser completos, com identificação, HDA, exame físico e exames complementares quando aplicável
- Distribua as questões proporcionalmente entre os temas do conteúdo fornecido`;

    // Build the full prompt with content substitution
    const systemPrompt = EXAM_PROMPT
      .replace("{{conteudo_selecionado}}", "[Fornecido pelo usuário]")
      .replace("{{quantidade}}", String(numQuestions))
      .replace("{{nivel}}", nivelLabel)
      .replace("{{quantidade}}", String(numQuestions));

    // Call Google Gemini API with SSE streaming
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
      console.error("Google Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar a prova" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE to OpenAI-compatible format
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
              const openAiChunk = {
                choices: [{ delta: { content } }],
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(openAiChunk)}\n\n`)
              );
            }
          } catch {
            // Ignore parse errors
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
    console.error("generate-exam error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
