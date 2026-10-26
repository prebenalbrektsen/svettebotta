create table kudos (
  workout_id int not null references workouts(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);

create table comments (
  id serial primary key,
  workout_id int not null references workouts(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_workout on comments (workout_id, created_at);

-- The family chat. user_id null = posted by the app itself ("Ida fullførte uka").
-- event_key stops the app from announcing the same thing twice.
create table messages (
  id serial primary key,
  user_id int references users(id) on delete cascade,
  body text not null,
  event_key text unique,
  created_at timestamptz not null default now()
);

alter table users add column chat_seen_at timestamptz not null default now();
