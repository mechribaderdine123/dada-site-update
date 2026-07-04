
-- Recreate the view with security_invoker so it respects the caller's RLS + column grants
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

-- Column-level grant: anon can only read safe columns of profiles (never email/phone)
GRANT SELECT (
  id, artist_name, genre, city, bio, avatar_url,
  youtube, spotify, facebook, instagram, tiktok, twitter, status, created_at
) ON public.profiles TO anon;

-- Row-level policy so anon can only see approved rows
CREATE POLICY "Public can view approved profiles (safe cols)"
  ON public.profiles FOR SELECT
  TO anon
  USING (status = 'approved'::approval_status);
