// Constantes compartilhadas do CRM — evita duplicacao entre hooks e queries.
// Antes tinha a data/precos literais em varios arquivos. Se mudasse um so,
// os KPIs ficavam inconsistentes entre CRM Marketing e CRM Admin.

// Data a partir da qual o MRR comeca a ser contado. Antes dessa data,
// a operacao estava em modo "fase zero" — subscriptions criadas antes
// nao entram no calculo de receita mensal.
export const MRR_BASELINE_DATE = "2026-04-07T00:00:00.000Z";

// Precos dos planos em centavos (unidade que o banco usa).
// annual/biannual sao cobrados a vista mas contribuem mensalmente pro MRR.
export const PLAN_PRICES_CENTS = {
  monthly: 4990,
  annual: Math.round(35090 / 12),   // R$ 350,90/ano -> R$ 29,24/mes
  biannual: Math.round(59990 / 6),  // R$ 599,90/6 meses -> R$ 99,98/mes
} as const;
