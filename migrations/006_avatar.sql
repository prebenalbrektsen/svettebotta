-- Profile picture: a 256 px square WebP (~10 KB). avatar_updated_at busts the browser cache.
alter table users add column avatar bytea;
alter table users add column avatar_updated_at timestamptz;
