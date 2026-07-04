
-- Remove anonymous read access to the raw profiles table
DROP POLICY IF EXISTS "Public can view approved profiles" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- Public-facing view: only non-sensitive columns of approved profiles
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  artist_name,
  genre,
  city,
  bio,
  avatar_url,
  youtube,
  spotify,
  facebook,
  instagram,
  tiktok,
  twitter,
  created_at
FROM public.profiles
WHERE status = 'approved';

GRANT SELECT ON public.public_profiles TO anon, authenticated;
