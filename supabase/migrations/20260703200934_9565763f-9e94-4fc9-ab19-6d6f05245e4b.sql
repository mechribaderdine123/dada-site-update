
-- Drop the view flagged by the linter
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the public read policy (needed for the anon column-level grants to actually return rows)
DROP POLICY IF EXISTS "Public can view approved profiles" ON public.profiles;
CREATE POLICY "Public can view approved profiles" ON public.profiles
  FOR SELECT TO anon
  USING (status = 'approved');

-- Restrict anon to safe columns only (no email, no phone)
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, artist_name, genre, city, bio, avatar_url,
  youtube, spotify, facebook, instagram, tiktok, twitter,
  status, created_at, updated_at
) ON public.profiles TO anon;
