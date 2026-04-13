-- ============================================================
-- Trial de 3 dias automático para novos usuários
-- ============================================================
-- Modifica o trigger handle_new_user para criar uma subscription
-- com plan_type='free_access' e access_expires_at = NOW() + 3 days.
-- Após 3 dias, useSubscription detecta expiração e hasAccess vira false,
-- voltando o usuário pro modo demo (2 AI chats/dia).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Trial de 3 dias: free_access com expiração automática
  INSERT INTO public.subscriptions (user_id, status, plan_type, access_expires_at, granted_by)
  VALUES (NEW.id, 'active', 'free_access', NOW() + INTERVAL '3 days', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
