
-- Fix profiles SELECT policies: drop all restrictive ones, create permissive ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix fechamentos: allow authenticated users to read all fechamentos (for stats, shared content)
DROP POLICY IF EXISTS "Users can view their own fechamentos" ON public.fechamentos;

CREATE POLICY "Users can view their own fechamentos"
  ON public.fechamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view shared fechamentos"
  ON public.fechamentos FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT fechamento_id FROM public.posts WHERE fechamento_id IS NOT NULL)
  );
