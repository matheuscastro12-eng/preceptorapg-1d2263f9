

## Integrar com Manus.ia para Gerar Slides Automaticamente

### Como vai funcionar

Depois que o conteudo do seminario for gerado pelo Google Gemini, o usuario podera clicar em um botao "Gerar Slides com Manus" que enviara automaticamente o conteudo para o Manus.ia criar a apresentacao. O Manus processa a tarefa e retorna um link onde o usuario acompanha e baixa os slides prontos.

### Fluxo do usuario

```text
+---------------------------+       +---------------------------+       +---------------------------+
|  1. Gera conteudo do      |       |  2. Clica em "Gerar       |       |  3. Manus cria os slides  |
|  seminario (ja existe)    | ----> |  Slides com Manus"        | ----> |  e abre o link em nova    |
|                           |       |  (novo botao)             |       |  aba para acompanhar      |
+---------------------------+       +---------------------------+       +---------------------------+
```

### Passo a passo

1. **Configurar a API Key do Manus como secret seguro**
   - Voce vai precisar da sua API key do Manus (pegue em [manus.im/app](http://manus.im/app?show_settings=integrations&app_name=api) em Settings > Integrations > API)
   - A key sera armazenada de forma segura no backend

2. **Criar nova edge function `send-to-manus`**
   - Recebe o conteudo gerado do seminario
   - Envia para a API do Manus (`POST https://api.manus.ai/v1/tasks`) com um prompt instruindo a criar slides a partir do conteudo
   - Retorna o `task_url` (link do Manus onde o usuario acompanha a criacao dos slides)

3. **Atualizar o componente `SeminarActions`**
   - Remover o botao "Copiar para Slides" e toda a logica de extracao de slide visual
   - Adicionar botao "Gerar Slides com Manus" com icone e estado de loading
   - Ao clicar, chama a edge function e abre o link do Manus em uma nova aba
   - Manter o timer de tempo estimado (continua util)

4. **Atualizar o `ResultPanel`** (ajustes menores de texto)

### Detalhes Tecnicos

**Nova edge function `send-to-manus/index.ts`:**
- Endpoint: `POST https://api.manus.ai/v1/tasks`
- Header de autenticacao: `API_KEY: {MANUS_API_KEY}`
- Body: prompt com instrucoes para criar slides + conteudo do seminario como anexo/contexto
- Resposta: `{ task_id, task_url }` -- abriremos o `task_url` em nova aba
- Inclui verificacao de autenticacao do usuario (mesma logica da edge function existente)

**Prompt enviado ao Manus:**
- Instrucoes claras para criar apresentacao de slides medica/academica
- O conteudo completo gerado pelo Gemini sera enviado como contexto
- Pedir que gere em formato PPTX com design profissional

**Componente SeminarActions atualizado:**
- Remove: botao "Copiar para Slides", `slideVisualContent` useMemo
- Adiciona: botao "Gerar Slides com Manus" com estados: idle, loading ("Criando..."), sucesso (link aberto)
- Mantem: timer de tempo estimado

**Secret necessario:**
- `MANUS_API_KEY` -- chave da API do Manus

### O que muda vs o que nao muda

**Muda:**
- Botao "Copiar para Slides" vira "Gerar Slides com Manus"
- Nova edge function para comunicar com a API do Manus
- Novo secret `MANUS_API_KEY`

**Nao muda:**
- Geracao de conteudo pelo Google Gemini (continua igual)
- Timer de tempo estimado (continua)
- Botoes de Salvar, Copiar, PDF (continuam)
- Modo Fechamento (nao e afetado)

