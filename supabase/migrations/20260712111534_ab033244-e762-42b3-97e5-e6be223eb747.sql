
-- 1) Admin-only policies for database export buckets
CREATE POLICY "Admins can read database exports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('database_export_05_07_26','database_export_08_07_26')
  AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can write database exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('database_export_05_07_26','database_export_08_07_26')
  AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update database exports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('database_export_05_07_26','database_export_08_07_26')
  AND private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id IN ('database_export_05_07_26','database_export_08_07_26')
  AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete database exports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('database_export_05_07_26','database_export_08_07_26')
  AND private.has_role(auth.uid(), 'admin'::app_role));

-- 2) Tighten music SELECT policy: constrain public/join branches to known filename prefixes
DROP POLICY IF EXISTS "Read own or approved music files" ON storage.objects;

CREATE POLICY "Read own or approved music files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'music' AND (
    -- Owner can read their own files
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = (auth.uid())::text)
    -- Admins can read all
    OR (auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin'::app_role))
    -- Public: only files that follow the app's naming convention (avatar-/cover-/audio-)
    OR (
      name ~ '^[^/]+/(avatar|cover|audio)-'
      AND (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.status = 'approved'::approval_status
            AND p.avatar_url IS NOT NULL
            AND (
              p.avatar_url = objects.name
              OR p.avatar_url LIKE '%/music/' || objects.name
              OR p.avatar_url LIKE '%/music/' || objects.name || '?%'
            )
        )
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.status = 'approved'::approval_status
            AND (
              t.cover_url = objects.name
              OR t.cover_url LIKE '%/music/' || objects.name
              OR t.cover_url LIKE '%/music/' || objects.name || '?%'
              OR t.audio_url = objects.name
              OR t.audio_url LIKE '%/music/' || objects.name
              OR t.audio_url LIKE '%/music/' || objects.name || '?%'
            )
        )
      )
    )
  )
);
