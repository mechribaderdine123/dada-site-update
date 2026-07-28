
-- Public bucket for images that must be visible to every visitor:
-- page hero/banner images, sponsor logos, workshop photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Replaces the old localStorage-only site-content store so page copy/images
-- edited in the admin dashboard are visible to every visitor, not just the
-- browser that made the edit.
CREATE TABLE public.site_content (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert site content" ON public.site_content
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update site content" ON public.site_content
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete site content" ON public.site_content
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
