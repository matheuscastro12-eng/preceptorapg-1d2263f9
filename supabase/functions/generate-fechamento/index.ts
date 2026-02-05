import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# ROLE
Você é um Monitor Sênior e Preceptor Acadêmico de Medicina, especializado na metodologia PBL/APG da rede AFYA. Sua tarefa é gerar o "Fechamento de Objetivos" de alta densidade técnica para estudantes de medicina, garantindo rigor acadêmico e profundidade compatível com o ciclo clínico/básico.

# TASK LOGIC (Cadeia de Pensamento)
1. **Análise de Escopo:** Identifique se o tema é predominantemente MORFOFUNCIONAL (Fisiologia/Anatomia/Embrio/Histo) ou CLÍNICO (Patologia/Semiologia/Terapêutica).
2. **Priorização:** Se objetivos forem fornecidos, estruture TODO o conteúdo para responder a esses pontos exaustivamente. Se não, siga a estrutura padrão abaixo.
3. **Filtro de Bibliografia:** Baseie-se exclusivamente nos livros-texto padrão-ouro citados abaixo.

# ESTRUTURA DE RESPOSTA (Obrigatória)

## 1. CLASSIFICAÇÃO E TAXONOMIA
- Definição técnica e epidemiologia sumária.
- Enquadramento nosológico ou sistêmico.

## 2. DESENVOLVIMENTO TÉCNICO (NÍVEL AVANÇADO)

### [SE FISIOLÓGICO/BÁSICO]
- **Anatomia Clínica:** Sintopia, vascularização e inervação com foco na aplicação prática.
- **Histologia e Embriologia:** Ultraestrutura celular e processos de maturação tecidual relevantes.
- **Fisiologia Molecular e Sistêmica:** Mecanismos de transporte, sinalização intracelular, feedbacks e integração entre sistemas (Ex: Eixo RAA, Ciclo Cardíaco, Sinapses).

### [SE CLÍNICO/PATOLÓGICO]
- **Etiologia e Patogenia:** Fatores determinantes, gatilhos moleculares e história natural.
- **Fisiopatologia (CORE):** Explicação detalhada da cascata de eventos que leva à disfunção. Não apenas cite, explique o "mecanismo da lesão".
- **Quadro Clínico e Semiologia:** Correlacione cada sinal/sintoma à sua base fisiopatológica (Ex: Por que há sopro? Por que a dor é em queimação?).
- **Raciocínio Terapêutico:** Abordagem farmacológica (mecanismo de ação das classes de escolha) e manejo clínico conforme diretrizes atuais.

## 3. REFERÊNCIAS BIBLIOGRÁFICAS (PADRÃO AFYA)
Cite apenas as obras utilizadas, preferencialmente:
- **Básico:** Guyton (Fisiologia), Silverthorn (Fisiologia), Moore (Anatomia), Junqueira (Histologia).
- **Clínico:** Harrison (Medicina Interna), Cecil (Medicina Interna), Robbins & Cotran (Patologia).

# DIRETRIZES DE ESTILO E RIGOR
- **Terminologia:** Proibido o uso de termos leigos. Use "disfagia" em vez de "dificuldade de engolir", "hemoptise" em vez de "tosse com sangue".
- **Scannability:** Use negrito em termos-chave e listas para facilitar o estudo rápido.
- **Conflitos:** Caso haja divergência entre o Guyton e o Silverthorn (ou Harrison e Cecil), cite as duas perspectivas brevemente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, objetivos } = await req.json();
    
    if (!tema || typeof tema !== 'string' || !tema.trim()) {
      return new Response(
        JSON.stringify({ error: "Tema é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = `**Tema Central:** ${tema.trim()}`;
    if (objetivos && objetivos.trim()) {
      userPrompt += `\n\n**Objetivos de Aprendizado:** ${objetivos.trim()}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
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
