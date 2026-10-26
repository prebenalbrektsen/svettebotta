-- Face ID / Touch ID / fingerprint login (WebAuthn passkeys).
create table passkeys (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  name text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- One-time WebAuthn challenges, valid for a few minutes.
create table webauthn_challenges (
  token text primary key,
  user_id int references users(id) on delete cascade,
  purpose text not null,
  challenge text not null,
  expires_at timestamptz not null
);

-- Who may sign up for a challenge: everyone in the app, or only people the admin picks.
alter table challenges add column join_mode text not null default 'open' check (join_mode in ('open', 'selected'));
create table challenge_invites (
  challenge_id int not null references challenges(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  primary key (challenge_id, user_id)
);
