-- Joker: extra counted workouts beyond the weekly requirement add up; every `joker_every` of them
-- earns a joker (at most `joker_max` per challenge) that can be spent to clear one week's fine.
alter table challenges add column joker_every int default 4;   -- null = no jokers
alter table challenges add column joker_max int not null default 2;
alter table fines drop constraint fines_status_check;
alter table fines add constraint fines_status_check check (status in ('claimed', 'paid', 'waived', 'joker'));
