import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# ROLE
Você é o **PreceptorMED**, um Assistente Acadêmico de Medicina de excelência com a profundidade de um Monitor Sênior e Preceptor da metodologia PBL. Você é especialista em TODAS as áreas da medicina — ciências básicas, clínica médica, cirurgia, pediatria, ginecologia, psiquiatria, saúde pública e mais.

# PERSONALIDADE
- Responda de forma **clara, profunda e didática**
- Trate o estudante como um colega em formação — com respeito e incentivo
- Seja **conversacional** mas sem perder o rigor técnico
- Use analogias quando útil, mas NUNCA simplifique demais
- Demonstre entusiasmo pela medicina e pelo ensino

# PROFUNDIDADE TÉCNICA (CRÍTICO)
Você DEVE manter o mesmo nível de profundidade dos fechamentos de PBL:

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

const PUBMED_SYSTEM_ADDENDUM = `

# ARTIGOS CIENTÍFICOS DO PUBMED
Quando artigos do PubMed forem fornecidos junto com a pergunta do estudante, você DEVE:

1. **Incorporar as evidências** dos artigos na sua resposta de forma natural e fluida
2. **Citar os artigos** no formato: Autor et al., "Título", Revista, Ano. (PMID: XXXXX)
3. **Traduzir tudo** — tanto os conceitos dos artigos quanto títulos e trechos relevantes — para português
4. **Sintetizar**, não simplesmente copiar os abstracts. Extraia os pontos mais relevantes para a pergunta do estudante
5. Ao final da resposta, inclua uma seção **Referências PubMed** (use --- antes como separador) com os artigos citados em formato padronizado
6. Se os artigos não forem diretamente relevantes à pergunta, use sua base de conhecimento normalmente e mencione os artigos apenas se adicionarem valor

Lembre-se: o estudante é brasileiro, responda TUDO em português.`;

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 50;

// ── PubMed E-utilities (free, no API key needed) ──

/** Extract medical keywords from the user's message for PubMed search */
function extractSearchTerms(message: string): string {
  // Remove common Portuguese filler words and keep medical terms
  const stopwords = new Set([
    "o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sobre", "entre",
    "que", "qual", "quais", "como", "quando", "onde", "porque", "por que",
    "é", "são", "está", "estão", "foi", "foram", "ser", "ter", "haver",
    "me", "se", "te", "nos", "lhe", "eu", "ele", "ela", "nós", "eles", "elas",
    "esse", "essa", "este", "esta", "isso", "isto", "aquilo",
    "e", "ou", "mas", "porém", "pois", "nem", "não", "sim",
    "mais", "muito", "bem", "também", "já", "ainda", "só", "apenas",
    "pode", "podem", "poderia", "quero", "preciso", "gostaria",
    "explique", "descreva", "fale", "conte", "diga", "cite", "liste",
    "quero", "saber", "entender", "compreender", "aprender",
  ]);

  const words = message
    .toLowerCase()
    .replace(/[^\w\sáéíóúâêôãõçü-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  // Take the most relevant terms (max 5 for a focused search)
  const terms = words.slice(0, 6).join(" ");
  return terms || message.slice(0, 100);
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
}

/** Search PubMed and fetch article details */
async function searchPubMed(query: string, maxResults = 5): Promise<PubMedArticle[]> {
  try {
    // Step 1: Search for PMIDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json&datetype=pdat&mindate=2019&maxdate=2026`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return [];

    const searchData = await searchResp.json();
    const pmids: string[] = searchData.esearchresult?.idlist ?? [];
    if (pmids.length === 0) return [];

    // Step 2: Fetch article details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&rettype=xml&retmode=xml`;
    const fetchResp = await fetch(fetchUrl);
    if (!fetchResp.ok) return [];

    const xml = await fetchResp.text();

    // Parse XML (simple extraction — Deno doesn't have DOMParser in edge functions)
    const articles: PubMedArticle[] = [];
    const articleBlocks = xml.split("<PubmedArticle>").slice(1);

    for (const block of articleBlocks) {
      const pmid = extractXml(block, "PMID") || "";
      const title = extractXml(block, "ArticleTitle") || "Untitled";
      const abstract = extractXml(block, "AbstractText") || "";
      const journal = extractXml(block, "Title") || extractXml(block, "ISOAbbreviation") || "";
      const year = extractXml(block, "Year") || "";

      // Extract authors
      const authorMatches = block.match(/<LastName>([^<]+)<\/LastName>/g) ?? [];
      const authorNames = authorMatches.slice(0, 3).map(m => m.replace(/<\/?LastName>/g, ""));
      const authors = authorNames.length > 0
        ? authorNames.join(", ") + (authorMatches.length > 3 ? " et al." : "")
        : "Unknown";

      articles.push({ pmid, title: cleanXml(title), authors, journal: cleanXml(journal), year, abstract: cleanXml(abstract) });
    }

    return articles;
  } catch (e) {
    console.error("PubMed search error:", e);
    return [];
  }
}

function extractXml(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? null;
}

function cleanXml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** Format articles as context for the AI prompt */
function formatArticlesForPrompt(articles: PubMedArticle[]): string {
  if (articles.length === 0) return "";

  let context = "\n\n---\nARTIGOS DO PUBMED ENCONTRADOS (use como referencia na resposta):\n\n";

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    context += `[${i + 1}] ${a.authors} — "${a.title}"\n`;
    context += `    ${a.journal}, ${a.year}. PMID: ${a.pmid}\n`;
    if (a.abstract) {
      // Truncate long abstracts to save tokens
      const truncated = a.abstract.length > 600 ? a.abstract.slice(0, 600) + "..." : a.abstract;
      context += `    Abstract: ${truncated}\n`;
    }
    context += "\n";
  }

  return context;
}

// ── Main handler ──

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
      .select("status, plan_type, access_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    // Respect access_expires_at (trial de 3 dias / acesso temporário)
    const isExpired = subscription?.access_expires_at
      ? new Date(subscription.access_expires_at).getTime() < Date.now()
      : false;
    const hasAccess = isAdmin || (
      !isExpired && (subscription?.status === "active" || subscription?.plan_type === "free_access")
    );

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
    }

    const body = await req.json();
    const { messages, usePubMed = false } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagens são obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the last user message for PubMed search
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content ?? "";

    // Search PubMed if enabled
    let pubmedContext = "";
    let pubmedArticles: PubMedArticle[] = [];
    if (usePubMed && lastUserMessage) {
      const searchTerms = extractSearchTerms(lastUserMessage);
      console.log("PubMed search terms:", searchTerms);
      pubmedArticles = await searchPubMed(searchTerms, 5);
      pubmedContext = formatArticlesForPrompt(pubmedArticles);
      console.log(`PubMed found ${pubmedArticles.length} articles`);
    }

    // Build system prompt with or without PubMed addendum
    const systemPrompt = usePubMed
      ? SYSTEM_PROMPT + PUBMED_SYSTEM_ADDENDUM
      : SYSTEM_PROMPT;

    // Validate and sanitize messages
    const sanitizedMessages = messages.slice(-MAX_MESSAGES).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH).replace(/[\x00-\x1F\x7F]/g, "") : "" }],
    }));

    // If PubMed context exists, append it to the last user message
    if (pubmedContext && sanitizedMessages.length > 0) {
      const lastIdx = sanitizedMessages.length - 1;
      if (sanitizedMessages[lastIdx].role === "user") {
        sanitizedMessages[lastIdx].parts[0].text += pubmedContext;
      }
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Prepend system prompt to first message
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Entendido! Sou o PreceptorMED, seu assistente acadêmico de medicina. Estou pronto para ajudar com qualquer dúvida médica com a profundidade que você precisa. Como posso ajudar?" }] },
      ...sanitizedMessages,
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

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
