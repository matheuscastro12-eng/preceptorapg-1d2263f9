

## Trocar Lovable AI por Google Gemini Direto

### O que vai mudar

A edge function `generate-fechamento` atualmente usa o Lovable AI Gateway. Vamos troca-la para chamar a API do Google Gemini diretamente usando sua propria API key.

### Passo a passo

1. **Configurar sua API Key do Google AI Studio como secret seguro**
   - Voce vai precisar da sua API key do Google AI Studio (pegue em [aistudio.google.com](https://aistudio.google.com/apikey))
   - A key sera armazenada de forma segura no backend e nunca ficara exposta no codigo

2. **Atualizar a edge function `generate-fechamento`**
   - Trocar a URL do Lovable AI Gateway pela API do Google Gemini (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent`)
   - Usar o formato de request do Google Gemini (que e diferente do formato OpenAI)
   - Adaptar o parsing do streaming (o Google usa formato JSON diferente do SSE padrao OpenAI)
   - Manter toda a logica de autenticacao, validacao e prompts existentes intactas
   - Atualizar o tratamento de erros para os codigos do Google (429 rate limit, 403 quota, etc.)

3. **Adaptar o streaming no frontend (se necessario)**
   - O Google Gemini retorna streaming em formato diferente, entao pode ser necessario converter o formato na edge function para manter compatibilidade com o frontend atual

### Detalhes Tecnicos

**Mudanca principal na edge function:**

- **Antes:** `fetch("https://ai.gateway.lovable.dev/v1/chat/completions")` com formato OpenAI
- **Depois:** `fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=...")` com formato Google

**Estrategia de streaming:**
- Usar o parametro `alt=sse` do Google para receber Server-Sent Events
- O formato SSE do Google retorna `candidates[0].content.parts[0].text` em vez de `choices[0].delta.content`
- Converter o formato na edge function para que o frontend continue funcionando sem alteracoes

**Modelo:**
- Usar `gemini-2.5-pro` (o mesmo que ja estava sendo usado via gateway, porem agora direto)

**Secret necessario:**
- `GOOGLE_AI_API_KEY` - sua chave da API do Google AI Studio

### O que NAO muda
- Os prompts de fechamento e seminario permanecem identicos
- A interface do dashboard continua igual
- A logica de autenticacao e validacao continua igual
- O frontend nao precisa de alteracoes (a conversao de formato sera feita na edge function)

