# Prompt para Claude API — Correção de Webhook EasyFlow (ativação de assinatura)

Cole este prompt inteiro no Claude da outra plataforma:

---

## Contexto

Temos uma aplicação SaaS (Supabase + TypeScript) que usa a EasyFlow como plataforma de pagamentos. O webhook da EasyFlow recebe eventos quando um cliente paga e deve ativar a assinatura automaticamente no nosso banco de dados.

## O problema

Clientes estão assinando na EasyFlow mas a assinatura NÃO está sendo ativada automaticamente no site. Investigamos e descobrimos a causa raiz:

**A EasyFlow envia dois tipos de evento ao pagar:**

1. `order.paid` — contém `payload.buyer.email` (email do comprador). O webhook consegue identificar o usuário e ativar a assinatura. FUNCIONA.

2. `payment.paid` — contém APENAS dados do pagamento (cartão de crédito, valor, parcelas). **NÃO contém `buyer`, `customer`, nem `email`**. O webhook não consegue identificar quem pagou e ignora o evento silenciosamente. NÃO FUNCIONA.

Exemplo real do payload de `payment.paid` que recebemos:
```json
{
  "event": "payment.paid",
  "payload": {
    "id": "eb43090e-344d-424c-8288-b373f2330e6e",
    "pix": { "qrCode": null, "expireAt": "1970-01-01T00:00:00.000Z", "copyAndPasteCode": null },
    "refuse": { "slug": null, "type": null, "rawDescription": null },
    "status": "paid",
    "bankBillet": { "line": null, "link": null, "barCode": null, "expireAt": "1970-01-01T00:00:00.000Z" },
    "creditCard": {
      "flag": "mastercard",
      "holderName": "RAFAEL ZONDONADI DE SOUZA",
      "last4Numbers": "6159",
      "expiresAtYear": 2030,
      "expiresAtMonth": 6
    },
    "installments": 2,
    "valueInCents": 37042,
    "paymentMethod": "credit-card",
    "valuePaidInCents": 37042,
    "interestValueInCents": 1852,
    "occurredAt": "2026-04-15T01:41:11.9287"
  }
}
```

Note: **não tem buyer.email, customer.email, nem email em lugar nenhum.**

## Solução que implementamos no PreceptorMED

No webhook, quando o evento é `payment.paid` e não tem email, implementamos 4 fallbacks em cascata:

1. **Buscar subscription existente pelo payment ID** — quando o `order.paid` original ativou a assinatura, salvamos o ID da EasyFlow nos campos `stripe_customer_id` / `stripe_subscription_id`. Buscamos na tabela `subscriptions` por esse ID.

2. **Buscar pelo nome no cartão** — o `creditCard.holderName` (ex: "RAFAEL ZONDONADI DE SOUZA") é comparado case-insensitive com `full_name` na tabela `profiles`.

3. **Chamar a API da EasyFlow** — `POST /sales/filter` com o `paymentId` para encontrar a venda original e extrair o email do comprador de lá.

4. **Buscar no auth.users pelo nome** — compara `holderName` com `user_metadata.full_name` nos usuários do Supabase Auth.

Se nenhum fallback funciona, marcamos o `webhook_events` como `processed: false` com `error_message` detalhada.

Também corrigimos: quando `payment.paid` não tem info de plano (sem `periodicity`, sem `items`), mantemos o `plan_type` existente na subscription em vez de defaultar para "monthly".

## Sua tarefa

**Antes de implementar qualquer coisa, analise se essa abordagem faz sentido para a nossa aplicação.** Considere:

1. A estrutura do nosso banco (tabelas `subscriptions`, `profiles`, `webhook_events`) suporta esses fallbacks?
2. Os fallbacks estão na ordem certa de confiabilidade? O Fallback 1 (por ID) deveria ser o primeiro?
3. Buscar por `holderName` pode dar match errado (homônimos)? Qual o risco?
4. A chamada à API da EasyFlow dentro do webhook pode causar timeout ou latência excessiva?
5. Existe algum caso que não cobrimos (ex: PIX, boleto — que não tem `holderName`)?
6. Faz sentido marcar `webhook_events` como não processado quando falha, para ter uma fila de retry manual?

**Responda com:**
- Se a abordagem geral faz sentido ou não
- Riscos e edge cases que identifica
- Sugestões de melhoria, se houver
- Só depois, se tudo fizer sentido, implemente adaptando ao schema e contexto da nossa aplicação

## Documentação da API EasyFlow (referência)

Base URL: `https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com`
Auth: Bearer token (`EASYFLOW_API_SECRET`)

Endpoints relevantes:
- `GET /orders/{orderId}` — retorna detalhes de um pedido (inclui buyer com email)
- `POST /sales/filter` — filtra vendas
- `POST /subscriptions/filter` — filtra assinaturas
- `GET /customers/{customerId}` — retorna dados do cliente

Eventos de webhook:
- Order: `ORDER_CREATED`, `ORDER_PAID`, `ORDER_CANCELED`, `ORDER_REFUNDED`, `ORDER_CHARGEDBACK`
- Subscription: `subscription.created`, `subscription.activated`, `subscription.canceled`, `subscription.expired`, `subscription.inactivated`
- Recurrence: `subscriptionRecurrence.paid`, `subscriptionRecurrence.delayed`, `subscriptionRecurrence.failed`, `subscriptionRecurrence.canceled`
- Payment: `PAYMENT_PAID`, `PAYMENT_CANCELED`, `PAYMENT_AUTHORIZED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEDBACK`
