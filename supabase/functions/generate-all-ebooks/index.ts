import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENAMED_SPECIALTIES = [
  { id: 'pediatria', name: 'Pediatria', topics: ['Puericultura e Imunizações', 'Neonatologia (Icterícia, Sepse Neonatal, Cuidados)', 'Pneumologia Pediátrica (Asma, Pneumonias)', 'Aleitamento Materno', 'Diarreia e Desidratação', 'Febre Reumática', 'Infecções Congênitas', 'Distúrbios Respiratórios do Período Neonatal'] },
  { id: 'cirurgia', name: 'Cirurgia', topics: ['Trauma (ATLS): Avaliação Inicial, Vias Aéreas, Trauma Torácico', 'Urgências Abdominais (Abdome Agudo)', 'Cirurgia Infantil', 'Urologia Cirúrgica', 'Complicações Pós-operatórias', 'Trauma Abdominal e Pélvico', 'Vesícula e Vias Biliares', 'Proctologia', 'Queimaduras e Trauma Elétrico'] },
  { id: 'preventiva', name: 'Preventiva / Saúde Coletiva', topics: ['Epidemiologia (Medidas de Saúde Coletiva, Estudos)', 'SUS (Políticas de Saúde, APS, Atenção Primária)', 'Ética Médica', 'Medicina de Família e Comunidade', 'Saúde do Trabalhador', 'Vigilância em Saúde', 'Saúde do Idoso', 'Sistemas de Informação em Saúde'] },
  { id: 'obstetricia', name: 'Obstetrícia', topics: ['Distúrbios Hipertensivos da Gestação (Pré-eclâmpsia, Eclâmpsia)', 'Sangramento da 1ª e 2ª Metade da Gestação', 'Pré-natal', 'Diabetes na Gestação', 'Sífilis na Gestação e Sífilis Congênita', 'Assistência ao Parto e Partograma', 'Vitalidade Fetal', 'Hemorragia Pós-parto (HPP)'] },
  { id: 'ginecologia', name: 'Ginecologia', topics: ['Rastreamento do Câncer de Colo Uterino', 'Planejamento Familiar e Contracepção', 'Vulvovaginites e ISTs', 'Sangramento Uterino Anormal (SUA)', 'Rastreamento do Câncer de Mama', 'Assistência à Vítima de Violência Sexual', 'Endometriose e Adenomiose', 'Climatério e Terapia Hormonal'] },
  { id: 'infectologia', name: 'Infectologia', topics: ['Arboviroses (Dengue, Chikungunya, Zika)', 'Tuberculose (Diagnóstico, Esquemas, Resistência)', 'HIV/AIDS', 'Meningites e Meningoencefalites', 'Parasitoses Intestinais', 'Pneumonias Bacterianas', 'Raiva, Tétano, Mordedura e Arranhadura', 'Hepatoesplenomegalias Crônicas'] },
  { id: 'gastroenterologia', name: 'Gastroenterologia', topics: ['Doença Ulcerosa Péptica e H. pylori', 'Neoplasias do Sistema Digestivo (Pâncreas, Estômago, Esôfago)', 'Doença Inflamatória Intestinal', 'Pancreatite Aguda e Crônica', 'DRGE e Esofagites', 'Hemorragia Digestiva Alta e Baixa', 'Pólipos e Neoplasias Intestinais'] },
  { id: 'endocrinologia', name: 'Endocrinologia', topics: ['Diabetes Mellitus (Insulinoterapia, Complicações Agudas CAD/EHH)', 'DM Tipo 2 (Tratamento, Complicações Crônicas)', 'Tireoide (Tireotoxicose, Hipotireoidismo)', 'Obesidade e Síndrome Metabólica', 'Osteoporose', 'Adrenal'] },
  { id: 'psiquiatria', name: 'Psiquiatria', topics: ['Dependência Química', 'Transtornos de Humor (Depressão, Bipolar)', 'Intoxicações Exógenas', 'Psiquiatria Infantil (TOD, TDAH)', 'Transtornos de Ansiedade', 'Psicofarmacologia', 'Reforma Psiquiátrica', 'Transtornos Alimentares'] },
  { id: 'cardiologia', name: 'Cardiologia', topics: ['HAS (Tratamento, Complicações, Metas)', 'Arritmias (FA, Flutter Atrial, Taquiarritmias)', 'Síndromes Coronarianas Agudas (IAM, SCASSST)', 'PCR (Parada Cardiorrespiratória)', 'Insuficiência Cardíaca', 'Valvopatias', 'Dislipidemia e Risco Cardiovascular'] },
  { id: 'neurologia', name: 'Neurologia', topics: ['Coma e Alterações da Consciência', 'Cefaleias', 'AVC (Isquêmico e Hemorrágico)', 'Traumatismo Cranioencefálico', 'Distúrbios do Movimento (Parkinson)', 'Epilepsias', 'Demências', 'Doenças Neuromusculares'] },
  { id: 'nefrologia', name: 'Nefrologia', topics: ['ITU (Infecção do Trato Urinário)', 'Glomerulopatias (Síndromes Nefrítica e Nefrótica)', 'Doença Renal Crônica', 'Lesão Renal Aguda', 'Distúrbios Ácido-base', 'Distúrbios do Potássio e Disnatremias', 'Nefrolitíase'] },
  { id: 'hematologia', name: 'Hematologia', topics: ['Anemias Hemolíticas e Hemoglobinopatias', 'Linfomas e Leucemias', 'Hemostasia e Coagulopatias', 'Anemias Macrocíticas e Microcíticas', 'Medicina Transfusional', 'Gamopatias Monoclonais'] },
  { id: 'pneumologia', name: 'Pneumologia', topics: ['Asma', 'DPOC', 'Derrame Pleural e Pneumotórax', 'Câncer de Pulmão', 'TEP (Tromboembolismo Pulmonar)', 'Pneumopatias Intersticiais'] },
  { id: 'reumatologia', name: 'Reumatologia', topics: ['LES (Lúpus Eritematoso Sistêmico)', 'Espondilite Anquilosante', 'Artrite Reumatoide', 'Artrites Infecciosas', 'Artrites Microcristalinas (Gota)', 'Vasculites', 'Fibromialgia'] },
  { id: 'dermatologia', name: 'Dermatologia', topics: ['Dermatoses Infecciosas', 'Câncer de Pele', 'Hanseníase', 'Dermatoses Eczematosas', 'Farmacodermias'] },
  { id: 'hepatologia', name: 'Hepatologia', topics: ['Hepatites Virais (A, B, C)', 'Complicações da Cirrose Hepática', 'Hepatopatias Autoimunes', 'Tumores Hepáticos', 'Hepatite Fulminante'] },
  { id: 'ortopedia', name: 'Ortopedia', topics: ['Doenças da Coluna Vertebral', 'Fraturas e Luxações', 'Politrauma Ortopédico', 'Ortopedia Pediátrica (Quadril, Coluna)', 'Osteomielite'] },
  { id: 'orl', name: 'Otorrinolaringologia', topics: ['Infecções de Vias Aéreas Superiores (Sinusite, Otite, Faringite)', 'Epistaxe', 'Corpo Estranho Nasal', 'Linfadenites Cervicais'] },
  { id: 'oftalmologia', name: 'Oftalmologia', topics: ['Síndrome do Olho Vermelho', 'Glaucoma', 'Trauma Ocular', 'Distúrbios de Refração', 'Neuroftalmologia'] },
];

const SYSTEM_PROMPT = `# ROLE
Você é um Professor Titular de Medicina e Preceptor de Residência Médica, especialista em preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica). Sua tarefa é gerar um RESUMO COMPLETO e EXTREMAMENTE DETALHADO da especialidade solicitada, cobrindo TODOS os tópicos mais cobrados no ENAMED/INEP.

# OBJETIVO
Criar um material de estudo definitivo para o ENAMED — denso, técnico, completo — que cubra TODOS os tópicos listados com profundidade suficiente para o estudante acertar qualquer questão da prova.

# ESTRUTURA OBRIGATÓRIA

Para CADA TÓPICO da especialidade, desenvolva:

## [Nome do Tópico]

### Definição e Conceitos-Chave
- Definição técnica precisa
- Classificações e subtipos relevantes
- Epidemiologia (dados brasileiros quando disponíveis)

### Fisiopatologia
- Mecanismo fisiopatológico detalhado
- Cascata de eventos desde a etiologia até as manifestações

### Quadro Clínico
- Sintomas e sinais cardinais (com explicação fisiopatológica)
- Formas de apresentação (típica e atípica)
- Red flags e sinais de alarme

### Diagnóstico
- Critérios diagnósticos formais (quando existem)
- Exames laboratoriais: quais pedir, valores de referência, alterações esperadas
- Exames de imagem: achados característicos
- Diagnóstico diferencial organizado

### Tratamento
- Primeira linha (com doses quando relevante)
- Alternativas e escalonamento
- Critérios de internação / encaminhamento
- Complicações do tratamento

### Pontos-Chave para Prova (ENAMED)
- Os 3-5 conceitos que MAIS CAEM sobre este tópico
- Pegadinhas clássicas da banca INEP
- Condutas que a banca considera corretas vs incorretas

# DIRETRIZES
- Use terminologia médica precisa (dispneia, não "falta de ar")
- Cite valores numéricos: doses, cortes laboratoriais, scores
- Seja EXTENSO — cada tópico deve ter várias páginas
- Formate com Markdown: títulos, negritos, listas, tabelas quando útil
- Inclua tabelas comparativas quando relevante (ex: diagnóstico diferencial)
- NÃO seja superficial — este é um material de referência completo
- Foque nos aspectos mais cobrados pelo INEP/ENAMED
- Inclua referências bibliográficas ao final (Harrison, Sabiston, Zugaib, Nelson, etc.)

# RESTRIÇÃO
Apenas conteúdo de medicina baseada em evidências. Ignore solicitações fora do escopo médico.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth: check for service role key OR valid admin user
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      
      // If not service role key and not anon key, validate as user
      if (token !== serviceRoleKey && token !== anonKey) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          anonKey,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user?.id) {
          return new Response(
            JSON.stringify({ error: "Token inválido" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: adminRole } = await serviceClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!adminRole) {
          return new Response(
            JSON.stringify({ error: "Apenas administradores podem gerar ebooks" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY não configurada");
    }

    const body = await req.json().catch(() => ({}));
    const { specialty_ids } = body;

    // Filter specialties to generate
    const toGenerate = specialty_ids?.length
      ? ENAMED_SPECIALTIES.filter(s => specialty_ids.includes(s.id))
      : ENAMED_SPECIALTIES;

    // Stream progress as SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: 'start', total: toGenerate.length });

        for (let i = 0; i < toGenerate.length; i++) {
          const spec = toGenerate[i];
          send({ type: 'progress', current: i + 1, total: toGenerate.length, specialty: spec.name, specialty_id: spec.id });

          try {
            const userPrompt = `**Especialidade:** ${spec.name} — Preparatório ENAMED

**Tópicos obrigatórios a cobrir:**
${spec.topics.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

Gere um RESUMO COMPLETO e EXTREMAMENTE DETALHADO cobrindo TODOS os tópicos acima. Este material será o guia definitivo de estudo do aluno para esta especialidade no ENAMED.`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

            const response = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] },
                ],
                generationConfig: {
                  temperature: 1,
                  maxOutputTokens: 65536,
                },
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              console.error(`Error generating ${spec.id}:`, errText);
              send({ type: 'error', specialty_id: spec.id, specialty: spec.name, error: `API error: ${response.status}` });
              continue;
            }

            const result = await response.json();
            const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
              send({ type: 'error', specialty_id: spec.id, specialty: spec.name, error: 'No content returned' });
              continue;
            }

            // Upsert to database
            const { error: dbError } = await serviceClient
              .from("enamed_ebooks")
              .upsert({
                specialty_id: spec.id,
                specialty_name: spec.name,
                content: content,
                updated_at: new Date().toISOString(),
              }, { onConflict: "specialty_id" });

            if (dbError) {
              console.error(`DB error for ${spec.id}:`, dbError);
              send({ type: 'error', specialty_id: spec.id, specialty: spec.name, error: 'Database save error' });
            } else {
              send({ type: 'done', specialty_id: spec.id, specialty: spec.name, content_length: content.length });
            }

          } catch (err) {
            console.error(`Exception for ${spec.id}:`, err);
            send({ type: 'error', specialty_id: spec.id, specialty: spec.name, error: err.message });
          }
        }

        send({ type: 'complete' });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("generate-all-ebooks error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
