-- Daily plans: square schedule images ("planning lundi", "planning mardi", …)
-- shown on the Cours & Activités page. One day holds many plans; visitors pick
-- a day with the filter and only that day's plans are displayed.

create table if not exists daily_plans (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  title text not null default '',
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_plans_day_idx on daily_plans (day, sort_order);

drop trigger if exists daily_plans_set_updated_at on daily_plans;
create trigger daily_plans_set_updated_at
  before update on daily_plans
  for each row execute function set_updated_at();
