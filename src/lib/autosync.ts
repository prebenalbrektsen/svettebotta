import { activeChallenge } from "./challenge";
import { one, query } from "./db";
import { stravaConfigured, syncStrava } from "./strava";
import { addDays } from "./time";

let running = false;

/** Syncs connected participants whose Strava data is stale (10 min, or 6 h once the webhook is on). */
export async function syncStale(): Promise<void> {
  if (running || !stravaConfigured()) return;
  running = true;
  try {
    const c = await activeChallenge();
    if (!c) return;
    // With the Strava webhook on, new workouts arrive by themselves; this is only a safety net,
    // so it runs rarely and keeps the database asleep when nobody needs it.
    const webhookOn = !!(await one("select 1 from settings where key = 'strava_webhook'"));
    const stale = await query<{ id: number }>(
      `select id from users where strava_refresh_token is not null
         and (strava_synced_at is null or strava_synced_at < now() - $1::interval)`,
      [webhookOn ? "6 hours" : "10 minutes"],
    );
    for (const u of stale) {
      await syncStrava(u.id, new Date(`${addDays(c.starts_on, -7)}T00:00:00Z`)).catch((e) => console.error("[autosync]", u.id, e));
    }
  } finally {
    running = false;
  }
}
