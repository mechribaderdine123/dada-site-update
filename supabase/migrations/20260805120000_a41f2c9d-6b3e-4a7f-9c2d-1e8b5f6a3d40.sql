CREATE TABLE public.studio_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'mic' CHECK (icon IN ('mic', 'music', 'sliders', 'building', 'video', 'graduation')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.studio_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_services TO authenticated;
GRANT ALL ON public.studio_services TO service_role;

ALTER TABLE public.studio_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio services are viewable by everyone"
  ON public.studio_services FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert studio services"
  ON public.studio_services FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update studio services"
  ON public.studio_services FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete studio services"
  ON public.studio_services FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_studio_services_updated_at
  BEFORE UPDATE ON public.studio_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.studio_services (title, description, icon, sort_order) VALUES
  ('Enregistrement Vocal', 'Cabine acoustique professionnelle et équipement haut de gamme pour des prises de son cristallines.', 'mic', 1),
  ('Création Musicale', 'Composition, arrangements et production sur mesure pour donner vie à vos projets artistiques.', 'music', 2),
  ('Mixage et Editing', 'Post-production professionnelle pour un son parfaitement équilibré et prêt pour la diffusion.', 'sliders', 3),
  ('Location Studio', 'Espace moderne et équipé disponible à la location pour vos projets personnels ou professionnels.', 'building', 4),
  ('Tournage Vidéos', 'Sessions live et clips vidéo filmés dans notre studio avec éclairage professionnel.', 'video', 5),
  ('Coaching Artistique', 'Accompagnement personnalisé pour développer votre technique et affiner votre identité artistique.', 'graduation', 6);


CREATE TABLE public.studio_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.studio_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_tags TO authenticated;
GRANT ALL ON public.studio_tags TO service_role;

ALTER TABLE public.studio_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio tags are viewable by everyone"
  ON public.studio_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert studio tags"
  ON public.studio_tags FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update studio tags"
  ON public.studio_tags FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete studio tags"
  ON public.studio_tags FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_studio_tags_updated_at
  BEFORE UPDATE ON public.studio_tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.studio_tags (label, sort_order) VALUES
  ('Artistes solos', 1),
  ('Groupes', 2),
  ('Danseurs', 3),
  ('Créateurs de contenu', 4),
  ('Ecoles', 5),
  ('Entreprise', 6),
  ('Rappeurs', 7),
  ('Beatmakers', 8),
  ('Chanteurs', 9);
