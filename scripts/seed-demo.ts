// Fills an EMPTY local database with a fake family and three weeks of history, for trying the
// app out. Everyone's password is "demo1234". Run: npm run db:reset && npm run db:start &&
// npm run db:migrate && npm run seed:demo
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const day = (offset: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};
const monday = (() => { const d = day(0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; })();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (d: Date, n: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

async function main() {
  const { rows } = await pool.query("select count(*)::int as n from users");
  if (rows[0].n > 0) throw new Error("Databasen er ikke tom – kjør db:reset først.");
  const hash = await bcrypt.hash("demo1234", 10);
  const people = [
    ["Preben", "preben@demo.no", true, "#e4572e"],
    ["Mamma", "mamma@demo.no", false, "#2e86ab"],
    ["Pappa", "pappa@demo.no", false, "#7a9e3e"],
    ["Ida", "ida@demo.no", false, "#a23b72"],
    ["Jonas", "jonas@demo.no", false, "#f18f01"],
  ] as const;
  const ids: number[] = [];
  for (const [name, email, admin, color] of people) {
    const r = await pool.query("insert into users (name, email, password_hash, is_admin, color) values ($1,$2,$3,$4,$5) returning id", [name, email, hash, admin, color]);
    ids.push(r.rows[0].id);
  }
  const start = plus(monday, -21);
  const c = await pool.query(
    `insert into challenges (name, starts_on, ends_on, penalty_kr, min_sessions, session_minutes, long_session_minutes, vipps_info)
     values ('Høstbøtta 2026', $1, $2, 50, 3, 35, 60, 'Bøtekassa #12345') returning id`,
    [iso(start), iso(plus(start, 8 * 7 - 1))],
  );
  const cid = c.rows[0].id;
  for (const id of ids) await pool.query("insert into challenge_members (challenge_id, user_id, joined_at) values ($1, $2, $3)", [cid, id, start]);
  await pool.query("insert into weekly_tasks (challenge_id, week_start, title, description, auto_sports) values ($1,$2,'En økt i vann','Svømming, vannjogging eller aquagym.',$3)", [cid, iso(plus(monday, -7)), ["Swim", "Rowing", "Kayaking", "StandUpPaddling"]]);

  // [person index, day offset from challenge start, sport, minutes, km]
  const w: [number, number, string, number, number | null][] = [
    [0, 0, "Run", 42, 7.4], [0, 2, "WeightTraining", 55, null], [0, 5, "Run", 38, 6.1],
    [1, 1, "Walk", 50, 4.8], [1, 3, "Yoga", 40, null], [1, 6, "Swim", 45, 1.6],
    [2, 2, "Ride", 75, 31],
    [3, 0, "WeightTraining", 45, null], [3, 4, "WeightTraining", 30, null],
    [4, 1, "Run", 36, 6.0], [4, 3, "Soccer", 90, null], [4, 5, "Run", 40, 7.1],
    [0, 7, "Run", 45, 8.0], [0, 9, "WeightTraining", 60, null], [0, 11, "Run", 36, 6.3],
    [1, 8, "Walk", 40, 4.0], [1, 10, "Pilates", 45, null], [1, 13, "Walk", 50, 5.2],
    [2, 9, "Ride", 65, 28], [3, 8, "WeightTraining", 50, null], [3, 10, "Run", 35, 5.0], [3, 12, "HighIntensityIntervalTraining", 40, null],
    [4, 12, "Hike", 140, 11],
    [0, 14, "Swim", 40, 1.5], [0, 16, "Run", 50, 9.2], [0, 18, "WeightTraining", 45, null],
    [1, 15, "Swim", 45, 1.4], [1, 17, "Walk", 45, 4.4], [1, 19, "Yoga", 40, null],
    [2, 16, "Ride", 70, 30],
    [3, 14, "WeightTraining", 50, null], [3, 16, "Swim", 36, 1.2], [3, 18, "Run", 40, 6.5],
    [4, 15, "Run", 45, 8.0], [4, 17, "Run", 38, 6.5],
    [0, 21, "Run", 40, 7.0], [1, 21, "Walk", 45, 4.2], [3, 21, "WeightTraining", 55, null],
  ];
  for (const [p, off, sport, min, km] of w) {
    const at = plus(start, off);
    if (at > new Date()) continue;
    await pool.query(
      `insert into workouts (user_id, started_at, duration_min, sport, distance_m, source, avg_hr, imported_at, checked_in_at)
       values ($1, $2, $3, $4, $5, $6, $7, $2, $2::timestamptz + make_interval(mins => $3 + 30))`,
      [ids[p], at, min, sport, km ? Math.round(km * 1000) : null, p % 2 ? "manual" : "strava", 120 + ((p * 7 + off) % 40)],
    );
  }
  // Pappa paid week 1, Ida says she paid week 1.
  await pool.query("insert into fines (challenge_id, user_id, week_start, status) values ($1,$2,$3,'paid'),($1,$4,$3,'claimed')", [cid, ids[2], iso(start), ids[3]]);
  console.log("Demo-data lagt inn. Logg inn som preben@demo.no / demo1234");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
