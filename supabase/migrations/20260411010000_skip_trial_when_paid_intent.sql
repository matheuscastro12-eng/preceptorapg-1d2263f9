-- ============================================================
-- Pular trial de 3 dias quando o usuário se cadastra
-- com intenção de pagamento (vindo do botão de assinatura).
-- ============================================================
-- Frontend deve passar { signup_intent: 'paid_signup' } no
-- raw_user_meta_data ao chamar supabase.auth.signUp() — assim
-- o trigger NÃO cria subscription de trial e o webhook do
-- EasyFlow vai criar a subscription paga depois do checkout.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_intent TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Pega a intenção de cadastro do raw_user_meta_data
  signup_intent := NEW.raw_user_meta_data->>'signup_intent';

  -- Trial de 3 dias APENAS para signups orgânicos.
  -- Quem está vindo do botão de assinatura (paid_signup) NÃO recebe trial
  -- — o webhook do EasyFlow vai criar a subscription paga após o pagamento.
  IF signup_intent IS DISTINCT FROM 'paid_signup' THEN
    INSERT INTO public.subscriptions (user_id, status, plan_type, access_expires_at, granted_by)
    VALUES (NEW.id, 'active', 'free_access', NOW() + INTERVAL '3 days', NULL)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
