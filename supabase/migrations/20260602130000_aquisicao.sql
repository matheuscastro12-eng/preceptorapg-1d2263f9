-- ============================================================
-- Aquisição por canal: fix de atribuição + função de overview
-- ============================================================

-- 1) Fix de atribuição (first-touch): a UTM da 1ª visita é capturada no
--    front (localStorage) e gravada no profile no momento do cadastro.
--    Antes disso, todo signup aparecia como "Direto".
alter table public.profiles
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists first_landing_page text,
  add column if not exists first_touch_at timestamptz;

-- 2) Overview de aquisição: cruza lead (UTM em crm_leads) -> cadastro
--    (profiles) -> assinatura (subscriptions), por canal, nos últimos 90d,
--    + série diária de cadastros (30d) + resumo. SECURITY DEFINER para
--    poder ler as três tabelas; execução restrita ao service_role (a edge
--    function crm-aquisicao chama). Retorna um único jsonb.
create or replace function public.crm_aquisicao_overview()
returns jsonb
language sql
security definer
set search_path = public
as $fn$
  with canais as (
    select
      case
        when l.utm_medium = 'paid' and l.utm_source in ('instagram','facebook','fb','ig') then 'Meta (pago)'
        when l.utm_source in ('instagram','facebook','fb','ig','www.facebook.com') then 'Meta (organico)'
        when l.utm_source ilike 'google%' or l.utm_source ilike '%doubleclick%' or l.utm_source ilike '%syndicat%' or l.utm_source ilike '%googlesynd%' then 'Google'
        when l.utm_source = 'youtube' then 'YouTube'
        when coalesce(l.utm_source,'direct') = 'direct' then 'Direto'
        else 'Outros'
      end as canal,
      lower(l.email) as em
    from public.crm_leads l
    where l.created_at >= now() - interval '90 days'
      and l.email is not null and l.email <> ''
  ),
  ch as (
    select c.canal,
      count(distinct c.em) as leads,
      count(distinct p.user_id) as cadastros,
      count(distinct s.user_id) filter (where s.status = 'active') as assinantes,
      count(distinct s.user_id) filter (where s.status = 'active' and s.plan_type in ('monthly','annual','biannual')) as pagantes
    from canais c
    left join public.profiles p on lower(p.email) = c.em
    left join public.subscriptions s on s.user_id = p.user_id
    group by c.canal
  ),
  overlay as (
    select to_char(d::date,'YYYY-MM-DD') as dia,
      (select count(*) from public.profiles pr where pr.created_at::date = d::date) as cadastros
    from generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') d
  ),
  resumo as (
    select
      (select count(*) from public.profiles where created_at >= now()-interval '30 days') as cadastros_30d,
      (select count(*) from public.subscriptions where created_at >= now()-interval '30 days' and status='active' and plan_type in ('monthly','annual','biannual')) as pagantes_30d,
      (select count(*) from public.subscriptions where created_at >= now()-interval '30 days' and status='active') as assin_ativas_30d,
      (select count(*) from public.crm_leads where created_at >= now()-interval '30 days') as leads_30d,
      (select count(distinct lower(email)) from public.crm_leads where created_at >= now()-interval '30 days' and utm_medium='paid' and utm_source in ('instagram','facebook','fb','ig')) as leads_meta_30d
  )
  select jsonb_build_object(
    'canais', coalesce((select jsonb_agg(to_jsonb(ch) order by ch.leads desc) from ch), '[]'::jsonb),
    'overlay', coalesce((select jsonb_agg(to_jsonb(overlay) order by overlay.dia) from overlay), '[]'::jsonb),
    'resumo', (select to_jsonb(resumo) from resumo)
  );
$fn$;

revoke all on function public.crm_aquisicao_overview() from public;
grant execute on function public.crm_aquisicao_overview() to service_role;
