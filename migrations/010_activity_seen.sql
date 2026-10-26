-- When the person last looked at «Til deg» (kudos and comments on their workouts).
alter table users add column activity_seen_at timestamptz not null default now();
