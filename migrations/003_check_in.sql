-- A workout only counts once its owner has checked it in with a photo, within 24 hours
-- (and before the week closes). Strava workouts arrive unchecked; manual ones are checked in
-- when they are logged. imported_at starts the 24-hour clock for workouts that sync late.
alter table workouts add column checked_in_at timestamptz;
alter table workouts add column imported_at timestamptz not null default now();
-- Everything already in the database (demo data) counts as checked in on time.
update workouts set imported_at = started_at, checked_in_at = started_at + make_interval(mins => duration_min + 30);
