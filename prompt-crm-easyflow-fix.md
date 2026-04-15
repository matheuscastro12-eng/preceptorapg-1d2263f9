# Prompt para Claude API — Correção da integração EasyFlow no CRM Admin

Cole este prompt inteiro no Claude da outra plataforma:

---

## Contexto

Temos uma aplicação SaaS (Supabase + TypeScript + React) que usa a EasyFlow como plataforma de pagamentos. No painel CRM Admin, existe uma página "EasyFlow" que deveria mostrar dados financeiros — total de vendas, número de vendas, assinaturas, comissões — e listar vendas e assinaturas. Mas tudo aparece zerado (R$ 0, 0 pedidos, 0 assinaturas).

A arquitetura é:
- **Frontend**: React + TanStack Query (hooks customizados)
- **Backend**: Supabase Edge Function (`easyflow-api`) que funciona como proxy para a API da EasyFlow
- **EasyFlow API**: plataforma de pagamentos brasileira com 2 contas configuradas (recorrente + avulsa)

## O problema

Investigamos e encontramos 3 causas raiz:

### Causa 1: Queries desabilitadas no page load

Os hooks de busca tinham `enabled: !!email`:
```ts
export function useEFSubscriptions(email?: string, page = 1) {
  return useQuery({
    queryKey: ["easyflow", "subscriptions", email, page],
    enabled: !!email,  // <-- SO RODA SE TIVER EMAIL
    queryFn: () => efApi({ action: "list_subscriptions", email, page, limit: 10 }),
  });
}
```
O `activeEmail` começa como string vazia no state do componente. Resultado: as queries NUNCA rodam no page load. Os dados só apareceriam se o admin digitasse um email e clicasse "Buscar" — mas mesmo assim os KPIs ficariam errados (causa 2).

### Causa 2: Edge function não retorna KPIs agregados

O frontend espera campos como `totalTransactionValue`, `totalCommissions`, `totalDocs`:
```tsx
<MetricCard value={salesData?.data?.totalTransactionValue / 100} />
<MetricCard value={salesData?.data?.sales?.totalDocs} />
<MetricCard value={subsData?.data?.totalDocs} />
<MetricCard value={salesData?.data?.totalCommissions / 100} />
```

Mas a edge function retorna apenas:
```json
{ "data": [...items], "total": 5, "sources": { "recorrente": 3, "avulsa": 2 } }
```

Nenhum campo agregado existe na resposta. O optional chaining retorna `undefined`, o fallback `?? 0` mostra zero.

### Causa 3: Hook `useEFFinancials` existe mas nunca é usado

Existe um hook pronto que poderia buscar dados financeiros:
```ts
export function useEFFinancials() {
  return useQuery({
    queryKey: ["easyflow", "financials"],
    queryFn: () => efApi({ action: "get_financials" }),
  });
}
```
Mas ele nunca é importado nem chamado no componente `AdminEasyflow.tsx`.

## Solução que implementamos no PreceptorMED

### 1. Nova action `get_dashboard` na edge function

Criamos uma action que roda sem precisar de email — busca tudo de uma vez:

- Chama `POST /sales/filter` (sem filtro de email) para pegar todas as vendas
- Chama `POST /subscriptions/filter` (sem filtro) para pegar todas as assinaturas
- Chama `GET /business/balance` para pegar o saldo
- Calcula os KPIs no servidor: `totalTransactionValue`, `totalSalesCount`, `totalCommissions`, contagem de assinaturas ativas/canceladas
- Retorna tudo em uma resposta só, incluindo as últimas 20 vendas e assinaturas para as tabelas

### 2. Novo hook `useEFDashboard`

```ts
export function useEFDashboard() {
  return useQuery({
    queryKey: ["easyflow", "dashboard"],
    queryFn: () => efApi({ action: "get_dashboard" }),
    staleTime: 5 * 60 * 1000, // cache por 5 min
  });
}
```

Roda automaticamente no page load (sem `enabled: !!email`).

### 3. Frontend corrigido

- KPIs sempre vêm do dashboard (dados globais)
- Tabelas mostram as últimas 20 vendas/assinaturas no page load
- Quando o admin busca por email, os dados filtrados substituem as tabelas
- O botão "Atualizar" refaz tanto o dashboard quanto a busca filtrada

## Sua tarefa

**Antes de implementar, analise se essa abordagem faz sentido para a nossa aplicação.** Considere:

1. Buscar TODAS as vendas/assinaturas sem filtro pode ser pesado — a EasyFlow tem paginação. Estamos pegando apenas page 1 com limit 100. Isso é suficiente? Deveria haver paginação no dashboard?
2. O `GET /business/balance` existe na API da EasyFlow? Pode ser que retorne 404 — devemos tratar esse caso?
3. Os campos `commissionInCents` e `feeInCents` existem no payload de vendas da EasyFlow? Ou precisamos calcular comissão de outra forma?
4. Com 2 contas EasyFlow (recorrente + avulsa), os KPIs devem somar dados das duas? Como evitar duplicação se a mesma venda aparece em ambas?
5. O cache de 5 minutos no `staleTime` é razoável para dados financeiros?
6. Faz sentido fazer 3 chamadas à API em paralelo dentro de uma edge function? Qual o risco de timeout?

**Responda com:**
- Se a abordagem geral faz sentido ou não
- Riscos e edge cases que identifica
- Sugestões de melhoria, se houver
- Só depois, se tudo fizer sentido, implemente adaptando ao schema e contexto da nossa aplicação

## Documentação da API EasyFlow (referência)

Base URL: `https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com`
Auth: Bearer token (`EASYFLOW_API_SECRET`)

Endpoints usados:
- `POST /sales/filter` — filtra vendas (aceita body JSON com filtros, paginação via query params `?page=1&limit=100`)
- `POST /subscriptions/filter` — filtra assinaturas
- `GET /business/balance` — retorna saldo da conta
- `GET /orders/{orderId}` — detalhes de um pedido
- `GET /customers/{customerId}` — dados do cliente

Estrutura de uma venda (sale):
```json
{
  "id": "uuid",
  "status": "paid",
  "valueInCents": 49900,
  "valuePaidInCents": 49900,
  "createdAt": "2026-04-01T...",
  "buyer": { "email": "...", "name": "..." },
  "items": [{ "product": { "name": "Plano Anual" } }],
  "payments": [{ "paymentMethod": "credit-card", "status": "paid" }]
}
```

Estrutura de uma assinatura (subscription):
```json
{
  "id": "uuid",
  "status": "active",
  "periodicity": "monthly",
  "recurrenceValueInCents": 4990,
  "paymentMethod": "credit-card",
  "createdAt": "2026-03-15T...",
  "customer": { "email": "...", "name": "..." }
}
```

## Schema do banco (tabelas relevantes no Supabase)

- `subscriptions` — status (active/inactive/inadimplente), plan_type, stripe_customer_id, stripe_subscription_id
- `profiles` — user_id, email, full_name
- `webhook_events` — provider, event_type, payload (jsonb), processed (bool), error_message

## Configuração de contas EasyFlow

Temos 2 contas configuradas via env vars:
- **Conta 1 (recorrente/mensal)**: `EASYFLOW_API_KEY`, `EASYFLOW_API_SECRET`, `EASYFLOW_BUSINESS_ID`
- **Conta 2 (avulsa/parcelamento)**: `EASYFLOW2_API_KEY`, `EASYFLOW2_API_SECRET`, `EASYFLOW2_BUSINESS_ID`

A edge function já tem a lógica de `fetchAllAccounts` que faz a mesma chamada em ambas as contas e mergeia os resultados.
