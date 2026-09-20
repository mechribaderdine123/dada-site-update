-- Dada Hip Hop Academy — initial PostgreSQL schema.
-- Applied once by src/server/db/migrate.server.ts and recorded in schema_migrations.

create extension if not exists pgcrypto;

-- Keeps updated_at accurate without the application having to remember it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- accounts --

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_key on users (lower(email));

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

create table if not exists profiles (
  id uuid primary key references users (id) on delete cascade,
  email text not null,
  artist_name text not null,
  slug text not null,
  genre text,
  city text,
  bio text,
  phone text,
  avatar_url text,
  cover_url text,
  accent_color text not null default '#00e5bf',
  youtube text,
  spotify text,
  facebook text,
  instagram text,
  tiktok text,
  twitter text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_slug_lower_key on profiles (lower(slug));
create index if not exists profiles_status_idx on profiles (status);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  role text not null check (role in ('admin', 'artist')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ----------------------------------------------------------------- music ---

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  genre text,
  audio_url text,
  cover_url text,
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_user_idx on tracks (user_id);
create index if not exists tracks_status_idx on tracks (status);

drop trigger if exists tracks_set_updated_at on tracks;
create trigger tracks_set_updated_at
  before update on tracks
  for each row execute function set_updated_at();

create table if not exists artist_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  youtube_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artist_videos_user_idx on artist_videos (user_id);

drop trigger if exists artist_videos_set_updated_at on artist_videos;
create trigger artist_videos_set_updated_at
  before update on artist_videos
  for each row execute function set_updated_at();

-- ----------------------------------------------------------- site content --

create table if not exists site_content (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_content_set_updated_at on site_content;
create trigger site_content_set_updated_at
  before update on site_content
  for each row execute function set_updated_at();

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists sponsors_set_updated_at on sponsors;
create trigger sponsors_set_updated_at
  before update on sponsors
  for each row execute function set_updated_at();

create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  description text not null default '',
  image_url text not null default '',
  month text not null default '',
  day text not null default '',
  place text not null default '',
  time text not null default '',
  sort_order integer not null default 0,
  is_finished boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workshops_set_updated_at on workshops;
create trigger workshops_set_updated_at
  before update on workshops
  for each row execute function set_updated_at();

create table if not exists studio_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'mic',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists studio_services_set_updated_at on studio_services;
create trigger studio_services_set_updated_at
  before update on studio_services
  for each row execute function set_updated_at();

create table if not exists studio_tags (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists studio_tags_set_updated_at on studio_tags;
create trigger studio_tags_set_updated_at
  before update on studio_tags
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- sessions --

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expires_idx on sessions (expires_at);

-- -------------------------------------------------------- public read view --

-- What anonymous visitors are allowed to see: approved artists that are not
-- staff accounts, without contact details.
create or replace view public_profiles as
select
  p.id,
  p.artist_name,
  p.slug,
  p.genre,
  p.city,
  p.bio,
  p.avatar_url,
  p.cover_url,
  p.accent_color,
  p.youtube,
  p.spotify,
  p.facebook,
  p.instagram,
  p.tiktok,
  p.twitter,
  p.status,
  p.created_at
from profiles p
where p.status = 'approved'
  and not exists (
    select 1 from user_roles r where r.user_id = p.id and r.role = 'admin'
  );
