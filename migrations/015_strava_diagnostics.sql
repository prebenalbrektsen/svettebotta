-- Strava connect without relying on the login cookie: on iPhone the approval often comes back in
-- Safari, which doesn't share cookies with the home-screen app. The state token says who it is.
create table oauth_states (
  token text primary key,
  user_id int not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- What Strava told us and what we did about it, so the admin can see why a workout didn't arrive.
create table strava_events (
  id serial primary key,
  owner_id bigint not null,
  user_id int references users(id) on delete set null,
  aspect text not null,
  object_type text not null,
  object_id bigint not null,
  result text not null,
  created_at timestamptz not null default now()
);
create index strava_events_created on strava_events (created_at desc);
