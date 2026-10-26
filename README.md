# Svettebøtta

The family training challenge: weekly workout rules, fines to the Vipps bøtekasse, Strava sync,
stats and a group chat. Next.js 16 + Postgres (plain SQL migrations), mobile-first, Norwegian UI.

## Run locally

```sh
npm install
npm run db:start      # local Postgres on a unix socket, prints DATABASE_URL for .env
npm run db:migrate
npm run dev           # http://127.0.0.1:3100
```

The first account created on /login becomes the admin. Try it out with fake data:
`npm run db:reset && npm run db:start && npm run db:migrate && npm run seed:demo`
(log in as preben@demo.no, password demo1234).

## How the rules work

- A challenge has a period, a fine, and a weekly rule: `min_sessions` workouts of at least
  `session_minutes`, or one workout of at least `long_session_minutes` (optional). All of it can be
  changed in Admin, and the fines are recalculated.
- Weeks run Monday 00:00 to Sunday 24:00, Oslo time. A finished week that missed the rule is a fine.
- Weekly tasks ("one workout in water") apply to one week: at least one qualifying workout must meet
  them, either ticked by the participant or automatically by sport (water sports).
- Fines: owed → participant presses «Jeg har betalt» (claimed) → admin confirms (paid) or waives.
- Manual workouts need a proof photo. Strava workouts count by themselves; the admin can reject any.
- Once a week is over, nobody but the admin can log workouts for it.

## Strava

Garmin, Apple Watch (through the Strava app), Polar, Suunto and Wahoo all sync to Strava, so Strava
is the only integration.

1. Create an API app at https://www.strava.com/settings/api. Set *Authorization Callback Domain* to
   the app's domain (`127.0.0.1` locally).
2. Put `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in `.env`.
3. In the Strava API settings, raise athlete capacity to 10 (you can do this yourself with a Strava
   subscription). More than 10 people needs Strava's review.

Participants press «Koble til Strava» under *Meg*. Workouts are fetched when they connect, when they
press «Hent nye økter», and automatically every 10 minutes while anyone is using the app.

## Deploying

Any Node host with Postgres works (Vercel + Neon, or Railway). Set `DATABASE_URL`, `APP_URL`
(the public https origin, used for invite links and the Strava callback) and the Strava keys, then
run `npm run db:migrate` against the production database.
