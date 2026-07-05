-- Fix 1: Remove public anon SELECT policy on profiles (exposed email/phone).
-- Anonymous users read approved profiles through the public_profiles view (safe columns only).
DROP POLICY IF EXISTS "Public can view approved profiles (safe cols)" ON public.profiles;

-- Make the view SECURITY DEFINER so anon can read safe columns without RLS on profiles.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, artist_name, genre, city, bio, avatar_url,
       youtube, spotify, facebook, instagram, tiktok, twitter, created_at
FROM public.profiles
WHERE status = 'approved'::approval_status;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Fix 2: Remove public anon read on the music storage bucket.
-- Only authenticated users (owners + admins) can read music files.
DROP POLICY IF EXISTS "Public can read music files" ON storage.objects;

CREATE POLICY "Authenticated users can read music files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'music');