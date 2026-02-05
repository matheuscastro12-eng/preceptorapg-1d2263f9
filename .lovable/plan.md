
# Plano de Monetização - Castro's PBL

## Visão Geral
Implementar um sistema completo de vendas com:
1. **Painel Admin** para você gerenciar acessos
2. **Sistema de Assinaturas** via Stripe
3. **Controle de Acesso Gratuito** para amigos específicos
4. **Proteção das funcionalidades** baseada no status da assinatura

---

## Sim, você pode vender pelo Lovable!

O Lovable tem integração nativa com o **Stripe** para processar pagamentos. Você poderá:
- Cobrar mensalmente ou anualmente
- Dar acesso gratuito para amigos via painel admin
- Ver quem está pagando e quem tem acesso gratuito
- Gerenciar tudo sem precisar de código

---

## 1. Estrutura do Banco de Dados

### Tabela: `user_roles` (Controle de Admin)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| user_id | uuid | Referência ao usuário |
| role | enum | 'admin', 'user' |

### Tabela: `subscriptions` (Status de Acesso)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| user_id | uuid | Referência ao usuário |
| status | text | 'active', 'trialing', 'canceled', etc |
| plan_type | text | 'free_access', 'monthly', 'annual' |
| stripe_customer_id | text | ID do cliente no Stripe |
| stripe_subscription_id | text | ID da assinatura no Stripe |
| current_period_end | timestamp | Quando expira |
| granted_by | uuid | Se foi acesso gratuito, quem liberou |

---

## 2. Fluxo de Acesso

```text
Usuário acessa o app
        │
        ▼
┌───────────────────┐
│  Tem assinatura   │
│  ativa ou acesso  │
│  gratuito?        │
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
   SIM       NÃO
    │         │
    ▼         ▼
  Acessa   Tela de
Dashboard  Assinatura
           (Checkout)
```

---

## 3. Painel Admin

### Funcionalidades do Admin
- **Ver todos os usuários** cadastrados
- **Liberar acesso gratuito** para amigos (marcando como 'free_access')
- **Revogar acesso** quando necessário
- **Ver estatísticas**: quantos pagantes, quantos gratuitos, receita

### Rota: `/admin`
- Protegida - só acessível por usuários com role 'admin'
- Tabela com lista de usuários
- Botões para liberar/revogar acesso
- Dashboard com métricas

---

## 4. Integração Stripe

### Setup
1. Habilitar Stripe no Lovable (ferramenta integrada)
2. Criar produto "Castro's PBL - Assinatura Mensal"
3. Configurar webhook para atualizar status automaticamente

### Preços Sugeridos
- **Mensal**: R$ 29,90 ou R$ 39,90
- **Anual**: R$ 249,90 (economia de 2 meses)

### Webhook para Sincronização
Quando o Stripe processar um pagamento, atualiza automaticamente o status na tabela `subscriptions`.

---

## 5. Página de Checkout/Paywall

### Quando Usuário Não Tem Acesso
Mostrar tela com:
- Benefícios do serviço
- Botão "Assinar Agora" (vai para checkout Stripe)
- Depoimentos/Social proof (opcional)

---

## 6. Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabelas `user_roles` e `subscriptions` |
| `src/hooks/useSubscription.ts` | Hook para checar status |
| `src/hooks/useAdmin.ts` | Hook para verificar se é admin |
| `src/pages/Admin.tsx` | Painel de administração |
| `src/pages/Pricing.tsx` | Página de checkout/assinatura |
| `src/pages/Dashboard.tsx` | Adicionar verificação de acesso |
| `src/components/AdminUserTable.tsx` | Tabela de usuários para admin |
| `supabase/functions/stripe-webhook/index.ts` | Processar eventos do Stripe |

---

## 7. Tornando Você Admin

Após implementação, você será definido como admin diretamente no banco de dados usando seu email. Assim você terá acesso total ao painel de administração.

---

## 8. Passos de Implementação

1. **Criar tabelas** no banco (roles, subscriptions)
2. **Habilitar Stripe** via ferramenta do Lovable
3. **Criar webhook** para sincronizar pagamentos
4. **Criar página de pricing/checkout**
5. **Proteger Dashboard** com verificação de acesso
6. **Criar painel admin** para gerenciamento
7. **Inserir você como admin** no banco

---

## Resultado Esperado

- Você terá controle total sobre quem acessa o serviço
- Amigos podem ter acesso gratuito com um clique no painel
- Outros usuários pagam via Stripe automaticamente
- Tudo gerenciável sem precisar mexer em código

---

## Próximo Passo

Para implementar, preciso primeiro **habilitar o Stripe** no seu projeto. Isso vai solicitar sua chave secreta do Stripe para configurar os pagamentos.

Deseja que eu prossiga com a implementação?
