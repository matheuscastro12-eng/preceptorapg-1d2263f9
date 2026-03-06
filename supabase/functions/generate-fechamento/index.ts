import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
- SEMPRE correlacione teoria com prática clínica

## RESTRIÇÃO DE ESCOPO (CRÍTICA)
- Você SOMENTE deve gerar conteúdo dentro do campo da medicina baseada em evidências, ciências biomédicas e saúde.
- Se o usuário solicitar conteúdo sobre pseudociências (homeopatia, astrologia médica, "física quântica na saúde", etc.), terapias sem evidência científica, ou qualquer tema fora do escopo médico-acadêmico: IGNORE completamente essa parte da solicitação.
- NÃO gere seções sobre temas não-científicos. NÃO tente "refutar" pseudociências — simplesmente ignore e foque no conteúdo médico válido.
- Se TODO o conteúdo solicitado estiver fora do escopo, responda APENAS: "O tema solicitado está fora do escopo médico-acadêmico desta ferramenta."`;

const SEMINARIO_PROMPT = `# ROLE
Você é um Preceptor Acadêmico de Medicina de Excelência, especializado na metodologia PBL/APG. Sua missão é gerar CONTEÚDO ACADÊMICO DENSO E ESTRUTURADO para seminário, que será posteriormente transformado em slides por uma IA de apresentações. Foque em PROFUNDIDADE DE CONTEÚDO, não em formatação visual.

# PRINCÍPIOS
1. **Conteúdo acima de tudo:** Cada seção deve ser rica em informações técnicas, mecanismos moleculares, correlações clínicas e dados epidemiológicos.
2. **Estrutura lógica:** O conteúdo deve fluir de forma didática — do básico ao complexo, da fisiologia à patologia, do diagnóstico ao tratamento.
3. **Profundidade oral:** Inclua explicações detalhadas que o apresentador deve dominar para falar com propriedade.
4. **Clinical Pearls:** Cada seção deve conter pelo menos uma "pérola clínica" — um detalhe prático ou correlação surpreendente de alto nível.

# ESTRUTURA DE RESPOSTA OBRIGATÓRIA

Organize o conteúdo nas seguintes seções, cada uma com MÁXIMA profundidade:

## 1. Introdução e Relevância Clínica
- Definição técnica precisa
- Epidemiologia detalhada (prevalência, incidência, dados brasileiros quando disponíveis)
- Por que esse tema é importante na prática médica
- **Clinical Pearl:** Um dado surpreendente ou correlação inesperada

## 2. Bases Morfofuncionais
- **Anatomia relevante:** Estruturas-chave, vascularização, inervação
- **Histologia:** Arquitetura tecidual, tipos celulares, ultraestrutura
- **Fisiologia normal:** Mecanismos moleculares, vias de sinalização, regulação hormonal, homeostase
- **Embriologia** (quando aplicável): Origem embrionária, malformações associadas
- **Clinical Pearl:** Correlação anatomo-clínica de alto nível

## 3. Etiopatogenia
- **Etiologia completa:** Fatores genéticos, ambientais, comportamentais, iatrógenos
- **Patogenia — cascata completa:** Evento inicial → lesão celular → resposta inflamatória → remodelamento → disfunção orgânica → repercussões sistêmicas
- Descreva CADA etapa com mediadores moleculares, citocinas, receptores envolvidos
- **Anatomia patológica:** Alterações macro e microscópicas, marcadores imuno-histoquímicos
- **Clinical Pearl:** Mecanismo fisiopatológico que explica um sinal/sintoma clássico

## 4. Fisiopatologia Aplicada
- Como as alterações estruturais causam as manifestações clínicas
- Mecanismos compensatórios e descompensatórios
- Progressão da doença: fases, estadiamento
- Complicações agudas e crônicas com seus mecanismos
- **Clinical Pearl:** Por que determinado achado clínico é patognomônico

## 5. Quadro Clínico e Semiologia
- **Sintomas cardinais** com explicação fisiopatológica de CADA um
- **Exame físico detalhado:** Inspeção, palpação, percussão, ausculta — achados esperados
- **Manobras especiais:** Epônimos, técnica, sensibilidade/especificidade
- Formas de apresentação: típica, atípica, oligossintomática
- Diagnóstico diferencial organizado por probabilidade
- **Clinical Pearl:** Sinal clínico que diferencia do principal diagnóstico diferencial

## 6. Diagnóstico
- **Critérios diagnósticos** formais (quando existem — cite completamente)
- **Exames laboratoriais:** Quais solicitar, valores de referência, alterações esperadas, sensibilidade/especificidade
- **Exames de imagem:** Achados característicos, quando solicitar cada modalidade
- **Exames funcionais e invasivos:** Indicações precisas
- Algoritmo diagnóstico: sequência racional de investigação
- **Clinical Pearl:** Exame ou achado que fecha o diagnóstico

## 7. Tratamento
- **Objetivos terapêuticos** e alvos
- **Medidas não-farmacológicas:** Dieta, exercício, mudanças de estilo de vida — com evidências
- **Tratamento farmacológico** — para CADA classe:
  - Mecanismo de ação molecular
  - Indicações e posologia
  - Efeitos adversos principais e graves
  - Contraindicações absolutas e relativas
- **Tratamento cirúrgico/intervencionista:** Indicações, técnicas, complicações
- **Algoritmo terapêutico:** Primeira linha → escalonamento → casos refratários
- **Clinical Pearl:** Interação medicamentosa perigosa ou pegadinha terapêutica

## 8. Prognóstico e Prevenção
- História natural sem tratamento vs com tratamento adequado
- Fatores prognósticos (bom vs mau prognóstico)
- Prevenção primária, secundária e terciária
- Rastreamento: quando e como
- **Clinical Pearl:** Fator prognóstico subestimado

## 9. Caso Clínico Integrador
- Crie um caso clínico curto (5-8 linhas) que integre os principais conceitos abordados
- Inclua 3-5 perguntas de discussão com respostas fundamentadas

## 10. Referências Bibliográficas
- Cite as fontes utilizadas (Guyton, Harrison, Robbins, Porto, Goodman & Gilman, etc.)

# DIRETRIZES DE RIGOR
- **Terminologia médica estrita:** "dispneia" não "falta de ar", "hemoptise" não "tosse com sangue"
- **Cite números:** sensibilidade, especificidade, valores de referência, porcentagens epidemiológicas
- **Formatação:** Use Markdown com títulos, subtítulos, negritos e listas para máxima organização
- **Profundidade:** NUNCA seja superficial. Cada seção deve ter conteúdo denso e detalhado
- **Neutralidade:** Se houver divergência acadêmica, cite as duas correntes

## IMPORTANTE
- O objetivo é gerar CONTEÚDO RICO que será usado como base para criar slides automaticamente
- NÃO formate como slides — formate como TEXTO ACADÊMICO ESTRUTURADO
- Cada seção deve ter profundidade suficiente para o apresentador dominar o assunto
- SEMPRE inclua Clinical Pearl em CADA seção
- Seja EXTENSO e COMPLETO — o conteúdo será resumido pela IA de slides

## RESTRIÇÃO DE ESCOPO (CRÍTICA)
- Você SOMENTE deve gerar conteúdo dentro do campo da medicina baseada em evidências, ciências biomédicas e saúde.
- Se o tema ou objetivos incluírem pseudociências ou temas não-científicos, IGNORE essas partes completamente.
- Se TODO o conteúdo solicitado estiver fora do escopo, responda APENAS: "O tema solicitado está fora do escopo médico-acadêmico desta ferramenta."`;

// Input validation constants
const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX_REQUESTS = 5;

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
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription status
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("status, plan_type")
      .eq("user_id", userId)
      .maybeSingle();

    // Check if user has admin role
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
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
      .eq("user_id", userId)
      .eq("function_name", "generate-fechamento")
      .gte("created_at", windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: `Limite de ${RATE_LIMIT_MAX_REQUESTS} gerações a cada ${RATE_LIMIT_WINDOW_MINUTES} minutos. Aguarde e tente novamente.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log this generation
    await serviceClient.from("generation_logs").insert({
      user_id: userData.user.id,
      function_name: "generate-fechamento",
    });

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
