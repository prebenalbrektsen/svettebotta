import { activeChallenge } from "./challenge";
import { query } from "./db";
import { stravaConfigured, syncStrava } from "./strava";
import { addDays } from "./time";

let running = false;

/** Syncs every connected participant whose Strava data is more than 10 minutes old. */
export async function syncStale(): Promise<void> {
  if (running || !stravaConfigured()) return;
  running = true;
  try {
    const c = await activeChallenge();
    if (!c) return;
    const stale = await query<{ id: number }>(
      `select id from users where strava_refresh_token is not null
         and (strava_synced_at is null or strava_synced_at < now() - interval '10 minutes')`,
    );
    for (const u of stale) {
      await syncStrava(u.id, new Date(`${addDays(c.starts_on, -7)}T00:00:00Z`)).catch((e) => console.error("[autosync]", u.id, e));
    }
  } finally {
    running = false;
  }
}
