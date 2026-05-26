-- ────────────────────────────────────────────────────────────────
-- landing_banners.image_url_mobile — versao otimizada da imagem
-- para viewports moveis. Pedido do time de marketing.
-- Se null, o carrossel usa image_url em todas as resolucoes.
-- ────────────────────────────────────────────────────────────────

alter table public.landing_banners
  add column if not exists image_url_mobile text;

comment on column public.landing_banners.image_url_mobile is
  'URL da imagem otimizada para mobile (resolucao reduzida). Se null, o cliente cai pra image_url em todas as resolucoes.';
