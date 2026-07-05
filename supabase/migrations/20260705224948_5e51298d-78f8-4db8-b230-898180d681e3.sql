
-- Fix 1: Restrict music bucket SELECT to owner/admin or files referenced by approved tracks/profiles
DROP POLICY IF EXISTS "Authenticated users can read music files" ON storage.objects;

CREATE POLICY "Read own or approved music files"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'music' AND (
    -- Owner
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    OR
    -- Admin
    (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin'::public.app_role))
    OR
    -- File is referenced by an approved profile avatar
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.status = 'approved'
        AND p.avatar_url IS NOT NULL
        AND (p.avatar_url = name OR p.avatar_url LIKE '%/music/' || name OR p.avatar_url LIKE '%/music/' || name || '?%')
    )
    OR
    -- File is referenced by an approved track (cover or audio)
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.status = 'approved'
        AND (
          t.cover_url = name OR t.cover_url LIKE '%/music/' || name OR t.cover_url LIKE '%/music/' || name || '?%'
          OR t.audio_url = name OR t.audio_url LIKE '%/music/' || name OR t.audio_url LIKE '%/music/' || name || '?%'
        )
    )
  )
);

-- Fix 2: Recreate public_profiles view as SECURITY INVOKER (default is definer via pg permissions)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, artist_name, genre, city, bio, avatar_url, youtube, spotify, facebook, instagram, tiktok, twitter, created_at
FROM public.profiles
WHERE status = 'approved';

GRANT SELECT ON public.public_profiles TO anon, authenticated;
