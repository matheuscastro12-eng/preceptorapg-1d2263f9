

# Plano de Implementacao

Este plano aborda 3 areas: correcoes na simulacao de provas, modo tela cheia com questoes progressivas, e atualizacao de precos.

---

## 1. Corrigir botoes de navegacao sumindo ao ver gabarito

**Problema:** Quando o aluno clica em "Ver Gabarito" e a explicacao aparece, os botoes "Anterior" e "Proxima" desaparecem porque o conteudo da explicacao empurra a navegacao para fora da area visivel.

**Solucao:** Ajustar o layout do `SimulationView.tsx` para que a area de navegacao fique sempre fixa na parte inferior, independente do tamanho da explicacao. A `ScrollArea` vai conter todo o conteudo scrollavel, e os botoes ficam fora dela com posicao fixa.

---

## 2. Modo Simulacao em tela cheia

**Problema:** Atualmente o painel de configuracao (lado esquerdo) continua visivel durante a simulacao, desperdicando espaco.

**Solucao:**
- Quando a geracao iniciar em modo simulacao, esconder o painel esquerdo (`ExamConfigPanel`)
- O painel direito (simulacao) ocupa a tela toda
- Adicionar um botao "Voltar ao Menu" no header da simulacao para retornar ao painel de configuracao
- Quando o aluno clicar em "Voltar ao Menu", o layout volta ao grid de 2 colunas

**Arquivo:** `src/pages/Exam.tsx`
- Adicionar estado `examStarted` para controlar visibilidade do painel esquerdo
- Mudar o grid de `lg:grid-cols-2` para `lg:grid-cols-1` quando em modo simulacao ativo

---

## 3. Responder questoes durante a geracao (streaming progressivo)

**Problema:** O aluno precisa esperar toda a prova ser gerada para comecar a responder.

**Solucao:**
- Entrar no modo simulacao assim que a primeira questao completa for parseada (em vez de esperar `isComplete`)
- O `SimulationView` recebe o `resultado` em tempo real e faz re-parse das questoes conforme chegam
- Se o aluno avancar alem da ultima questao ja parseada, mostra uma mensagem: "Aguarde... a proxima questao ainda esta sendo gerada"
- O botao "Finalizar" so aparece quando `isComplete` for `true` E o aluno estiver na ultima questao

**Arquivos:**
- `src/pages/Exam.tsx`: Remover a condicao `isComplete` do `useEffect` que ativa a simulacao; ativar assim que `hasStartedReceiving` e houver pelo menos 1 questao parseada
- `src/components/exam/SimulationView.tsx`:
  - Aceitar novas props: `isGenerating` e `isComplete`
  - Usar `useMemo` reativo no `resultado` para re-parsear questoes conforme chegam
  - Quando `currentIndex >= questions.length` e `isGenerating`, mostrar tela de "aguardando proxima questao"
  - So mostrar botao "Finalizar" quando `isComplete === true`

---

## 4. Atualizar precos para R$ 19,90/mes e R$ 199,90/ano

### 4a. Stripe
- O preco mensal de R$ 19,90 ja existe no Stripe: `price_1SxsscCqd1B4NxDH8i05CAxC`
- Criar novo preco anual de R$ 199,90 (19990 centavos BRL) no Stripe
- Atualizar os secrets `STRIPE_MONTHLY_PRICE_ID` e `STRIPE_ANNUAL_PRICE_ID` com os novos IDs

### 4b. Frontend (`src/pages/Pricing.tsx`)
- Alterar "R$ 29,90" para "R$ 19,90" no card mensal
- Alterar "R$ 249,90" para "R$ 199,90" no card anual
- Atualizar "Equivale a R$ 20,83/mês" para "Equivale a R$ 16,66/mês"
- Atualizar "Economia de 2 meses" para refletir a nova economia

### 4c. Backend
- O `create-checkout` ja usa os secrets (`STRIPE_MONTHLY_PRICE_ID` e `STRIPE_ANNUAL_PRICE_ID`) dinamicamente, entao nao precisa de mudanca no codigo -- apenas atualizar os secrets.

---

## Detalhes Tecnicos

### Mudancas em `SimulationView.tsx`
- Novas props: `isGenerating: boolean`, `isComplete: boolean`
- O `parseQuestions` continua funcionando porque ja faz split por `## Questao X` -- questoes parciais (sem todas as alternativas) sao filtradas pelo check `alternatives.length >= 4`
- Tela de espera: um componente com spinner e mensagem amigavel quando o aluno chega numa questao que ainda nao foi gerada
- Layout: garantir que os botoes de navegacao usem `shrink-0` e fiquem fora do `ScrollArea`

### Mudancas em `Exam.tsx`
- Estado `examStarted`: setado quando `handleGenerate` e chamado com `simulationMode` ativo
- Condicao do grid: `examStarted && config.simulationMode ? 'grid-cols-1' : 'lg:grid-cols-2'`
- Auto-entrar em simulacao: mudar o `useEffect` para observar `hasStartedReceiving` + existencia de questoes parseadas (nao mais `isComplete`)
- Passar `generating` e `isComplete` para `SimulationView`

### Stripe
- Criar preco anual R$ 199,90 via ferramenta Stripe
- Atualizar 2 secrets via ferramenta de secrets

### Arquivos modificados
1. `src/components/exam/SimulationView.tsx` -- layout fixo de navegacao, props de streaming, tela de espera
2. `src/pages/Exam.tsx` -- tela cheia, logica de ativacao progressiva
3. `src/pages/Pricing.tsx` -- novos valores de preco
4. Secrets do Stripe (STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID)
