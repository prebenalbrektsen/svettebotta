-- Web push: one row per phone/browser that said yes to notifications.
create table push_subscriptions (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- What each person wants to be notified about (missing key = on).
alter table users add column notify jsonb not null default '{}';

-- Scheduled reminders already sent, so each one goes out once.
create table push_sent (
  key text primary key,
  sent_at timestamptz not null default now()
);
