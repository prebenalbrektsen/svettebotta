-- A long workout counts as this many of the week's workouts (instead of completing the week).
-- Set it equal to min_sessions to get the old «one long workout is enough» rule.
alter table challenges add column long_session_counts int not null default 2;
