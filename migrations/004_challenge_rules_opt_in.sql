-- Rules that vary from challenge to challenge (alongside period, sessions, minutes and fine).
alter table challenges add column check_in_hours int default 24;   -- null = any time before the week closes
alter table challenges add column max_per_day int default 1;       -- null = no limit
alter table challenges add column proof_required boolean not null default true;
alter table challenges add column description text;

-- Participants opt in. Weeks that started before someone joined never count against them.
alter table challenge_members add column joined_at timestamptz not null default now();
update challenge_members m set joined_at = (c.starts_on)::timestamp at time zone 'Europe/Oslo'
  from challenges c where c.id = m.challenge_id;
