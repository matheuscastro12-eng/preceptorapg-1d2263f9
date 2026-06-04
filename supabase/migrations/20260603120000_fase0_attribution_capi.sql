-- ============================================================
-- FASE 0 — Atribuição no signup (server-side) + matching do CAPI
-- ============================================================
-- Problema diagnosticado: profiles.first_utm_* estava 100% nulo. O front
-- gravava via UPDATE logo após signUp, mas sem sessão (confirmação de e-mail)
-- o RLS bloqueava, e havia corrida com este trigger. Solução robusta: o
-- front passa o first-touch no raw_user_meta_data e o TRIGGER grava na
-- criação do profile — sem RLS, sem corrida.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_intent TEXT;
  m JSONB;
BEGIN
  m := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- Profile + atribuição first-touch (vinda do raw_user_meta_data).
  -- NULLIF evita gravar string vazia; first_touch_at só converte se vier
  -- num formato de data plausível.
  INSERT INTO public.profiles (
    user_id, email,
    first_utm_source, first_utm_medium, first_utm_campaign,
    first_landing_page, first_touch_at
  )
  VALUES (
    NEW.id, NEW.email,
    NULLIF(m->>'first_utm_source', ''),
    NULLIF(m->>'first_utm_medium', ''),
    NULLIF(m->>'first_utm_campaign', ''),
    NULLIF(m->>'first_landing_page', ''),
    CASE
      WHEN (m->>'first_touch_at') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
      THEN (m->>'first_touch_at')::timestamptz
      ELSE NULL
    END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Trial de 3 dias APENAS para signups orgânicos (paid_signup pula — o
  -- webhook do EasyFlow cria a subscription paga após o checkout).
  signup_intent := m->>'signup_intent';
  IF signup_intent IS DISTINCT FROM 'paid_signup' THEN
    INSERT INTO public.subscriptions (user_id, status, plan_type, access_expires_at, granted_by)
    VALUES (NEW.id, 'active', 'free_access', NOW() + INTERVAL '3 days', NULL)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Matching do CAPI: guardamos os cookies _fbp/_fbc no início do checkout
-- para enviar no evento Purchase server-side (melhora muito a atribuição
-- da compra ao anúncio que originou o clique).
ALTER TABLE public.pending_checkouts
  ADD COLUMN IF NOT EXISTS fbp TEXT,
  ADD COLUMN IF NOT EXISTS fbc TEXT;
