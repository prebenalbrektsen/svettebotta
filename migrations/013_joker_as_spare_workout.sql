-- Jokers are now spare workouts: each extra counted workout beyond the requirement banks one
-- (joker_every = 1), you can hold at most joker_max, and they fill missing workouts automatically
-- when a week ends. Challenges made earlier today with the old default (4) move to the new one.
alter table challenges alter column joker_every set default 1;
update challenges set joker_every = 1 where joker_every = 4;
