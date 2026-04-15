-- Habilita Supabase Realtime nas tabelas que o useCrmRealtime escuta.
-- Sem isso, subscriptions/crm_leads/admin_inadimplencias nao emitem
-- eventos postgres_changes e o dashboard fica estatico (so com polling).

-- Cada comando e idempotente via DO block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'crm_leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'admin_inadimplencias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_inadimplencias;
  END IF;
END $$;
