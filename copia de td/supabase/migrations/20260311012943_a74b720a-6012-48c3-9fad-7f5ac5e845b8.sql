
-- Remove the broad policy - only own-profile and admin policies remain
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
