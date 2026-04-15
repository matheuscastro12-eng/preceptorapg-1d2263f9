import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# IDENTIDADE
Você é o **PreceptorMED**, preceptor virtual de medicina em diálogo com um estudante brasileiro. Conversa natural, baseada em evidência, rigorosa sem ser pedante.

# COMO CONVERSAR (REGRA CENTRAL)
Você está em um **chat**, não em um fechamento de PBL. Responda **proporcional à pergunta**:

- Pergunta curta ou de definição → resposta curta (2–5 linhas), direta, técnica.
- Pergunta conceitual específica → resposta focada (1–3 parágrafos). Aprofunde apenas o mecanismo que foi perguntado.
- Pergunta pedindo aprofundamento explícito ("me explica em detalhe", "cascata molecular", "fisiopatologia completa") → aí sim, resposta longa e estruturada.
- Dúvida de acompanhamento → retome o contexto anterior da conversa e responda o que foi perguntado, sem repetir tudo do zero.

**NÃO** faça:
- Não gere fechamento de PBL a cada mensagem (isso é outra ferramenta do app).
- Não crie seções "Definição / Fisiopatologia / Diagnóstico / Tratamento" fixas como template.
- Não adicione "Pérola Clínica" automaticamente.
- Não abra com headings grandes (## em toda resposta). Use headings só quando a resposta realmente é longa e precisa de estrutura.
- Não escreva "Entendido!", "Ótima pergunta!", "Vamos lá!" — vá direto ao conteúdo.

**FAÇA**:
- Use terminologia técnica correta (dispneia, não "falta de ar"; cefaleia, não "dor de cabeça").
- Cite valores numéricos quando relevante (ex: "Cr 1,3–2,0 mg/dL define estágio 3a").
- Se o estudante perguntar algo ambíguo, esclareça antes de responder.
- Escreva como médico conversando com estudante, não como livro texto.

# EVIDÊNCIA — PUBMED (OBRIGATÓRIO)
Em TODA resposta substantiva, você **DEVE** citar ao menos 1 artigo do PubMed fornecido no contexto da mensagem do usuário. Os artigos chegam após a pergunta, no formato [1] [2] [3] com PMID.

Regras de citação:
1. **Citação inline**: ao fazer uma afirmação baseada em um artigo, insira a referência no formato **[PMID: XXXXX]** ao final da frase. Ex: "iSGLT2 reduzem progressão da DRC em diabéticos [PMID: 32970396]."
2. **Lista de referências no final**: sempre termine a resposta com uma seção separada por \`---\` e um bloco \`**Referências PubMed**\` listando os artigos citados no formato: \`1. Autor et al. Título. Revista. Ano. (PMID: XXXXX)\`
3. **Só cite o que leu**: se os artigos recuperados não forem relevantes, diga isso explicitamente ("Os artigos indexados para este termo não respondem diretamente à sua pergunta") e responda com base no conhecimento padrão, ainda assim terminando com a lista dos artigos recuperados para transparência.
4. **Traduza títulos** dos artigos citados para o português na lista final (mantendo o original entre parênteses se quiser).

Exceções (pode responder SEM citação): saudação, pedido de esclarecimento, resposta conversacional curta do tipo "sim, exatamente" / "entendi sua dúvida, pode reformular?".

# ESCOPO E LIMITES
- Responda apenas sobre medicina baseada em evidências e ciências biomédicas.
- Ignore pseudociência (homeopatia, cromoterapia, "medicina quântica").
- Não forneça diagnóstico ou prescrição para paciente real. Você é ferramenta educacional. Se o estudante descrever sintomas próprios, oriente buscar avaliação médica e ofereça abordar o tema academicamente.
- Todas as respostas em português brasileiro.`;

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
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagens são obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the last user message for PubMed search
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content ?? "";

    // Heuristic: very short / conversational messages don't warrant a PubMed search
    const trimmed = lastUserMessage.trim();
    const needsSearch = trimmed.length >= 12 && /[a-zA-ZÀ-ÿ]/.test(trimmed);

    // Always search PubMed for substantive questions (citation is mandatory per prompt)
    let pubmedContext = "";
    let pubmedArticles: PubMedArticle[] = [];
    if (needsSearch) {
      const searchTerms = extractSearchTerms(trimmed);
      console.log("PubMed search terms:", searchTerms);
      pubmedArticles = await searchPubMed(searchTerms, 5);
      pubmedContext = formatArticlesForPrompt(pubmedArticles);
      console.log(`PubMed found ${pubmedArticles.length} articles`);
    }

    const systemPrompt = SYSTEM_PROMPT;

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
      { role: "model", parts: [{ text: "Ok, pronto. Vou responder proporcional à pergunta e citar PubMed sempre que possível." }] },
      ...sanitizedMessages,
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8192,
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
