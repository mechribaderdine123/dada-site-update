
-- Anyone signed in or not can read from music bucket (files are referenced by uuid-prefixed paths + we use signed URLs from client anyway; but simpler: allow public read of the bucket)
CREATE POLICY "Public can read music files" ON storage.objects
FOR SELECT USING (bucket_id = 'music');

CREATE POLICY "Users can upload own music files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own music files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own music files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can manage all music files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'));
