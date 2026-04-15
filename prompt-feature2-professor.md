# Prompt para Claude API — Feature: Modulo Professor (Banco de Questoes)

Cole este prompt inteiro no Claude da outra plataforma:

---

## Contexto

PreceptorMED e um SaaS de educacao medica para estudantes brasileiros. Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui, backend Supabase (Postgres + Auth + Edge Functions em Deno), IA via Google Gemini 2.5 Flash. Live em thepreceptor.com.br.

Ja temos simulados para alunos (Exam.tsx) com componentes InteractiveQuestion, SimulationView, ExamResultPanel que podem ser reusados. Tambem estamos construindo um "Gerador de Simulados a partir de PDF" para alunos que compartilha engine com este modulo.

## O que construir

Um modulo separado para professores de medicina onde eles podem: criar bancos de questoes organizados por materia, criar questoes manualmente ou com ajuda da IA (gerar distratores, gerar questoes de texto de referencia), montar provas selecionando questoes, compartilhar provas com alunos via link, e ver analytics de desempenho.

## Proposta de valor da IA

O diferencial que faz o professor usar nossa plataforma em vez de Word:
- Escreve enunciado + resposta correta → IA gera 3-4 distratores plausiveis
- Cola texto de referencia → IA sugere 5-10 questoes a partir dele
- Sistema classifica cada questao por taxonomia de Bloom e dificuldade automaticamente
- Analytics: quais questoes alunos mais erram, tempo medio, distribuicao de respostas

## Schema do Banco (criar migration)

```sql
CREATE TABLE professor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  institution TEXT,
  specialties TEXT[],
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  total_questions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE professor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professor_profiles(id),
  enunciado TEXT NOT NULL,
  texto_referencia TEXT,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  alternativa_e TEXT,
  gabarito TEXT NOT NULL,
  explicacao TEXT,
  difficulty TEXT DEFAULT 'medium',
  bloom_level TEXT,
  tags TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  times_used INT DEFAULT 0,
  correct_rate FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE professor_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professor_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  question_ids UUID[] NOT NULL,
  share_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  time_limit_minutes INT,
  show_answers_after BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE professor_exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES professor_exams(id),
  student_user_id UUID REFERENCES auth.users(id),
  student_name TEXT,
  answers JSONB NOT NULL,
  score INT,
  total_questions INT,
  correct_answers INT,
  time_spent_seconds INT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE professor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_exam_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor owns profile" ON professor_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Professor owns banks" ON question_banks
  FOR ALL USING (professor_id IN (SELECT id FROM professor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Professor owns questions" ON professor_questions
  FOR ALL USING (professor_id IN (SELECT id FROM professor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Professor owns exams" ON professor_exams
  FOR ALL USING (professor_id IN (SELECT id FROM professor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Students see active exams" ON professor_exams
  FOR SELECT USING (is_active = true);
CREATE POLICY "Professor sees responses" ON professor_exam_responses
  FOR SELECT USING (exam_id IN (SELECT id FROM professor_exams WHERE professor_id IN (SELECT id FROM professor_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Anyone can submit response" ON professor_exam_responses
  FOR INSERT WITH CHECK (true);
```

## Edge Functions (3 novas)

### 1. generate-distractors

**Arquivo:** `supabase/functions/generate-distractors/index.ts`

Input: `{ enunciado, resposta_correta, subject, num_alternatives: 3 }`
Valida Bearer token. Checa rate limit em generation_logs.

```
systemInstruction (camelCase):
"Voce e um professor de medicina especialista em avaliacao.
Dado um enunciado de questao e a resposta correta, gere alternativas
distratoras (respostas erradas mas plausiveis).
- Os distratores devem representar erros COMUNS de estudantes
- Devem ser plausiveis o suficiente para exigir estudo real
- Nao use 'todas as anteriores' ou 'nenhuma das anteriores'
- Mantenha o mesmo nivel de detalhe da resposta correta
- Gere tambem uma explicacao curta de porque cada alternativa esta certa ou errada"

Temperature: 0.6

Output (JSON):
{
  "distractors": ["alternativa errada 1", "alternativa errada 2", "alternativa errada 3"],
  "explicacao": "A resposta correta e X porque... A alternativa Y esta errada porque...",
  "difficulty_estimated": "medium",
  "bloom_level": "apply"
}
```

### 2. generate-questions-from-text

**Arquivo:** `supabase/functions/generate-questions-from-text/index.ts`

Input: `{ texto_referencia, subject, count: 5, difficulty: "medium" }`
Valida Bearer token. Checa rate limit.

```
systemInstruction:
"Voce e um professor de medicina criando questoes para avaliacao de alunos.
Dado um texto de referencia, gere questoes de multipla escolha.
- Cada questao deve testar COMPREENSAO, nao apenas memorizar
- 4-5 alternativas plausiveis por questao
- Distratores devem ser erros comuns de estudantes
- Varie a dificuldade conforme solicitado
- Base TODAS as questoes no texto — nao invente fatos alem do conteudo
- Classifique cada questao por taxonomia de Bloom
- Inclua explicacao"

Temperature: 0.5

Output (JSON):
{
  "questions": [{
    "enunciado": "...",
    "alternativa_a": "...",
    "alternativa_b": "...",
    "alternativa_c": "...",
    "alternativa_d": "...",
    "gabarito": "b",
    "explicacao": "...",
    "difficulty": "medium",
    "bloom_level": "analyze",
    "topic": "Sistema cardiovascular"
  }]
}
```

### 3. classify-question

**Arquivo:** `supabase/functions/classify-question/index.ts`

Input: `{ enunciado, alternativas: ["a", "b", "c", "d"], gabarito: "a" }`

```
systemInstruction:
"Voce e especialista em avaliacao educacional medica.
Classifique esta questao por dificuldade e taxonomia de Bloom."

Temperature: 0.3

Output (JSON):
{
  "difficulty": "hard",
  "bloom_level": "evaluate",
  "reasoning": "Exige que o aluno avalie multiplas hipoteses..."
}
```

## Frontend: Paginas a Criar

### Rotas

```
/professor → ProfessorDashboard (lista de bancos)
/professor/setup → ProfessorSetup (primeiro acesso, criar perfil)
/professor/banco/:bankId → QuestionBankDetail (lista de questoes)
/professor/banco/:bankId/nova → CreateQuestion (form manual + IA)
/professor/prova/montar/:bankId → AssembleExam (selecionar questoes)
/professor/prova/:examId/analytics → ExamAnalytics (resultados)
/prova/:shareCode → StudentExam (publica, aluno faz a prova)
```

Todas lazy loaded no App.tsx.

### 1. ProfessorDashboard (`src/pages/professor/ProfessorDashboard.tsx`)

- Header: "Seus Bancos de Questoes" + botao "Novo Banco"
- Grid de cards, cada banco mostra: titulo, subject, total_questions, distribuicao de dificuldade (facil/medio/dificil), numero de provas montadas, ultima atualizacao
- Botoes por card: [Abrir] [Montar Prova] [Analytics]
- Empty state se nao tem bancos: "Crie seu primeiro banco de questoes"

### 2. ProfessorSetup (`src/pages/professor/ProfessorSetup.tsx`)

- Form de primeiro acesso: nome de exibicao, instituicao, especialidades (multi-select)
- Salva em professor_profiles
- Redireciona para ProfessorDashboard

### 3. QuestionBankDetail (`src/pages/professor/QuestionBankDetail.tsx`)

- Header: titulo do banco + botoes [Nova Questao] [Importar PDF] [Montar Prova]
- Filtros: dificuldade, bloom, tags, busca por texto
- Lista de questoes com: enunciado (truncado), dificuldade badge, bloom badge, tags, correct_rate
- Cada questao expandivel para ver alternativas + gabarito + explicacao
- Acoes por questao: [Editar] [Duplicar] [Excluir]

### 4. CreateQuestion (`src/pages/professor/CreateQuestion.tsx`)

Duas abas: **Manual** e **Com IA**

**Aba Manual:**
- Form: enunciado (textarea), alternativas a-e (inputs), gabarito (radio), explicacao, dificuldade, tags
- Botao "Classificar com IA" que chama classify-question e preenche difficulty + bloom

**Aba Com IA — Modo 1 (Distratores):**
- Input: enunciado + resposta correta + subject
- Botao "Gerar Distratores"
- IA retorna alternativas + explicacao
- Professor revisa e confirma

**Aba Com IA — Modo 2 (Gerar de Texto):**
- Textarea grande: "Cole um texto de referencia"
- Controles: quantidade (5-20), dificuldade (facil/medio/dificil/misto)
- Botao "Gerar Questoes"
- Lista de questoes geradas com checkboxes
- Professor seleciona as que quer e clica "Adicionar ao Banco"

### 5. AssembleExam (`src/pages/professor/AssembleExam.tsx`)

- Titulo da prova + descricao
- Lista de questoes do banco com checkboxes para selecionar
- Filtros rapidos: dificuldade, bloom, tags
- Preview da prova montada (ordem, numeracao)
- Opcoes: tempo limite (min), mostrar respostas apos
- Botao "Criar Prova" → gera share_code unico
- Modal com link compartilhavel: `thepreceptor.com.br/prova/ABC123`

### 6. ExamAnalytics (`src/pages/professor/ExamAnalytics.tsx`)

- Metricas gerais: total de respostas, media de acerto, tempo medio
- Grafico de distribuicao de notas (histograma)
- Tabela por questao: enunciado, % acerto, distribuicao de respostas (A: 30%, B: 50%, C: 15%, D: 5%)
- Destaque para questoes com acerto muito alto (>90%, facil demais) ou muito baixo (<20%, dificil demais ou mal formulada)
- Lista de alunos que responderam: nome, nota, tempo

### 7. StudentExam (`src/pages/professor/StudentExam.tsx`)

Pagina PUBLICA (nao precisa de auth, mas pode opcionalmente logar).

- Busca prova pelo share_code
- Se prova nao ativa → mensagem "Esta prova nao esta mais disponivel"
- Se ativa: mostra titulo + descricao + "Iniciar Prova"
- Campo opcional: nome do aluno (se nao logado)
- Simulado reusando InteractiveQuestion + SimulationView
- Ao finalizar: salva em professor_exam_responses + mostra resultado (se show_answers_after=true)

## Auth do Professor

Reusar o Supabase Auth existente. Qualquer usuario logado pode acessar /professor. No primeiro acesso, redireciona para ProfessorSetup para criar professor_profiles. A role nao muda — professor e apenas quem tem registro em professor_profiles.

Opcional (v2): admin pode marcar professor como `is_verified` para selo de verificacao.

## Design

- Mesmo dark theme do app principal
- Cores: primary green #006D5B, gold #C9A84C
- Fontes: Manrope headings, DM Sans body
- Mobile-first
- shadcn/ui components
- Sidebar propria para /professor (similar ao DashboardLayout mas com itens de professor)

## Regras CRITICAS

1. **Gemini API**: Usar `systemInstruction` (camelCase). snake_case e SILENCIOSAMENTE IGNORADO.
2. **Temperature**: 0.3 classificacao, 0.5 geracao de questoes, 0.6 distratores. NUNCA 1.0.
3. **RLS**: Todas as tabelas com RLS. Professor so ve os proprios dados. Aluno pode ver provas ativas e submeter respostas.
4. **key={pathname}**: NUNCA usar em wrappers de layout.
5. **Lazy load**: Todas as rotas lazy loaded.
6. **Edge function auth**: Validar Bearer token com `supabase.auth.getUser(token)`.
7. **Rate limit**: Usar generation_logs. Professor: 20 geracoes/dia.

## Sinergias com feature de "Gerador de Simulados do Aluno"

- O botao "Importar PDF" no QuestionBankDetail pode reusar a mesma edge function `process-exam-pdf` que o aluno usa
- As questoes publicas do professor podem aparecer no banco de questoes disponivel para alunos
- InteractiveQuestion/SimulationView/ExamResultPanel sao reusados em ambos

## Ordem de implementacao

1. Migration SQL (tabelas + RLS)
2. ProfessorSetup + professor_profiles
3. ProfessorDashboard + CRUD de question_banks
4. QuestionBankDetail + CRUD de professor_questions (manual)
5. Edge function generate-distractors + UI na CreateQuestion
6. Edge function generate-questions-from-text + UI na CreateQuestion
7. Edge function classify-question + integracao
8. AssembleExam (montagem + share_code)
9. StudentExam (pagina publica)
10. ExamAnalytics (resultados + graficos)
11. Sidebar do professor + rotas no App.tsx

Analise se faz sentido, depois implemente na ordem acima.
