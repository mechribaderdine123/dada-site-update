-- Moderation: every track and feed post an artist submits must be approved by an
-- admin before it can appear publicly.
--
-- 002_publish_tracks.sql had switched tracks to auto-approve, so undo that: new
-- rows go back to 'pending' and the admin must approve them explicitly.

alter table tracks alter column status set default 'pending';

-- feed_posts had no moderation at all; give it the same three-state status.
alter table feed_posts add column if not exists status text not null default 'pending';
alter table feed_posts drop constraint if exists feed_posts_status_check;
alter table feed_posts add constraint feed_posts_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists feed_posts_status_idx on feed_posts (status);

-- Anything submitted before this migration has never been reviewed, so hold it
-- for review rather than grandfathering it as public.
update feed_posts set status = 'pending' where status is distinct from 'rejected';
