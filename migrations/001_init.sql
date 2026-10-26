-- Participants. Created by the admin; each gets an invite link to choose a password.
create table users (
  id serial primary key,
  name text not null,
  email text unique,
  password_hash text,
  invite_token text unique,
  is_admin boolean not null default false,
  color text not null default '#e4572e',
  strava_athlete_id bigint unique,
  strava_access_token text,
  strava_refresh_token text,
  strava_expires_at bigint,
  strava_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  token text primary key,
  user_id int not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- One challenge period. The rules vary per challenge, so they are columns, not code.
-- A week passes with min_sessions workouts of at least session_minutes,
-- or (if long_session_minutes is set) one workout of at least long_session_minutes.
create table challenges (
  id serial primary key,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  penalty_kr int not null,
  min_sessions int not null,
  session_minutes int not null,
  long_session_minutes int,
  vipps_info text,
  created_at timestamptz not null default now()
);

create table challenge_members (
  challenge_id int not null references challenges(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  primary key (challenge_id, user_id)
);

-- The admin's extra demand for a week, e.g. "one of the workouts must be in water".
create table weekly_tasks (
  id serial primary key,
  challenge_id int not null references challenges(id) on delete cascade,
  week_start date not null,
  title text not null,
  description text,
  -- Workouts of these sports meet the task by themselves (e.g. Swim for "in water").
  -- Otherwise the participant ticks it on the workout.
  auto_sports text[] not null default '{}',
  unique (challenge_id, week_start)
);

create table workouts (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  started_at timestamptz not null,
  duration_min int not null check (duration_min > 0),
  sport text not null,
  title text,
  distance_m int,
  elevation_m int,
  avg_hr int,
  source text not null default 'manual',
  strava_id bigint unique,
  proof_image bytea,
  proof_mime text,
  meets_task boolean not null default false,
  rejected boolean not null default false,
  created_at timestamptz not null default now()
);
create index workouts_user_started on workouts (user_id, started_at);

-- What happened to a failed week's fine. No row = owed.
-- 'claimed' = the participant says they paid, 'paid' = admin confirmed, 'waived' = admin let it go.
create table fines (
  challenge_id int not null references challenges(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('claimed', 'paid', 'waived')),
  note text,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id, week_start)
);
