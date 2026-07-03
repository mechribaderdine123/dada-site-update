
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.prevent_status_self_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT private.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.tracks_prevent_status_self_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT private.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete any track" ON public.tracks;
DROP POLICY IF EXISTS "Admins can update any track" ON public.tracks;
DROP POLICY IF EXISTS "Admins can view all tracks" ON public.tracks;
DROP POLICY IF EXISTS "Admins can manage all music files" ON storage.objects;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any track" ON public.tracks
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any track" ON public.tracks
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all tracks" ON public.tracks
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all music files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'music' AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'music' AND private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

DROP POLICY IF EXISTS "Public can view approved profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, artist_name, genre, city, bio, avatar_url,
  youtube, spotify, facebook, instagram, tiktok, twitter, created_at
FROM public.profiles
WHERE status = 'approved';

GRANT SELECT ON public.public_profiles TO anon, authenticated;
