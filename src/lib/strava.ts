import { announceWeek } from "./announce";
import { one, query } from "./db";

// Strava is the hub: Garmin, Apple Watch (via the Strava app), Polar, Suunto and Wahoo all sync
// to it automatically, so one integration covers every watch the family uses.
const API = "https://www.strava.com/api/v3";

export function stravaConfigured(): boolean {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function redirectUri(): string {
  return `${process.env.APP_URL}/api/strava/callback`;
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

type TokenResponse = { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, ...body }),
  });
  if (!res.ok) throw new Error(`Strava token ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function connectStrava(userId: number, code: string): Promise<void> {
  const t = await tokenRequest({ code, grant_type: "authorization_code" });
  // A Strava account can only belong to one participant; move it if someone reconnects it.
  await query("update users set strava_athlete_id = null where strava_athlete_id = $1 and id <> $2", [t.athlete!.id, userId]);
  await query(
    `update users set strava_athlete_id = $2, strava_access_token = $3, strava_refresh_token = $4, strava_expires_at = $5
      where id = $1`,
    [userId, t.athlete!.id, t.access_token, t.refresh_token, t.expires_at],
  );
}

async function accessToken(userId: number): Promise<string | null> {
  const u = await one<{ strava_access_token: string | null; strava_refresh_token: string | null; strava_expires_at: string | null }>(
    "select strava_access_token, strava_refresh_token, strava_expires_at from users where id = $1",
    [userId],
  );
  if (!u?.strava_refresh_token) return null;
  if (Number(u.strava_expires_at) > Date.now() / 1000 + 120) return u.strava_access_token;
  const t = await tokenRequest({ refresh_token: u.strava_refresh_token, grant_type: "refresh_token" });
  await query("update users set strava_access_token = $2, strava_refresh_token = $3, strava_expires_at = $4 where id = $1", [
    userId, t.access_token, t.refresh_token, t.expires_at,
  ]);
  return t.access_token;
}

export async function disconnectStrava(userId: number): Promise<void> {
  const token = await accessToken(userId).catch(() => null);
  if (token) await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", headers: { authorization: `Bearer ${token}` } }).catch(() => {});
  await query(
    `update users set strava_athlete_id = null, strava_access_token = null, strava_refresh_token = null, strava_expires_at = null
      where id = $1`,
    [userId],
  );
}

type Activity = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number;
  average_heartrate?: number;
};

/** Imports the user's Strava activities since `since`. Returns how many were new. */
export async function syncStrava(userId: number, since: Date): Promise<number> {
  const token = await accessToken(userId);
  if (!token) return 0;
  let added = 0;
  for (let page = 1; page <= 5; page++) {
    const params = new URLSearchParams({ after: String(Math.floor(since.getTime() / 1000)), per_page: "100", page: String(page) });
    const res = await fetch(`${API}/athlete/activities?${params}`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Strava activities ${res.status}: ${await res.text()}`);
    const activities = (await res.json()) as Activity[];
    for (const a of activities) {
      // Moving time, so a watch left running in the changing room doesn't count; gym sessions
      // often have no "moving" so fall back to elapsed.
      const minutes = Math.round((a.moving_time || a.elapsed_time) / 60);
      if (minutes < 1) continue;
      const rows = await query<{ id: number; inserted: boolean }>(
        `insert into workouts (user_id, started_at, duration_min, sport, title, distance_m, elevation_m, avg_hr, source, strava_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'strava', $9)
         on conflict (strava_id) do update set
           duration_min = excluded.duration_min, sport = excluded.sport, title = excluded.title,
           distance_m = excluded.distance_m, elevation_m = excluded.elevation_m, avg_hr = excluded.avg_hr
         returning id, (xmax = 0) as inserted`,
        [userId, a.start_date, minutes, a.sport_type, a.name, Math.round(a.distance) || null,
          Math.round(a.total_elevation_gain) || null, a.average_heartrate ? Math.round(a.average_heartrate) : null, a.id],
      );
      if (rows[0]?.inserted) {
        added++;
        await mergeManualDuplicate(userId, rows[0].id, a.start_date);
      }
    }
    if (activities.length < 100) break;
  }
  await query("update users set strava_synced_at = now() where id = $1", [userId]);
  if (added) await announceWeek(userId);
  return added;
}

/**
 * Someone logged a workout by hand and then the watch synced the same one: keep the Strava version
 * (real watch data), but carry over the photo, weekly-task tick, kudos and comments from the
 * manual one, so it is never counted twice. "Same workout" = started within 90 minutes.
 */
export async function mergeManualDuplicate(userId: number, stravaWorkoutId: number, startDate: string): Promise<void> {
  const manual = await one<{ id: number }>(
    `select id from workouts
      where user_id = $1 and source = 'manual' and abs(extract(epoch from started_at - $2::timestamptz)) < 90 * 60
      order by abs(extract(epoch from started_at - $2::timestamptz)) limit 1`,
    [userId, startDate],
  );
  if (!manual) return;
  await query(
    `update workouts s set
       proof_image = coalesce(s.proof_image, m.proof_image), proof_mime = coalesce(s.proof_mime, m.proof_mime),
       meets_task = s.meets_task or m.meets_task, rejected = s.rejected or m.rejected,
       checked_in_at = coalesce(s.checked_in_at, m.checked_in_at)
     from workouts m where s.id = $1 and m.id = $2`,
    [stravaWorkoutId, manual.id],
  );
  await query("insert into kudos (workout_id, user_id, created_at) select $1, user_id, created_at from kudos where workout_id = $2 on conflict do nothing", [stravaWorkoutId, manual.id]);
  await query("update comments set workout_id = $1 where workout_id = $2", [stravaWorkoutId, manual.id]);
  await query("delete from workouts where id = $1", [manual.id]);
}
