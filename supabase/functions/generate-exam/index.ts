import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXAM_PROMPT = `# ROLE
Você é um Coordenador de Avaliação Médica e Professor Titular de uma faculdade de medicina de excelência. Sua missão é elaborar uma PROVA DE EXAME completa.

# REGRA ABSOLUTA DE QUANTIDADE
⚠️ REGRA INVIOLÁVEL: Você DEVE gerar EXATAMENTE {{quantidade}} questões. NÃO gere menos. NÃO gere mais. Se solicitado 30, gere 30. Se solicitado 15, gere 15. Conte as questões enquanto gera. Numere de 1 a {{quantidade}}.

# INPUTS
- **Conteúdo Base:** [Fornecido pelo usuário]
- **Quantidade de Questões:** {{quantidade}} (EXATAMENTE este número, sem exceção)
- **Nível de Dificuldade:** {{nivel}}
- **Referências:** Harrison, Guyton, Robbins, Moore, Goodman & Gilman, Porto.

# ESTRUTURA DA PROVA

## CASOS CLÍNICOS (60% das questões)
Cada caso clínico DEVE conter:
- Identificação (sexo, idade, profissão)
- Queixa principal e HDA detalhada com cronologia
- Antecedentes (comorbidades, medicações, história familiar, hábitos)
- Exame físico com sinais vitais completos (PA, FC, FR, T°, SpO2)
- Exames complementares quando aplicável (valores numéricos)
- Pergunta sobre diagnóstico, fisiopatologia, conduta ou mecanismo

Requisitos:
- Casos verossímeis com dados positivos E negativos
- Distratores plausíveis representando erros comuns de raciocínio
- 20% dos casos devem integrar múltiplos sistemas/temas

## QUESTÕES DE MECANISMO/CONCEITO (40% das questões)
- Fisiologia molecular, anatomia clínica, farmacologia, patologia
- NUNCA memorização pura — sempre exigir raciocínio
- Contextualizar clinicamente quando possível

# REQUISITOS DAS QUESTÕES
- 5 alternativas (A, B, C, D, E) — apenas UMA correta
- Alternativas com tamanho semelhante
- Distratores inteligentes e plausíveis
- Terminologia médica estrita (dispneia, hemoptise, odinofagia)
- Sem pegadinhas superficiais

# DIRETRIZES POR NÍVEL

## Ciclo Básico:
- Ênfase em fisiologia, anatomia, histologia, farmacologia básica
- Apresentações clássicas/típicas
- Foco em mecanismos fundamentais

## Residência/Internato:
- Apresentações atípicas, oligossintomáticas, com comorbidades
- Diagnóstico diferencial fino
- Condutas terapêuticas com nuances
- Cenários de emergência

# FORMATO DE SAÍDA OBRIGATÓRIO

Use EXATAMENTE este formato para CADA questão. NÃO altere o formato.

---

## Questão X
*Tipo: Caso Clínico | Tema: [tema] | Dificuldade: [nível]*

[Enunciado completo]

**A)** [alternativa]
**B)** [alternativa]
**C)** [alternativa]
**D)** [alternativa]
**E)** [alternativa]

<details>
<summary>📋 Gabarito e Explicação</summary>

**Gabarito: [LETRA]**

**Por que a alternativa [LETRA] está correta:**
[Explicação fisiopatológica detalhada]

**Por que as demais estão incorretas:**
- A) [explicação]
- B) [explicação]
- C) [explicação]
- D) [explicação]

**Referência:** [livro e capítulo]
**💡 Pérola:** [insight de estudo]

</details>

---

# DISTRIBUIÇÃO PROPORCIONAL
Distribua as {{quantidade}} questões proporcionalmente entre os temas do conteúdo fornecido. Cada tema deve ter pelo menos 2-3 questões.

# IMPORTANTE
- Gere EXATAMENTE {{quantidade}} questões numeradas de 1 a {{quantidade}}
- NÃO pare antes de completar todas as {{quantidade}} questões
- CADA questão deve ser uma oportunidade de aprendizado profundo
- Os casos clínicos devem ser realistas e desafiadores`;

const CLINICAL_CASE_PROMPT = `# ROLE
Você é um Preceptor Clínico de excelência em uma faculdade de medicina de alto desempenho. Sua tarefa é elaborar um CASO CLÍNICO INTEGRADOR completo e detalhado, baseado no conteúdo acadêmico fornecido, que simule uma situação real de atendimento médico e desafie o estudante a integrar conhecimentos de múltiplas áreas.

# INPUTS
- **Conteúdo Base:** [Fornecido pelo usuário]
- **Nível de Dificuldade:** {{nivel}}
- **Referências:** Harrison, Guyton, Robbins, Moore, Goodman & Gilman, Porto.

# ESTRUTURA OBRIGATÓRIA DO CASO CLÍNICO

## 1. IDENTIFICAÇÃO E CONTEXTUALIZAÇÃO
- Nome fictício, sexo, idade, profissão, estado civil
- Naturalidade e procedência (quando relevante epidemiologicamente)
- Data de admissão fictícia

## 2. QUEIXA PRINCIPAL (QP)
- Uma frase concisa com o motivo da consulta e o tempo de evolução
- Usar as palavras do "paciente" (depois traduzir para terminologia médica)

## 3. HISTÓRIA DA DOENÇA ATUAL (HDA)
- Narrativa cronológica detalhada (mínimo 10-15 linhas)
- Início dos sintomas, evolução temporal, fatores de piora/melhora
- Sintomas associados positivos E negativos relevantes
- Tratamentos prévios tentados e seus resultados
- Impacto funcional na vida do paciente

## 4. INTERROGATÓRIO SOBRE DIVERSOS APARELHOS (ISDA)
- Revisar pelo menos 4-5 sistemas relevantes
- Incluir achados positivos E negativos pertinentes ao diagnóstico diferencial

## 5. ANTECEDENTES
- **Pessoais patológicos:** Comorbidades, cirurgias, internações, alergias
- **Medicações em uso:** Com doses quando relevante
- **Hábitos:** Tabagismo (carga tabágica), etilismo (CAGE se positivo), drogas, atividade física, dieta
- **Familiares:** Doenças hereditárias, causa de óbito de pais/irmãos
- **Ginecológico/Obstétrico** (se aplicável): G_P_A_, método contraceptivo, DUM

## 6. EXAME FÍSICO COMPLETO
- **Estado geral:** Descrição qualitativa
- **Sinais vitais:** PA (mmHg), FC (bpm), FR (irpm), Tax (°C), SpO2 (%), peso, altura, IMC
- **Cabeça e pescoço:** Orofaringe, tireoide, linfonodos, jugulares
- **Aparelho cardiovascular:** Ictus, bulhas, sopros, pulsos periféricos
- **Aparelho respiratório:** Inspeção, percussão, ausculta com detalhes
- **Abdome:** Inspeção, ausculta, percussão, palpação superficial e profunda
- **Membros:** Edema, perfusão, pulsos, sinais de TVP
- **Neurológico:** Nível de consciência, pupilas, força, sensibilidade, reflexos
- **Pele e anexos:** Lesões, coloração, turgor

## 7. EXAMES COMPLEMENTARES
Apresente os resultados em formato de tabela quando possível:
- **Laboratório:** Hemograma completo, bioquímica, marcadores específicos (com valores numéricos e referência)
- **Imagem:** Descrição textual detalhada dos achados (RX, TC, USG, RM)
- **Eletrocardiograma:** Descrição do traçado quando relevante
- **Outros:** Gasometria, urina tipo I, culturas, etc.

## 8. QUESTÕES PARA DISCUSSÃO

Elabore **10 questões de discussão** progressivas, do mais simples ao mais complexo:

1. **Sintetize os dados:** Quais são os achados positivos mais relevantes da anamnese?
2. **Semiologia:** Que achados do exame físico são mais significativos e o que indicam?
3. **Síndromes:** Qual(is) síndrome(s) clínica(s) podem ser identificadas?
4. **Diagnóstico:** Qual o diagnóstico sindrômico e etiológico mais provável? Justifique.
5. **Diagnóstico diferencial:** Liste pelo menos 3 diagnósticos diferenciais e explique como descartá-los.
6. **Fisiopatologia:** Explique detalhadamente o mecanismo fisiopatológico da doença, correlacionando com os achados clínicos.
7. **Exames complementares:** Os exames solicitados foram adequados? Que outros exames seriam pertinentes e por quê?
8. **Tratamento:** Qual a conduta terapêutica inicial (farmacológica e não-farmacológica)? Justifique as escolhas com mecanismo de ação.
9. **Complicações:** Quais complicações devem ser monitoradas e como preveni-las?
10. **Prognóstico:** Quais fatores prognósticos podem ser identificados neste caso?

## 9. GABARITO COMENTADO

Para CADA questão de discussão, forneça uma resposta completa e detalhada com:
- Explicação fisiopatológica
- Correlação com os dados do caso
- Referência bibliográfica
- Clinical Pearl quando aplicável

## 10. REFERÊNCIAS BIBLIOGRÁFICAS
Cite as fontes utilizadas (Harrison, Guyton, Robbins, Porto, Goodman & Gilman, etc.)

# DIRETRIZES DE RIGOR
- Terminologia médica estrita
- Dados numéricos realistas e coerentes
- O caso deve ser clinicamente plausível e internamente consistente
- Incluir "pistas" sutis que permitam ao estudante atento fazer correlações avançadas
- O caso deve integrar conhecimentos de TODOS os conteúdos selecionados quando possível

# DIRETRIZES POR NÍVEL

## Ciclo Básico:
- Apresentação clássica/típica da doença
- Foco em correlação morfofuncional
- Questões enfatizando mecanismos básicos

## Residência/Internato:
- Apresentação atípica ou com comorbidades complicadoras
- Múltiplas possibilidades diagnósticas
- Questões exigindo raciocínio clínico avançado e decisão terapêutica`;

// Input validation
const MAX_CONTENT_LENGTH = 200000;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;
const VALID_LEVELS = ["basico", "residencia"];
const VALID_MODES = ["prova", "caso_clinico"];
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX_REQUESTS = 5;

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
      .eq("function_name", "generate-exam")
      .gte("created_at", windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: `Limite de ${RATE_LIMIT_MAX_REQUESTS} gerações a cada ${RATE_LIMIT_WINDOW_MINUTES} minutos. Aguarde e tente novamente.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await serviceClient.from("generation_logs").insert({
      user_id: userData.user.id,
      function_name: "generate-exam",
    });

    // Parse and validate input
    const body = await req.json();
    const { conteudo, quantidade, nivel, modo = "prova" } = body;

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

    const sanitizedModo = (typeof modo === "string" && VALID_MODES.includes(modo)) ? modo : "prova";
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

    let systemPrompt: string;
    let userPrompt: string;

    if (sanitizedModo === "caso_clinico") {
      systemPrompt = CLINICAL_CASE_PROMPT
        .replace(/{{nivel}}/g, nivelLabel);

      userPrompt = `**Nível de Dificuldade:** ${nivelLabel}

**Conteúdo Base para elaboração do caso clínico:**

${sanitizedConteudo}

---

Elabore um CASO CLÍNICO INTEGRADOR completo e detalhado baseado no conteúdo acima. O caso deve integrar o máximo de temas possível do conteúdo fornecido. Siga RIGOROSAMENTE toda a estrutura obrigatória do prompt.`;
    } else {
      systemPrompt = EXAM_PROMPT
        .replace(/{{quantidade}}/g, String(numQuestions))
        .replace(/{{nivel}}/g, nivelLabel);

      userPrompt = `**Quantidade de Questões:** EXATAMENTE ${numQuestions} (NÃO gere menos, NÃO gere mais)
**Nível de Dificuldade:** ${nivelLabel}

**Conteúdo Base para elaboração das questões:**

${sanitizedConteudo}

---

⚠️ ATENÇÃO: Elabore EXATAMENTE ${numQuestions} questões numeradas de 1 a ${numQuestions}. 
- Você DEVE gerar TODAS as ${numQuestions} questões, sem exceção.
- 60% casos clínicos detalhados (${Math.round(numQuestions * 0.6)} questões)
- 40% questões de mecanismo/conceito (${Math.round(numQuestions * 0.4)} questões)
- CADA questão DEVE ter justificativa completa dentro de tags <details>
- Use terminologia médica estrita
- NÃO pare antes de completar a questão ${numQuestions}`;
    }

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
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
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
              const openAiChunk = { choices: [{ delta: { content } }] };
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
