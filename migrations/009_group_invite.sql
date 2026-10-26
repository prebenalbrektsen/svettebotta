-- One shared invite link for the family chat. People who join through it wait for the admin's OK.
create table settings (
  key text primary key,
  value text not null
);
alter table users add column approved boolean not null default true;
