# Prompt para Claude API — Feature: Gerador de Simulados a Partir de PDF

Cole este prompt inteiro no Claude da outra plataforma:

---

## Contexto

PreceptorMED e um SaaS de educacao medica para estudantes brasileiros. Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui, backend Supabase (Postgres + Auth + Edge Functions em Deno), IA via Google Gemini 2.5 Flash. Pagamentos EasyFlow. Live em thepreceptor.com.br.

Ja temos um sistema de simulados (Exam.tsx) com componentes InteractiveQuestion, SimulationView, ExamResultPanel, PostSimulationFeedback. Tambem temos um banco de questoes ENAMED (enamed_questions) com schema: enunciado, alternativa_a/b/c/d, gabarito, explicacao, area, ano, numero.

## O que construir

Uma feature onde o aluno faz upload de QUALQUER PDF (prova antiga, resumo, slides de aula) e recebe um simulado interativo automaticamente. A IA detecta o tipo de material e age de acordo:

- **Prova antiga**: EXTRAI questoes existentes (enunciado + alternativas + gabarito)
- **Resumo/apostila**: Identifica conceitos-chave e GERA questoes novas
- **Slides de aula**: Identifica topicos por slide e gera questoes contextualizadas

O aluno SEMPRE passa por uma tela de revisao antes de salvar (nunca salvar automaticamente). Depois pode fazer simulados com aquelas questoes reusando os componentes do Exam.tsx que ja existem.

## Schema do Banco (criar migration)

```sql
CREATE TABLE user_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  institution TEXT,
  semester TEXT,
  source_type TEXT NOT NULL DEFAULT 'exam', -- exam | summary | slides | mixed
  pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- processing | review | ready | error
  total_questions INT DEFAULT 0,
  extraction_confidence FLOAT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES user_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT,
  alternativa_b TEXT,
  alternativa_c TEXT,
  alternativa_d TEXT,
  alternativa_e TEXT,
  gabarito TEXT,
  explicacao TEXT,
  confidence FLOAT,
  manually_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES user_exams(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  score INT,
  total_questions INT,
  correct_answers INT,
  time_spent_seconds INT,
  answers JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own exams" ON user_exams FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own questions" ON user_exam_questions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own attempts" ON user_exam_attempts FOR ALL USING (auth.uid() = user_id);
```

## Supabase Storage

Criar bucket `exam-pdfs` com RLS: usuario so ve os proprios uploads. Deletar PDF apos extracao bem-sucedida (nao manter material potencialmente protegido).

## Edge Function: process-exam-pdf

**Arquivo:** `supabase/functions/process-exam-pdf/index.ts`

Fluxo:
1. Recebe `{ examId }` + Bearer token do usuario
2. Busca `user_exams` pelo examId, pega `pdf_path`
3. Baixa PDF do Supabase Storage
4. Extrai texto do PDF (usar `pdf-parse` ou similar disponivel no Deno)
5. Se texto extraido < 200 caracteres → tentar Gemini Vision (envia PDF como imagem)
6. Detecta tipo do material (Prompt 0 abaixo)
7. Baseado no tipo, roda o prompt correto (Prompt 1 ou 2)
8. Salva questoes em `user_exam_questions`
9. Atualiza `user_exams` com status='review', total_questions, extraction_confidence
10. Retorna `{ success: true, type, totalQuestions }`

**Tratamento de erro:** se qualquer passo falha, atualizar `user_exams.status = 'error'` e `error_message` com descricao util.

### Prompt 0 — Detector de tipo

```
systemInstruction (camelCase, NAO snake_case):
"Voce classifica documentos academicos de medicina.
Dado os primeiros 800 caracteres de um PDF, classifique o tipo."

Temperature: 0.2

Output esperado (JSON puro):
{ "type": "exam" | "summary" | "slides" | "mixed",
  "confidence": 0.0-1.0,
  "subject_detected": "Anatomia" | null,
  "language": "pt-BR" }
```

### Prompt 1 — Extracao de prova (type=exam)

```
systemInstruction:
"Voce e um extrator preciso de questoes de provas academicas de medicina.
Extraia TODAS as questoes do texto.
- Inclua caso clinico no enunciado se houver
- Se gabarito nao estiver no documento, retorne gabarito: null
- Se alternativa estiver ilegivel, inclua o que conseguir e marque confidence baixa
- Mantenha nomes cientificos e abreviacoes medicas
- NAO invente conteudo — extraia APENAS o que esta no texto
- Liste problemas encontrados em extraction_issues"

Temperature: 0.3

Output (JSON puro):
{
  "questions": [{
    "number": 1,
    "enunciado": "...",
    "alternativa_a": "...",
    "alternativa_b": "...",
    "alternativa_c": "...",
    "alternativa_d": "...",
    "alternativa_e": null,
    "gabarito": "a",
    "confidence": 0.95
  }],
  "metadata": {
    "total_extracted": 30,
    "subject_detected": "Anatomia",
    "has_gabarito": true
  },
  "extraction_issues": ["Questao 5: texto cortado apos alternativa C"]
}
```

### Prompt 2 — Geracao a partir de resumo/slides (type=summary|slides)

```
systemInstruction:
"Voce e um professor de medicina criando questoes objetivas para seus alunos.
Dado o conteudo de um resumo ou slide, primeiro identifique os TOPICOS
principais, depois gere questoes de multipla escolha sobre cada topico.
- Gere questoes que TESTEM compreensao, nao apenas memoria
- Cada questao deve ter 4-5 alternativas plausiveis
- Distratores devem ser erros comuns de estudantes de medicina
- Varie a dificuldade: 30% facil, 50% medio, 20% dificil
- Base TODAS as questoes no conteudo fornecido — nao invente fatos
- Inclua explicacao curta para cada questao"

Temperature: 0.5

Output (JSON puro):
{
  "topics_detected": ["Sistema cardiovascular", "Ciclo cardiaco"],
  "questions": [{
    "number": 1,
    "topic": "Sistema cardiovascular",
    "enunciado": "...",
    "alternativa_a": "...",
    "alternativa_b": "...",
    "alternativa_c": "...",
    "alternativa_d": "...",
    "gabarito": "b",
    "explicacao": "...",
    "difficulty": "medium",
    "confidence": 0.9
  }],
  "metadata": { "total_generated": 15, "subject_detected": "Fisiologia" }
}
```

## Mitigacao de Erros (implementar todas as camadas)

### Camada 1: Input
- OCR duplo: texto nativo (pdf-parse) + fallback Gemini Vision se texto < 200 chars
- Rejeitar PDF corrompido ou vazio com mensagem clara
- Deteccao automatica de tipo antes de processar

### Camada 2: IA
- Confidence por questao (0-1). >= 0.8 verde, 0.6-0.8 amarelo, < 0.6 vermelho
- extraction_issues listando problemas encontrados
- Temperature 0.3 para extracao, 0.5 para geracao

### Camada 3: Revisao obrigatoria
- NUNCA salvar automaticamente
- Questoes com confidence < 0.7 no topo com destaque visual
- Botoes: [Aprovar] [Editar] [Remover] [Regenerar]
- Contador: "23 prontas · 4 revisao · 2 removidas"

### Camada 4: Validacao pos-revisao
- Alternativas duplicadas? Gabarito contradiz enunciado? Questao muito curta? Menos de 3 alternativas?

## Frontend: Paginas a Criar

### 1. Pagina "Meus Simulados" (`src/pages/MyExams.tsx`)

Listagem de simulados do aluno. Cards com titulo, materia, numero de questoes, status. Botao de upload no topo. Rota: `/meus-simulados`

Layout:
- Grid de cards (2 colunas desktop, 1 mobile)
- Card mostra: titulo, subject, total_questions, status badge, data
- Status: "Processando..." com spinner, "Revisar" com badge amarelo, "Pronto" com badge verde
- Ao clicar: se status=review vai pra revisao, se status=ready vai pro simulado
- Upload: botao abre modal com dropzone + campo de titulo

### 2. Pagina de Revisao (`src/pages/ExamReview.tsx`)

Tela de revisao pos-extracao. Rota: `/meus-simulados/:examId/revisao`

Layout:
- Header com titulo do exame, contador de questoes, botao "Confirmar e Salvar"
- Lista de questoes, cada uma com:
  - Indicador de confidence (verde/amarelo/vermelho)
  - Enunciado editavel (textarea)
  - Alternativas editaveis
  - Gabarito selecionavel (radio buttons)
  - Botoes: Editar | Remover | Regenerar
- Questoes com confidence < 0.7 aparecem primeiro
- Ao confirmar: atualiza user_exams.status = 'ready'

### 3. Pagina de Simulado (`src/pages/ExamSimulation.tsx`)

Reusa os componentes do Exam.tsx existentes. Rota: `/meus-simulados/:examId/simulado`

- Busca questoes de user_exam_questions
- Renderiza com InteractiveQuestion (ou componente similar ao que ja existe)
- Timer opcional
- Ao finalizar: salva em user_exam_attempts, mostra resultado

### 4. Adicionar no menu principal

Adicionar item "Meus Simulados" no DashboardLayout.tsx sidebar, entre Exam e Flashcards. Icone: FileUp ou BookOpen do lucide-react.

### 5. Adicionar rota no App.tsx

Lazy load: `const MyExams = lazy(() => import("./pages/MyExams"));`
Rotas:
```
/meus-simulados → MyExams
/meus-simulados/:examId/revisao → ExamReview
/meus-simulados/:examId/simulado → ExamSimulation
```

## Rate Limiting

- Free users: 2 uploads de PDF por dia
- Paid users: 10 uploads por dia
- Usar tabela `generation_logs` existente com type='exam_pdf'

## Design

- Dark theme consistente com o resto do app
- Cores: primary green #006D5B, gold #C9A84C
- Fontes: Manrope headings, DM Sans body
- Mobile-first: cards em 1 coluna no mobile
- Usar shadcn/ui components (Card, Badge, Button, Textarea, RadioGroup)
- Skeleton loaders durante carregamento
- Toast para feedback (sucesso, erro)

## Regras CRITICAS

1. **Gemini API**: Usar `systemInstruction` (camelCase). snake_case e silenciosamente ignorado — dropa o system prompt inteiro.
2. **Temperature**: 0.3 para extracao, 0.5 para geracao. NUNCA 1.0.
3. **RLS**: Todas as tabelas com RLS. Frontend usa supabase de `@/integrations/supabase/client`.
4. **key={pathname}**: NUNCA usar em wrappers de layout. Causa screen flash.
5. **Lazy load**: Todas as rotas novas devem ser lazy loaded no App.tsx.
6. **Edge function auth**: Validar Bearer token com `supabase.auth.getUser(token)`.
7. **Storage**: Criar bucket com politica de RLS. Deletar PDF apos extracao.

## Ordem de implementacao

1. Migration SQL (tabelas + RLS + storage bucket)
2. Edge function process-exam-pdf (detectar tipo + extrair/gerar + salvar)
3. Pagina MyExams (listagem + upload)
4. Pagina ExamReview (revisao com edicao + confianca)
5. Pagina ExamSimulation (reuso de componentes existentes)
6. Adicionar rotas no App.tsx + item no sidebar
7. Rate limiting via generation_logs
8. Testar com PDFs reais de diferentes tipos

Analise se faz sentido, depois implemente na ordem acima.
