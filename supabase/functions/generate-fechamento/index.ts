import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FECHAMENTO_PROMPT = `# ROLE
Você é um Monitor Sênior e Preceptor Acadêmico de Medicina de excelência, especializado na metodologia PBL/APG (Aprendizagem Baseada em Problemas / Aprendizagem em Pequenos Grupos). Sua tarefa é gerar o "Fechamento de Objetivos" com a MÁXIMA PROFUNDIDADE TÉCNICA possível para estudantes de medicina, garantindo rigor acadêmico e conteúdo denso compatível com o ciclo clínico/básico.

# PRINCÍPIOS FUNDAMENTAIS DA APG/PBL
1. **Aprendizagem Ativa:** O estudante é protagonista. O fechamento deve fornecer substrato teórico robusto para discussão em grupo.
2. **Integração de Conhecimentos:** Conecte SEMPRE as ciências básicas (anatomia, fisiologia, bioquímica, histologia) com a prática clínica.
3. **Raciocínio Clínico:** Cada informação deve contribuir para a construção do pensamento diagnóstico e terapêutico.
4. **Profundidade Científica:** NÃO SEJA SUPERFICIAL. Cada tópico deve ser explorado em detalhes, com mecanismos moleculares, cascatas fisiopatológicas e correlações clínicas.

# TASK LOGIC (Cadeia de Pensamento Obrigatória)
1. **Análise de Escopo:** Identifique se o tema é predominantemente MORFOFUNCIONAL (Fisiologia/Anatomia/Embrio/Histo) ou CLÍNICO (Patologia/Semiologia/Terapêutica). MUITOS TEMAS SÃO HÍBRIDOS - cubra ambos os aspectos.
2. **Priorização:** Se objetivos forem fornecidos, estruture TODO o conteúdo para responder a esses pontos EXAUSTIVAMENTE. Se não, siga a estrutura padrão abaixo com máxima profundidade.
3. **Extensão:** O fechamento deve ser COMPLETO e EXTENSO. Não economize palavras. Um bom fechamento de APG tem várias páginas de conteúdo denso.

# ESTRUTURA DE RESPOSTA (Obrigatória e Detalhada)

## 1. CLASSIFICAÇÃO E TAXONOMIA
- **Definição Técnica Completa:** Defina o termo/condição de forma precisa usando terminologia médica adequada
- **Epidemiologia:** Prevalência, incidência, distribuição geográfica, fatores de risco populacionais, tendências temporais
- **Enquadramento Nosológico:** Classificação segundo CID-11, classificações específicas da especialidade (NYHA para IC, Child-Pugh para cirrose, etc.)
- **Subtipos e Variantes:** Descreva todas as formas/classificações relevantes

## 2. BASES MORFOFUNCIONAIS (SEMPRE INCLUIR)

### 2.1 Anatomia Clínica
- **Anatomia Topográfica:** Localização precisa, sintopia com estruturas adjacentes
- **Anatomia Cirúrgica:** Acessos, marcos anatômicos, variações anatômicas comuns
- **Vascularização:** Artérias, veias, drenagem linfática - com nomes específicos
- **Inervação:** Nervos envolvidos, dermátomos, miótomos, reflexos associados
- **Correlação Clínica:** Como alterações anatômicas se manifestam clinicamente

### 2.2 Histologia e Ultraestrutura
- **Arquitetura Tecidual:** Organização microscópica, tipos celulares presentes
- **Ultraestrutura Celular:** Organelas relevantes, especializações de membrana
- **Matriz Extracelular:** Componentes, organização, função
- **Renovação e Reparo:** Células-tronco, capacidade regenerativa

### 2.3 Embriologia (quando relevante)
- **Origem Embrionária:** Folheto germinativo, estruturas precursoras
- **Cronologia do Desenvolvimento:** Semanas gestacionais críticas
- **Malformações Congênitas:** Principais defeitos e seus mecanismos
- **Correlação com Patologias do Adulto:** Resquícios embrionários, sítios de vulnerabilidade

### 2.4 Fisiologia Molecular e Sistêmica
- **Mecanismos Moleculares:** Receptores, vias de sinalização, segundos mensageiros
- **Canais Iônicos e Transportadores:** Tipos, distribuição, regulação
- **Regulação Hormonal:** Eixos endócrinos envolvidos, feedbacks positivos e negativos
- **Integração Sistêmica:** Como o órgão/sistema se comunica com outros sistemas
- **Homeostase:** Mecanismos de controle, set-points, compensações

## 3. FISIOPATOLOGIA DETALHADA

### 3.1 Etiologia Completa
- **Fatores Genéticos:** Genes envolvidos, padrões de herança, penetrância
- **Fatores Ambientais:** Agentes físicos, químicos, biológicos
- **Fatores Comportamentais:** Estilo de vida, hábitos de risco
- **Fatores Iatrógenos:** Medicamentos, procedimentos
- **Interação Gene-Ambiente:** Epigenética, susceptibilidade

### 3.2 Patogenia (CASCATA COMPLETA)
- **Evento Inicial:** O que desencadeia o processo patológico
- **Lesão Celular:** Mecanismos de dano (hipóxia, radicais livres, inflamação)
- **Resposta Inflamatória:** Mediadores, células envolvidas, cronologia
- **Remodelamento:** Fibrose, hipertrofia, atrofia, metaplasia
- **Disfunção Orgânica:** Como as alterações estruturais causam perda de função
- **Repercussões Sistêmicas:** Efeitos à distância, falência de múltiplos órgãos

### 3.3 Anatomia Patológica
- **Alterações Macroscópicas:** Tamanho, forma, cor, consistência
- **Alterações Microscópicas:** Padrões histopatológicos característicos
- **Imuno-histoquímica:** Marcadores diagnósticos
- **Estadiamento Patológico:** Quando aplicável

## 4. MANIFESTAÇÕES CLÍNICAS E SEMIOLOGIA

### 4.1 Quadro Clínico Detalhado
- **Sintomas Cardinais:** Com explicação fisiopatológica de CADA um
- **Sintomas Associados:** Manifestações secundárias
- **Cronologia:** Evolução temporal, formas agudas vs crônicas
- **Formas de Apresentação:** Típica, atípica, oligossintomática

### 4.2 Exame Físico
- **Inspeção:** O que observar, alterações características
- **Palpação:** Técnicas, achados normais vs patológicos
- **Percussão:** Quando aplicável, significado dos achados
- **Ausculta:** Sons normais vs patológicos, mecanismo de produção
- **Manobras Especiais:** Epônimos, técnica, interpretação

### 4.3 Correlação Semiologia-Fisiopatologia
Para CADA sinal/sintoma importante, explique:
- Por que ocorre (mecanismo fisiopatológico)
- Quando ocorre (fase da doença)
- O que indica (gravidade, prognóstico)

## 5. DIAGNÓSTICO

### 5.1 Diagnóstico Clínico
- **Critérios Diagnósticos:** Quando existem critérios formais, cite-os completamente
- **Diagnóstico Diferencial:** Lista organizada por probabilidade, como diferenciar

### 5.2 Exames Complementares
- **Laboratoriais:** Quais solicitar, valores de referência, alterações esperadas
- **Imagem:** Exames indicados, achados característicos
- **Funcionais:** Testes específicos, interpretação
- **Invasivos:** Biópsias, cateterismos, quando indicados

## 6. TRATAMENTO E MANEJO

### 6.1 Princípios Terapêuticos
- **Objetivos do Tratamento:** Cura, controle, paliação
- **Alvos Terapêuticos:** O que se busca modificar

### 6.2 Tratamento Não-Farmacológico
- **Mudanças de Estilo de Vida:** Dieta, exercício, cessação de tabagismo
- **Fisioterapia/Reabilitação:** Quando indicada
- **Suporte Psicológico:** Quando relevante

### 6.3 Tratamento Farmacológico
Para CADA classe de medicamento:
- **Mecanismo de Ação:** Como atua em nível molecular/celular
- **Indicações:** Quando usar
- **Posologia:** Doses usuais
- **Efeitos Adversos:** Principais, graves
- **Contraindicações:** Absolutas e relativas
- **Interações:** Medicamentosas e com alimentos

### 6.4 Tratamento Cirúrgico/Intervencionista
- **Indicações:** Quando operar
- **Técnicas:** Principais procedimentos
- **Complicações:** O que pode dar errado

### 6.5 Algoritmos de Tratamento
- **Primeira Linha:** O que usar inicialmente
- **Escalonamento:** Quando e como intensificar
- **Casos Refratários:** Opções alternativas

## 7. PROGNÓSTICO E COMPLICAÇÕES
- **História Natural:** O que acontece sem tratamento
- **Com Tratamento:** Expectativa com manejo adequado
- **Fatores Prognósticos:** O que determina boa vs má evolução
- **Complicações:** Agudas e crônicas, como prevenir

## 8. PREVENÇÃO
- **Prevenção Primária:** Evitar a doença
- **Prevenção Secundária:** Diagnóstico precoce
- **Prevenção Terciária:** Evitar complicações

## 9. REFERÊNCIAS BIBLIOGRÁFICAS (PADRÃO ACADÊMICO)
Cite as obras utilizadas, preferencialmente:
- **Ciências Básicas:** Guyton & Hall (Fisiologia), Silverthorn (Fisiologia Humana), Moore & Dalley (Anatomia), Junqueira & Carneiro (Histologia), Sadler (Langman - Embriologia), Lehninger (Bioquímica)
- **Patologia:** Robbins & Cotran (Bases Patológicas das Doenças), Bogliolo (Patologia)
- **Clínica Médica:** Harrison (Medicina Interna), Cecil (Goldman-Cecil Medicine), Braunwald (Cardiologia), Sabiston (Cirurgia)
- **Semiologia:** Porto (Semiologia Médica), Bates (Propedêutica Médica)
- **Farmacologia:** Goodman & Gilman, Katzung

# DIRETRIZES DE ESTILO E QUALIDADE

## Terminologia
- **PROIBIDO** uso de termos leigos. Use SEMPRE a terminologia médica correta:
  - "dispneia" não "falta de ar"
  - "odinofagia" não "dor ao engolir"
  - "hemoptise" não "tosse com sangue"
  - "hematêmese" não "vômito com sangue"

## Formatação
- Use **negrito** para termos-chave e conceitos importantes
- Use listas e sublistas para organização
- Use títulos e subtítulos claros
- Seja EXTENSO e DETALHADO

## Rigor Científico
- Cite números quando disponíveis (sensibilidade, especificidade, valores de referência)
- Mencione níveis de evidência quando relevante
- Se houver controvérsias na literatura, apresente ambos os lados

## IMPORTANTE
- NÃO seja superficial
- NÃO omita informações importantes
- NÃO use linguagem vaga
- SEMPRE explique os mecanismos por trás dos fenômenos
- SEMPRE correlacione teoria com prática clínica`;

const SEMINARIO_PROMPT = `# ROLE
Você é um Preceptor Acadêmico de Medicina de Excelência, especializado na metodologia PBL/APG. Sua missão é estruturar um ROTEIRO DE SLIDES PARA SEMINÁRIO com rigor científico, profundidade técnica e foco pedagógico, utilizando estritamente a literatura padrão-ouro.

# PRINCÍPIOS DO MODO SEMINÁRIO
1. **Didática Visual:** O conteúdo é dividido em slides individuais, cada um com material visual e script de apresentação.
2. **Profundidade Oral:** O "Script do Orador" deve conter a explicação técnica e profunda que o aluno dará verbalmente na frente da sala.
3. **Clinical Pearls:** Cada slide deve ter um detalhe prático ou correlação clínica de alto nível para o aluno brilhar.
4. **Praticidade:** O conteúdo visual deve ser curto e objetivo (bullet points), enquanto o script é extenso e detalhado.

# TASK LOGIC
1. **Diferenciação:** Identifique se o tema é MORFOFUNCIONAL (Básico) ou CLÍNICO (Patologia/Terapêutica).
2. **Priorização:** Responda prioritariamente aos [Objetivos da Sala]. Se ausentes, faça uma revisão completa.
3. **Formato:** Estruture TODA a resposta como slides numerados.

# ESTRUTURA DE RESPOSTA OBRIGATÓRIA

Para CADA slide, siga EXATAMENTE este formato:

---

## Slide X: [Título do Slide]

### 📊 Conteúdo Visual (O que colocar no slide)
- Bullet points curtos e objetivos (máximo 5-6 por slide)
- **Sugestão de Imagem/Gráfico:** Descreva exatamente qual imagem, esquema, gráfico ou tabela o aluno deve procurar e incluir no slide (ex: "Diagrama da alça pressão-volume do ciclo cardíaco - Guyton, Fig. 9-8")

### 🎤 Script do Orador (O que falar)
Texto técnico, fluido e detalhado que o aluno deve estudar para apresentar este slide. Use terminologia médica avançada. Cite fontes: "Segundo o Harrison..." ou "De acordo com Guyton...". Este parágrafo deve ter entre 150-300 palavras com profundidade real.

### 💡 Clinical Pearl
Um "pulo do gato", correlação clínica surpreendente, dica de prova ou detalhe prático de alto nível para o aluno brilhar na apresentação. Algo que diferencia quem sabe do tema superficialmente de quem domina.

---

# SEQUÊNCIA OBRIGATÓRIA DE SLIDES

## Slide 1: Capa
- Título do tema, nome da disciplina, data, autores

## Slide 2: Objetivos de Aprendizado
- O que o público deve aprender ao final do seminário

## Slide 3-4: Anatomia/Fisiologia de Base
- Estruturas anatômicas relevantes, fisiologia normal (se aplicável)

## Slides 5-8: Fisiopatologia (O Coração do Seminário)
- Etiologia, mecanismos de lesão, cascata fisiopatológica completa
- Esta é a parte mais importante e deve ter mais slides

## Slides 9-10: Quadro Clínico e Diagnóstico
- Manifestações clínicas com correlação fisiopatológica
- Exames complementares e critérios diagnósticos

## Slides 11-12: Conduta e Tratamento
- Tratamento não-farmacológico e farmacológico
- Mecanismos de ação dos fármacos

## Slide 13: Caso Clínico Integrador (BÔNUS)
- Crie um caso clínico curto que integre todo o conteúdo apresentado
- Inclua perguntas para discussão com a plateia

## Slide Final: Referências Bibliográficas
- Padrão ABNT/Vancouver

# REFERÊNCIAS BIBLIOGRÁFICAS (OBRIGATÓRIO)
- **Básico:** Guyton, Silverthorn, Moore ou Junqueira.
- **Clínico:** Harrison, Cecil, Robbins ou Goldman.
- **Semiologia:** Porto, Bates.
- **Farmacologia:** Goodman & Gilman, Katzung.

# DIRETRIZES DE RIGOR
- **Linguagem:** Use terminologia médica estrita (ex: 'dispneia' em vez de 'falta de ar', 'hemoptise' em vez de 'tosse com sangue').
- **Scannability:** Use Markdown, negritos e listas.
- **Neutralidade:** Se houver divergência acadêmica, cite as duas correntes.
- **Profundidade:** O Script do Orador NUNCA deve ser superficial. É a parte mais importante de cada slide.

## IMPORTANTE
- NÃO seja superficial no Script do Orador
- NÃO coloque texto extenso no "Conteúdo Visual" - slides devem ser visuais e curtos
- SEMPRE sugira imagens/gráficos específicos com referência à fonte
- SEMPRE inclua Clinical Pearl em CADA slide
- O Script deve conter informações que NÃO estão nos bullet points do slide`;

// Input validation constants
const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
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

    // Check subscription status
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("status, plan_type")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    // Check if user has admin role
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
    const { tema, objetivos, modo = "fechamento" } = body;
    
    // Validate tema
    if (!tema || typeof tema !== "string" || !tema.trim()) {
      return new Response(
        JSON.stringify({ error: "Tema é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tema.length > MAX_TEMA_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Tema deve ter no máximo ${MAX_TEMA_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate objetivos if provided
    if (objetivos !== undefined && objetivos !== null && typeof objetivos !== "string") {
      return new Response(
        JSON.stringify({ error: "Objetivos deve ser texto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (objetivos && objetivos.length > MAX_OBJETIVOS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Objetivos deve ter no máximo ${MAX_OBJETIVOS_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate modo
    const validModos = ["fechamento", "seminario"];
    const sanitizedModo = (typeof modo === "string" ? modo.toLowerCase().trim() : "fechamento");
    if (!validModos.includes(sanitizedModo)) {
      return new Response(
        JSON.stringify({ error: "Modo deve ser 'fechamento' ou 'seminario'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedTema = tema.trim().replace(/[\x00-\x1F\x7F]/g, "");
    const sanitizedObjetivos = objetivos ? objetivos.trim().replace(/[\x00-\x1F\x7F]/g, "") : "";

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Select system prompt based on mode
    const systemPrompt = sanitizedModo === "seminario" ? SEMINARIO_PROMPT : FECHAMENTO_PROMPT;

    // Build user prompt based on mode
    let userPrompt: string;
    
    if (sanitizedModo === "seminario") {
      userPrompt = `**Tema Central:** ${sanitizedTema}

Gere um ROTEIRO DE SLIDES COMPLETO para seminário acadêmico sobre este tema. Cada slide deve conter Conteúdo Visual, Script do Orador e Clinical Pearl. Siga a estrutura obrigatória de slides.`;
    } else {
      userPrompt = `**Tema Central:** ${sanitizedTema}

Gere um fechamento de APG COMPLETO, EXTENSO e PROFUNDO sobre este tema. Não seja superficial. Cubra TODOS os aspectos relevantes com máxima profundidade técnica.`;
    }
    
    if (sanitizedObjetivos) {
      userPrompt += `

**Objetivos de Aprendizado Específicos:**
${sanitizedObjetivos}

ATENÇÃO: Além da estrutura padrão, certifique-se de responder EXAUSTIVAMENTE a cada um dos objetivos listados acima.`;
    }

    // Call Google Gemini API directly with SSE streaming
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Quota da API do Google excedida ou API key inválida. Verifique sua chave no Google AI Studio." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Google Gemini SSE format to OpenAI-compatible format
    // so the frontend doesn't need any changes
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
              // Re-emit in OpenAI-compatible format
              const openAiChunk = {
                choices: [{ delta: { content } }],
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(openAiChunk)}\n\n`)
              );
            }
          } catch {
            // Ignore parse errors for partial chunks
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
    console.error("generate-fechamento error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
