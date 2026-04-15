# Prompt para Claude API — Auditoria e Melhorias do CRM PreceptorMED

Cole este prompt inteiro no Claude da outra plataforma:

---

## Contexto

PreceptorMED e um SaaS de educacao medica para estudantes brasileiros. Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui no frontend, Supabase (Postgres + Auth + Edge Functions em Deno) no backend. O CRM tem duas secoes: CRM Marketing (leads, funil, churn, automacoes) e CRM Admin (financeiro, pessoas, OKRs).

Fizemos uma auditoria completa e encontramos bugs, problemas de UI/UX e oportunidades de features. Sua tarefa e implementar as correcoes e melhorias descritas abaixo. Analise cada item, confirme se faz sentido no nosso contexto, e implemente.

## PARTE 1: BUGS CRITICOS (implementar primeiro)

### Bug 1: json() indefinido na crm-admin-actions
**Arquivo:** `supabase/functions/crm-admin-actions/index.ts`
**Problema:** A edge function chama `json()` em ~12 lugares mas nunca define essa funcao helper. Todas as actions (grant_access, revoke_access, update_plan, get_subscriptions) crasham com "json is not defined".
**Correcao:** Adicionar a funcao helper no final do arquivo:
```typescript
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Bug 2: Token CRM sem verificacao HMAC
**Arquivo:** `supabase/functions/crm-admin-actions/index.ts` (linhas 15-26)
**Problema:** A funcao `verifyCrmToken()` verifica expiracao mas NAO valida a assinatura HMAC do token. A `crm-auth` faz a validacao correta (linhas 22-46 de crm-auth/index.ts). Tokens forjados passam.
**Correcao:** Copiar a logica de verificacao HMAC de `crm-auth/index.ts` para `crm-admin-actions`. Usar `CRM_TOKEN_SECRET` para verificar o signature do JWT.

### Bug 3: .single() sem fallback no Dashboard
**Arquivo:** `src/hooks/useAdminDashboard.ts` (linha ~98)
**Problema:** Usa `.single()` na query de `admin_fluxo_caixa`. Se a tabela esta vazia, lanca excecao e crasha o dashboard.
**Correcao:** Trocar `.single()` por `.maybeSingle()` e adicionar null check:
```typescript
const { data: fluxo } = await supabase
  .from("admin_fluxo_caixa")
  .select("saldo_atual")
  .order("data_atualizacao", { ascending: false })
  .limit(1)
  .maybeSingle();
const saldoAtual = fluxo?.saldo_atual ?? 0;
```

### Bug 4: Fallback secret inseguro
**Arquivo:** `supabase/functions/crm-auth/index.ts` (linha ~58)
**Problema:** `const TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "fallback-insecure";`
**Correcao:** Remover o fallback e retornar erro se nao estiver setado:
```typescript
const TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET");
if (!TOKEN_SECRET) return json({ error: "Server misconfiguration: CRM_TOKEN_SECRET not set" }, 500);
```

## PARTE 2: BUGS ALTOS

### Bug 5: MRR baseline hardcoded em 2 lugares
**Arquivos:** `src/lib/crm/queries.ts:49` e `src/hooks/useAdminDashboard.ts:58`
**Problema:** A data "2026-04-07T00:00:00.000Z" esta duplicada. Se uma muda e a outra nao, os KPIs ficam inconsistentes.
**Correcao:** Criar constante compartilhada em `src/lib/crm/constants.ts`:
```typescript
export const MRR_BASELINE_DATE = "2026-04-07T00:00:00.000Z";
export const PLAN_PRICES = { monthly: 4990, annual: Math.round(35090/12), biannual: Math.round(59990/6) };
```
E importar em ambos os arquivos. Isso tambem resolve o Bug de precos duplicados em 3 arquivos.

### Bug 6: Auth silenciosa no CRM
**Arquivo:** `src/contexts/CrmAuthContext.tsx` (~linha 91-95)
**Problema:** Se re-auth do service account falha, loga warning mas continua. Queries subsequentes dao permission denied sem feedback.
**Correcao:** Adicionar state de erro e mostrar toast/banner quando auth falha:
```typescript
if (svcError) {
  console.error("CRM service re-auth failed:", svcError.message);
  toast({ title: "Erro de autenticacao CRM", description: "Tente recarregar a pagina.", variant: "destructive" });
  return; // nao continuar com auth quebrada
}
```

### Bug 7: Push/WhatsApp fazem skip silencioso
**Arquivo:** `supabase/functions/crm-automations/index.ts` (linhas 374-381)
**Problema:** Canais push e whatsapp incrementam `results.skipped++` sem erro. Admin acha que enviou.
**Correcao:** Marcar como `results.failed++` e logar warning claro:
```typescript
else if (automation.channel === "push") {
  console.warn(`[crm-automations] Push nao implementado. Automacao ${automation.id} pulada.`);
  results.failed++;
} else if (automation.channel === "whatsapp") {
  console.warn(`[crm-automations] WhatsApp nao implementado. Automacao ${automation.id} pulada.`);
  results.failed++;
}
```

### Bug 8: Template de email so substitui {{nome}}
**Arquivo:** `supabase/functions/crm-automations/index.ts` (~linha 110)
**Problema:** So faz replace de `{{nome}}`. Variaveis como `{{email}}`, `{{plano}}`, `{{dias_trial}}` ficam cruas.
**Correcao:** Adicionar substituicao generica:
```typescript
const variables: Record<string, string> = {
  nome: leadData?.full_name || leadData?.email || "Estudante",
  email: leadData?.email || "",
  plano: leadData?.plan_type || "gratuito",
  dias_trial: "3",
  link_planos: "https://thepreceptor.com.br/planos",
};
let html = template.html_content || "";
for (const [key, val] of Object.entries(variables)) {
  html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
}
```

## PARTE 3: MELHORIAS DE UI/UX

### Melhoria 1: Skeleton Loaders
**Onde:** Todos os MetricCards e tabelas do CRM
**O que:** Substituir o spinner generico (`<Loader2 className="animate-spin" />`) por skeleton loaders que imitam o layout final. Usar o componente `<Skeleton />` do shadcn/ui que ja existe no projeto.
**Exemplo para MetricCard:**
```tsx
{isLoading ? (
  <div className="p-4 space-y-2">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-2 w-16" />
  </div>
) : (
  <MetricCard ... />
)}
```

### Melhoria 2: Comparativo vs Periodo Anterior nos MetricCards
**Onde:** Todos os MetricCards do CRM Dashboard e Admin Dashboard
**O que:** Mostrar variacao percentual vs periodo anterior. Seta verde para positivo, vermelha para negativo.
**Implementacao:** Adicionar prop `previousValue` ao MetricCard. Calcular delta e renderizar:
```tsx
{previousValue !== undefined && value !== 0 && (
  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
    delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-gray-500"
  }`}>
    {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(delta).toFixed(1)}%
  </span>
)}
```

### Melhoria 3: Tooltips nos KPIs
**Onde:** MetricCards
**O que:** Ao passar o mouse num card, mostrar tooltip explicando o que a metrica significa e como e calculada. Usar o `<Tooltip>` do shadcn/ui.
**Adicionar prop `tooltip` ao MetricCard e renderizar:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>{/* card content */}</TooltipTrigger>
    <TooltipContent><p className="text-xs max-w-[200px]">{tooltip}</p></TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Melhoria 4: Error States em Todas as Paginas
**Onde:** Todas as paginas CRM
**O que:** Quando uma query falha, mostrar UI de erro com botao de retry em vez de loading infinito.
**Implementacao:** Nos hooks que usam `useQuery`, verificar `isError` e renderizar:
```tsx
{isError && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
    <p className="text-sm text-gray-400">Erro ao carregar dados</p>
    <button onClick={() => refetch()} className="mt-2 px-3 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700 text-gray-300">
      Tentar novamente
    </button>
  </div>
)}
```

### Melhoria 5: Empty States Informativos
**Onde:** CrmLeads, CrmHealth, CrmChurn, AdminReceita, AdminContratacoes
**O que:** Quando nao ha dados, mostrar mensagem amigavel com sugestao de acao, em vez de tabela vazia.
**Exemplo:**
```tsx
{items.length === 0 && !isLoading && (
  <div className="flex flex-col items-center py-12 text-center">
    <Users className="w-10 h-10 text-gray-700 mb-3" />
    <p className="text-sm text-gray-400 mb-1">Nenhum lead encontrado</p>
    <p className="text-xs text-gray-600">Leads aparecerao aqui quando usuarios se cadastrarem no site.</p>
  </div>
)}
```

### Melhoria 6: Transicoes entre Paginas
**Onde:** Layout principal do CRM Admin
**O que:** Adicionar fade-in suave ao trocar de pagina no CRM.
**CUIDADO:** NAO usar `key={location.pathname}` no wrapper principal (causa screen flash — bug conhecido do projeto). Usar CSS transition:
```tsx
<div className="animate-in fade-in duration-200">
  {children}
</div>
```

## PARTE 4: NOVAS FEATURES

### Feature 1: Dashboard Real-Time com Supabase Realtime
**O que:** Substituir polling de 60s (`refetchInterval: 60_000`) por Supabase Realtime. Quando um lead converte ou assinante cancela, o dashboard atualiza instantaneamente.
**Como:**
- Usar `supabase.channel('crm-changes').on('postgres_changes', ...)` para escutar mudancas em `subscriptions`, `crm_leads`, `profiles`
- Quando receber mudanca, invalidar as queries do React Query: `queryClient.invalidateQueries({ queryKey: ["crm-admin"] })`
- Mostrar toast quando evento importante acontece (novo assinante, churn, inadimplencia)
**Tabelas para monitorar:** `subscriptions`, `crm_leads`, `admin_inadimplencias`

### Feature 2: Cohort Analysis
**O que:** Nova pagina `/admin/crm/cohorts` com analise de coortes por mes de cadastro.
**Como:**
- Agrupar usuarios por `profiles.created_at` (mes/ano)
- Para cada coorte, calcular: tamanho inicial, retidos no mes 1, 2, 3...N
- Renderizar heatmap/tabela onde linhas = coortes, colunas = meses, celulas = % retencao
- Usar cores: verde escuro (>80%), verde claro (60-80%), amarelo (40-60%), laranja (20-40%), vermelho (<20%)
**Query base:**
```sql
SELECT 
  date_trunc('month', p.created_at) as cohort_month,
  date_trunc('month', gl.created_at) as activity_month,
  count(distinct p.user_id) as users
FROM profiles p
LEFT JOIN generation_logs gl ON gl.user_id = p.user_id
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Feature 3: Revenue Intelligence com AI
**O que:** Botao "Analisar com IA" no dashboard financeiro que usa Gemini para:
- Resumir tendencias de receita dos ultimos 3 meses
- Identificar padroes (ex: churn aumenta no mes 2, plano anual retém mais)
- Prever MRR dos proximos 3 meses baseado no historico
**Como:**
- Nova edge function `revenue-intelligence` que busca dados financeiros do Supabase e manda para Gemini com system prompt de analista financeiro
- Frontend: modal com markdown renderizado da resposta
- Rate limit: 1 analise por hora
- Usar `systemInstruction` (camelCase, NAO snake_case) com temperature 0.7

### Feature 4: Notificacoes In-App
**O que:** Icone de sino no sidebar do CRM com badge de contagem. Dropdown com lista de eventos recentes.
**Como:**
- Criar tabela `crm_notifications` (id, type, title, description, read, created_at, metadata jsonb)
- Alimentar via triggers ou no webhook: novo assinante, churn, inadimplencia, feedback negativo
- Frontend: componente `<NotificationBell />` no header do AdminSidebar
- Marcar como lido ao clicar
- Usar Supabase Realtime para atualizar em tempo real

### Feature 5: Export CSV em Todas as Tabelas
**O que:** Botao de download CSV em cada tabela do CRM.
**Como:**
- Componente reutilizavel `<ExportButton data={items} filename="leads" />`
- Converter array de objetos para CSV com headers
- Trigger download via `URL.createObjectURL(blob)`
- Ja existe no DRE — reusar o pattern

### Feature 6: Modo Foco / Drill-Down nos MetricCards
**O que:** Clicar num MetricCard abre modal/drawer com grafico detalhado da metrica + historico.
**Como:**
- Adicionar `onClick` no MetricCard que abre um `<Sheet>` do shadcn/ui
- Dentro do Sheet: titulo da metrica, grafico de linha (recharts) com historico dos ultimos 6 meses, tabela com breakdown
- Dados vem do mesmo hook mas com range de tempo expandido

## REGRAS IMPORTANTES

1. **Gemini API:** Usar `systemInstruction` (camelCase). snake_case e silenciosamente ignorado.
2. **Temperature:** 0.7 para conteudo factual. Nunca 1.0.
3. **RLS:** NAO escrever diretamente em `subscriptions` pelo frontend — usar edge function com service_role_key.
4. **key={pathname}:** NUNCA usar em wrappers de layout. Causa screen flash.
5. **Fonts:** Manrope para headings, DM Sans/Inter para body.
6. **Cores:** Primary green #006D5B, dark green #005344, gold #C9A84C.
7. **Mobile-first:** Tabelas CRM devem ter versao mobile com cards (`md:hidden`).
8. **Imports:** Supabase client de `@/integrations/supabase/client` para queries com RLS. CRM usa `supabaseCrm` de `@/integrations/supabase/crm-client`.

## ORDEM DE IMPLEMENTACAO SUGERIDA

1. Bugs criticos (Parte 1) — sem isso o CRM crasha
2. Bugs altos (Parte 2) — seguranca e consistencia
3. UI/UX: skeleton loaders + error states + empty states (Parte 3, itens 1/4/5)
4. UI/UX: comparativo periodo + tooltips (Parte 3, itens 2/3)
5. Feature: Export CSV (rapido, alto valor)
6. Feature: Notificacoes In-App
7. Feature: Dashboard Real-Time
8. Feature: Cohort Analysis
9. Feature: Revenue Intelligence com AI
10. Feature: Modo Foco/Drill-Down

Analise cada item, confirme se faz sentido, e implemente na ordem sugerida. Se encontrar algum problema adicional durante a implementacao, corrija tambem.
