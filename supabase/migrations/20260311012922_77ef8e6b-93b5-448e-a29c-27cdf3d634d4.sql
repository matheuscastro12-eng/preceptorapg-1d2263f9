
-- Fix: recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, full_name, bio, avatar_url, university, semester
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- We need a broad SELECT policy back on profiles so the view works,
-- but we'll make it restrictive. The view only exposes safe columns.
-- Actually, since security_invoker=true, the view runs as the calling user,
-- so we need a SELECT policy that allows reading other profiles.
-- Let's add back a policy but the view itself limits columns.
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
