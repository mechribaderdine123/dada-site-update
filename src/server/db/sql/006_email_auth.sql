-- E-mail confirmation and password reset support.
--
-- `users.email_verified_at` is null until the artist proves they own the
-- address. Existing accounts keep working: every row that predates this
-- migration is marked verified. Single-use tokens are stored hashed, so a
-- database leak cannot be replayed as a password reset.

alter table users add column if not exists email_verified_at timestamptz;

update users set email_verified_at = created_at where email_verified_at is null;

create table if not exists auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  purpose text not null check (purpose in ('verify_email', 'password_reset')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists auth_tokens_user_idx on auth_tokens (user_id);
create index if not exists auth_tokens_expires_idx on auth_tokens (expires_at);

-- Sign-in may only succeed once the address is confirmed.
create index if not exists users_email_verified_idx on users (lower(email))
  where email_verified_at is not null;