-- Feed posts — allow artists to share images with captions
create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_posts_user_idx on feed_posts (user_id);
create index if not exists feed_posts_created_idx on feed_posts (created_at desc);

drop trigger if exists feed_posts_set_updated_at on feed_posts;
create trigger feed_posts_set_updated_at
  before update on feed_posts
  for each row execute function set_updated_at();
