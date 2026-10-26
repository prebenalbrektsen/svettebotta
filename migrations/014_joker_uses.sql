-- Jokers are spare workouts the person applies to a finished week to fill missing workouts.
create table joker_uses (
  challenge_id int not null references challenges(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  week_start date not null,
  count int not null check (count > 0),
  created_at timestamptz not null default now(),
  primary key (challenge_id, user_id, week_start)
);
-- The first joker version (a whole free week, stored as a fine status) lived only a few minutes.
delete from fines where status = 'joker';
