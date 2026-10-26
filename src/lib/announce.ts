import { activeChallenge, evaluateWeek, loadBoard, WORKOUT_COLUMNS, type WeeklyTask, type Workout } from "./challenge";
import { one, query } from "./db";
import { addDays, isoWeekNumber, mondayOf, osloDate } from "./time";

async function post(eventKey: string, body: string): Promise<void> {
  await query("insert into messages (user_id, body, event_key) values (null, $1, $2) on conflict (event_key) do nothing", [body, eventKey]);
}

/** Posts "X fullførte uka" in the chat the first time someone's current week is in the bag. */
export async function announceWeek(userId: number): Promise<void> {
  const c = await activeChallenge();
  if (!c) return;
  const week = mondayOf(osloDate());
  if (week < mondayOf(c.starts_on) || week > c.ends_on) return;
  const member = await one<{ name: string }>(
    "select u.name from challenge_members m join users u on u.id = m.user_id where m.challenge_id = $1 and m.user_id = $2",
    [c.id, userId],
  );
  if (!member) return;
  const [workouts, task] = await Promise.all([
    query<Workout>(
      `select ${WORKOUT_COLUMNS} from workouts where user_id = $1
         and started_at >= ($2::date)::timestamp at time zone 'Europe/Oslo'
         and started_at < ($2::date + 7)::timestamp at time zone 'Europe/Oslo'`,
      [userId, week],
    ),
    one<WeeklyTask>("select id, week_start, title, description, auto_sports from weekly_tasks where challenge_id = $1 and week_start = $2", [c.id, week]),
  ]);
  if (!evaluateWeek(c, week, workouts, task ?? undefined).passed) return;
  const placed = await one<{ n: number }>("select count(*)::int as n from messages where event_key like $1", [`week:${c.id}:${week}:%`]);
  const medal = ["🥇", "🥈", "🥉"][placed!.n] ?? "✅";
  await post(`week:${c.id}:${week}:${userId}`, `${medal} ${member.name} har uke ${isoWeekNumber(week)} i boks!`);
}

/** Once a week is over: a short summary of who made it and what went in the bucket. */
// Remembered per server instance, so the summary check doesn't touch the database on every page view.
let summaryDoneFor = "";

export async function announceWeekSummary(): Promise<void> {
  const lastWeek = addDays(mondayOf(osloDate()), -7);
  if (summaryDoneFor === lastWeek) return;
  const c = await activeChallenge();
  if (!c) return;
  if (lastWeek < mondayOf(c.starts_on) || lastWeek > c.ends_on) { summaryDoneFor = lastWeek; return; }
  if (await one("select 1 from messages where event_key = $1", [`summary:${c.id}:${lastWeek}`])) { summaryDoneFor = lastWeek; return; }
  const board = await loadBoard(c);
  const i = board.weeks.indexOf(lastWeek);
  if (i < 0) return;
  // People who had not joined yet that week are left out entirely.
  const counted = board.members.filter((m) => m.results[i].state !== "before");
  if (!counted.length) return;
  const failed = counted.filter((m) => !m.results[i].passed);
  const made = counted.length - failed.length;
  const body = failed.length
    ? `🏁 Uke ${isoWeekNumber(lastWeek)} er over: ${made} av ${counted.length} klarte det. ${failed.map((m) => m.name).join(", ")} spytter ${c.penalty_kr} kr i bøtta. 💸`
    : `🏁 Uke ${isoWeekNumber(lastWeek)} er over: ALLE klarte det! Bøtta sulter. 🔥`;
  await post(`summary:${c.id}:${lastWeek}`, body);
  summaryDoneFor = lastWeek;
}
