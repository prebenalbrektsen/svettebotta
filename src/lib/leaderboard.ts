import type { Board, Challenge, Workout } from "./challenge";
import { query } from "./db";
import { addDays, mondayOf, osloDate } from "./time";

type Member = Board["members"][number];
export type Period = "uke" | "alt";

/** Everything a leaderboard or a profile needs about one person, for one period. */
export type PersonStats = {
  m: Member;
  weeksPassed: number;
  minutes: number;
  sessions: number;
  runKm: number;
  kudosReceived: number;
  kudosGiven: number;
  streak: number; // weeks in a row in the bag, up to now
  bestStreak: number;
  longest: Workout | null;
};

const counts = (w: Workout) => !!w.checked_in_at && !w.rejected;
const RUN = ["Run", "TrailRun", "VirtualRun"];

function streaks(m: Member): { streak: number; best: number } {
  // Finished weeks, plus this week once it's already in the bag.
  const weeks = m.results.filter((r) => r.state === "done" || (r.state === "running" && r.passed));
  let best = 0, run = 0;
  for (const r of weeks) { run = r.passed ? run + 1 : 0; best = Math.max(best, run); }
  return { streak: run, best };
}

export async function personStats(c: Challenge, board: Board, period: Period): Promise<PersonStats[]> {
  const week = board.currentWeek;
  const inPeriod = (w: Workout) => period === "alt" || mondayOf(osloDate(new Date(w.started_at))) === week;
  const given = await query<{ user_id: number; n: number }>(
    `select k.user_id, count(*)::int as n from kudos k join workouts w on w.id = k.workout_id
      where w.started_at >= ($1::date)::timestamp at time zone 'Europe/Oslo'
        and w.started_at < ($2::date + 1)::timestamp at time zone 'Europe/Oslo'
      group by k.user_id`,
    [period === "alt" ? board.weeks[0] : week, period === "alt" ? c.ends_on : addDays(week, 6)],
  );
  const givenBy = new Map(given.map((g) => [g.user_id, g.n]));
  return board.members.map((m) => {
    const ws = m.workouts.filter((w) => counts(w) && inPeriod(w));
    const { streak, best } = streaks(m);
    const weekResults = period === "alt" ? m.results : m.results.filter((r) => r.week === week);
    return {
      m,
      weeksPassed: weekResults.filter((r) => r.state !== "future" && r.state !== "before" && r.passed).length,
      minutes: ws.reduce((s, w) => s + w.duration_min, 0),
      sessions: ws.length,
      runKm: ws.filter((w) => RUN.includes(w.sport)).reduce((s, w) => s + (w.distance_m ?? 0), 0) / 1000,
      kudosReceived: ws.reduce((s, w) => s + w.kudos_by.length, 0),
      kudosGiven: givenBy.get(m.id) ?? 0,
      streak,
      bestStreak: best,
      longest: ws.reduce<Workout | null>((a, w) => (!a || w.duration_min > a.duration_min ? w : a), null),
    };
  });
}

export const BOARDS = [
  { id: "uker", label: "Uker i boks", value: (p: PersonStats) => p.weeksPassed, fmt: (v: number) => `${v} ${v === 1 ? "uke" : "uker"}`, tie: (p: PersonStats) => p.minutes },
  { id: "minutter", label: "Minutter", value: (p: PersonStats) => p.minutes, fmt: (v: number) => `${v} min`, tie: (p: PersonStats) => p.sessions },
  { id: "okter", label: "Økter", value: (p: PersonStats) => p.sessions, fmt: (v: number) => `${v} økter`, tie: (p: PersonStats) => p.minutes },
  { id: "km", label: "Km løpt", value: (p: PersonStats) => Math.round(p.runKm * 10) / 10, fmt: (v: number) => `${v.toLocaleString("nb-NO")} km`, tie: (p: PersonStats) => p.minutes },
  { id: "kudos", label: "Kudos fått", value: (p: PersonStats) => p.kudosReceived, fmt: (v: number) => `${v} 🔥`, tie: (p: PersonStats) => p.kudosGiven },
  { id: "heia", label: "Heiaropet (kudos gitt)", value: (p: PersonStats) => p.kudosGiven, fmt: (v: number) => `${v} gitt`, tie: (p: PersonStats) => p.kudosReceived },
  { id: "streak", label: "Uker på rad", value: (p: PersonStats) => p.streak, fmt: (v: number) => `${v} på rad`, tie: (p: PersonStats) => p.bestStreak },
] as const;

export type BoardId = (typeof BOARDS)[number]["id"];

export function rank(stats: PersonStats[], boardId: BoardId) {
  const b = BOARDS.find((x) => x.id === boardId) ?? BOARDS[0];
  return [...stats]
    .sort((a, z) => b.value(z) - b.value(a) || b.tie(z) - b.tie(a))
    .map((p) => ({ p, value: b.value(p), text: b.fmt(b.value(p)) }));
}

/** Who reached the week first: the earliest «har uka i boks» announcement. */
export async function firstToFinish(c: Challenge, week: string): Promise<number | null> {
  const row = await query<{ event_key: string }>(
    "select event_key from messages where event_key like $1 order by created_at limit 1",
    [`week:${c.id}:${week}:%`],
  );
  return row[0] ? Number(row[0].event_key.split(":").at(-1)) : null;
}

/** How many weeks each person was the first to finish. */
export async function firstFinishCounts(c: Challenge): Promise<Map<number, number>> {
  const rows = await query<{ event_key: string }>(
    `select distinct on (split_part(event_key, ':', 3)) event_key from messages
      where event_key like $1 order by split_part(event_key, ':', 3), created_at`,
    [`week:${c.id}:%`],
  );
  const counts = new Map<number, number>();
  for (const r of rows) {
    const id = Number(r.event_key.split(":").at(-1));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
