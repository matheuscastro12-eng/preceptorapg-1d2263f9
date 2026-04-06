
-- Create function to check active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND (status = 'active' OR plan_type = 'free_access')
      AND (access_expires_at IS NULL OR access_expires_at > now())
  )
$$;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view enamed ebooks" ON public.enamed_ebooks;

-- New SELECT policy: active subscription OR admin
CREATE POLICY "Subscribers can view enamed ebooks"
  ON public.enamed_ebooks
  FOR SELECT
  TO authenticated
  USING (
    has_active_subscription(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
  );
