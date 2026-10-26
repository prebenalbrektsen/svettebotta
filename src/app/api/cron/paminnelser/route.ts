import { activeChallenge, checkInDeadline, evaluateWeek, firstCountedWeek, WORKOUT_COLUMNS, type WeeklyTask, type Workout } from "@/lib/challenge";
import { query } from "@/lib/db";
import { once, push } from "@/lib/push";
import { sportLabel } from "@/lib/sports";
import { addDays, mondayOf, osloDate } from "@/lib/time";

// Scheduled reminders (vercel.json runs this a few times a day, never at night):
// - a workout's check-in deadline is coming up within 4 hours
// - Sunday evening: your week isn't in the bag yet
// Each reminder is sent once (push_sent). Vercel signs the call with CRON_SECRET.

const osloHour = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "numeric", hourCycle: "h23" }).format(new Date()));
const osloWeekday = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "short" }).format(new Date());

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Nei", { status: 401 });
  }
  const c = await activeChallenge();
  if (!c) return Response.json({ skipped: "ingen utfordring" });
  const today = osloDate();
  if (today < c.starts_on || today > c.ends_on) return Response.json({ skipped: "utenfor perioden" });

  const week = mondayOf(today);
  const members = await query<{ user_id: number; joined_at: Date }>("select user_id, joined_at from challenge_members where challenge_id = $1", [c.id]);
  const ids = members.map((m) => m.user_id);
  const workouts = await query<Workout>(
    `select ${WORKOUT_COLUMNS} from workouts
      where user_id = any($1::int[]) and started_at >= ($2::date)::timestamp at time zone 'Europe/Oslo'`,
    [ids, addDays(week, -1)],
  );
  const task = (await query<WeeklyTask>("select id, week_start, title, description, auto_sports from weekly_tasks where challenge_id = $1 and week_start = $2", [c.id, week]))[0];
  let sent = 0;

  // 1) Check-in deadlines within the next 4 hours.
  const now = Date.now();
  for (const w of workouts) {
    if (w.checked_in_at || w.rejected || w.duration_min < c.session_minutes) continue;
    const left = checkInDeadline(c, w).getTime() - now;
    if (left <= 0 || left > 4 * 3600000) continue;
    if (!(await once(`checkin:${w.id}`))) continue;
    const hours = Math.max(1, Math.round(left / 3600000));
    await push([w.user_id], "checkin", { title: `⏰ ${hours} t igjen til innsjekk`, body: `${sportLabel(w.sport)}-økta di teller ikke før du sjekker inn${c.proof_required ? " med bilde" : ""}.`, url: "/logg", tag: `checkin-${w.id}` });
    sent++;
  }

  // 2) Sunday from 17:00: whoever hasn't got the week in the bag yet.
  if (osloWeekday() === "Sun" && osloHour() >= 17) {
    for (const m of members) {
      if (firstCountedWeek(c, m.joined_at) > week) continue;
      const mine = workouts.filter((w) => w.user_id === m.user_id && mondayOf(osloDate(new Date(w.started_at))) === week);
      const r = evaluateWeek(c, week, mine, task, today);
      if (r.passed || !(await once(`sunday:${c.id}:${week}:${m.user_id}`))) continue;
      const missing = Math.max(0, c.min_sessions - r.qualifying);
      await push([m.user_id], "reminders", {
        title: "Uka glipper snart! ⏳",
        body: r.volumeMet ? `Du mangler ukeskravet «${task?.title}». Fristen er i kveld kl. 24.` : `Du mangler ${missing} økt${missing === 1 ? "" : "er"} – fristen er i kveld kl. 24. Ellers blir det ${c.penalty_kr} kr i bøtta.`,
        url: "/",
        tag: "sunday",
      });
      sent++;
    }
  }
  return Response.json({ sent });
}
