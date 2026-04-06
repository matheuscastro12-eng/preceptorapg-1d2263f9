import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check subscription or admin
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const { data: adminRole } = await supabase
      .rpc("has_role", { _user_id: userId, _role: "admin" });

    if (!sub && !adminRole) {
      return new Response(
        JSON.stringify({ error: "Assinatura ativa necessária" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const { content, tema } = await req.json();

    if (!content || typeof content !== "string" || content.length < 50) {
      return new Response(
        JSON.stringify({ error: "Conteúdo do seminário é obrigatório (mínimo 50 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (content.length > 100000) {
      return new Response(
        JSON.stringify({ error: "Conteúdo excede o limite máximo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const manusApiKey = Deno.env.get("MANUS_API_KEY");
    if (!manusApiKey) {
      return new Response(
        JSON.stringify({ error: "Chave da API do Manus não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt for Manus
    const manusPrompt = `Crie uma apresentação de slides profissional em formato PPTX sobre o tema médico/acadêmico abaixo.

INSTRUÇÕES:
- Design limpo e profissional, adequado para apresentação acadêmica/médica
- Use cores sóbrias e profissionais (azul escuro, branco, cinza)
- Cada seção do conteúdo deve virar 2-3 slides
- Inclua slide de título, sumário, e slide final com referências
- Use bullet points concisos nos slides (não copie parágrafos inteiros)
- Adicione elementos visuais quando apropriado (ícones, diagramas simples)
- O conteúdo está em português brasileiro, mantenha o idioma

TEMA: ${tema || "Seminário Médico"}

CONTEÚDO COMPLETO PARA BASE DOS SLIDES:
${content}`;

    // Send to Manus API
    const manusResponse = await fetch("https://api.manus.ai/v1/tasks", {
      method: "POST",
      headers: {
        "API_KEY": manusApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: manusPrompt,
        agentProfile: "manus-1",
      }),
    });

    if (!manusResponse.ok) {
      const errorText = await manusResponse.text();
      console.error("Manus API error:", manusResponse.status, errorText);

      if (manusResponse.status === 401 || manusResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave da API do Manus inválida ou sem permissão" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (manusResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições do Manus atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao criar tarefa no Manus. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const manusData = await manusResponse.json();
    console.log("Manus task created:", JSON.stringify(manusData));

    // Extract task URL - Manus returns task_id and we build the URL
    const taskId = manusData.task_id || manusData.id;
    const taskUrl = manusData.task_url || `https://manus.im/share/${taskId}`;

    return new Response(
      JSON.stringify({
        task_id: taskId,
        task_url: taskUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("send-to-manus error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
