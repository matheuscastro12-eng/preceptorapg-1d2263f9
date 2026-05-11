-- Adiciona desconto_20 e desconto_anual aos premios validos da roleta.
-- chaveiro permanece valido (compat retroativa com dados de teste).

alter table public.roulette_spins
  drop constraint if exists roulette_spins_prize_check;

alter table public.roulette_spins
  add constraint roulette_spins_prize_check
  check (prize in (
    'chaveiro',
    'desconto_20',
    'desconto_30',
    'desconto_50',
    'mensal_gratis'
  ));
