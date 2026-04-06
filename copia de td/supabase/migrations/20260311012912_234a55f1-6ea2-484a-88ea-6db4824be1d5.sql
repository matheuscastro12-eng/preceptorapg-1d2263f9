
-- Create a view that exposes only public profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT user_id, full_name, bio, avatar_url, university, semester
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Add a policy that only allows users to view their own full profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
