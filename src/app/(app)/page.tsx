import Link from "next/link";
import { Pill, statusLabel, WeekProgress } from "@/components/WeekProgress";
import { ClaimPaid } from "@/components/ClaimPaid";
import { WorkoutRow } from "@/components/WorkoutRow";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { JoinCard } from "@/components/JoinCard";
import { RoleTag } from "@/components/RoleTag";
import { activeChallenge, loadBoard, mayJoin, ruleParts, type Challenge } from "@/lib/challenge";
import { query } from "@/lib/db";
import { sportLabel } from "@/lib/sports";
import { addDays, formatDay, formatWeekRange, fromOsloLocal, isoWeekNumber, mondayOf, osloDate } from "@/lib/time";

function timeLeft(week: string): string {
  const ms = fromOsloLocal(`${addDays(week, 7)}T00:00`).getTime() - Date.now();
  const hours = Math.floor(ms / 3600000);
  if (hours >= 48) return `${Math.floor(hours / 24)} dager igjen`;
  if (hours >= 1) return `${hours} timer igjen`;
  return `${Math.max(1, Math.floor(ms / 60000))} min igjen!`;
}

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ logget?: string }> }) {
  const user = await requireUser();
  const { logget } = await searchParams;
  const c = await activeChallenge();
  if (!c) {
    return (
      <div className="card mt-6 p-6">
        <h1 className="display text-3xl">Ingen utfordring ennå</h1>
        <p className="mt-2 text-muted">{user.is_admin ? "Opprett den første utfordringen i admin." : "Admin har ikke startet en utfordring ennå."}</p>
        {user.is_admin && <Link className="btn btn-heat mt-4" href="/admin">Til admin</Link>}
      </div>
    );
  }
  const board = await loadBoard(c);
  // Challenges coming up that this person has not signed up for (or has, and may back out of).
  // Only the ones this person may join: open ones, or ones the admin picked them for.
  const upcoming = await query<Challenge & { joined: boolean; count: number }>(
    `select c.*, exists(select 1 from challenge_members m where m.challenge_id = c.id and m.user_id = $2) as joined,
            (select count(*)::int from challenge_members m where m.challenge_id = c.id) as count
       from challenges c where c.starts_on > $1::date and c.id <> $3
        and (c.join_mode = 'open' or exists(select 1 from challenge_invites i where i.challenge_id = c.id and i.user_id = $2)
             or exists(select 1 from challenge_members m where m.challenge_id = c.id and m.user_id = $2))
      order by c.starts_on`,
    [osloDate(), user.id, c.id],
  );
  const today = osloDate();
  const week = board.weeks.includes(board.currentWeek) ? board.currentWeek : today < board.weeks[0] ? board.weeks[0] : board.weeks.at(-1)!;
  const weekIndex = board.weeks.indexOf(week);
  const task = board.tasks.get(week);
  const me = board.members.find((m) => m.id === user.id);
  const myWeek = me?.results[weekIndex];
  const allowed = !me && (await mayJoin(c, user.id));
  // The admin can paste the bøtekasse's Vipps link; then paying is one tap that opens the Vipps app.
  const vippsLink = /^https:\/\/\S+$/.test(c.vipps_info?.trim() ?? "") ? c.vipps_info!.trim() : null;
  const owedWeeks = me?.results.filter((r) => r.fine === "owed").map((r) => r.week) ?? [];
  const started = today >= c.starts_on;
  const over = today > c.ends_on;

  const potPaid = board.members.reduce((s, m) => s + m.paidKr, 0);
  const potOpen = board.members.reduce((s, m) => s + m.owedKr + m.claimedKr, 0);
  const myPending = me?.results.reduce((n, r) => n + r.pending, 0) ?? 0;
  // Only checked-in workouts are part of the challenge, so only they go in the shared feed.
  const feed = board.members
    .flatMap((m) => m.workouts.filter((w) => w.checked_in_at).map((w) => ({ w, m })))
    .sort((a, b) => +new Date(b.w.started_at) - +new Date(a.w.started_at))
    .slice(0, 5);

  return (
    <div className="space-y-5 pt-2">
      {logget && <p className="rounded-xl bg-ok-soft px-4 py-3 font-semibold text-ok">Økta er registrert. Sterkt! 💪</p>}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-muted">{c.name}</p>
          <p className="text-sm font-semibold text-muted">{weekIndex + 1}/{board.weeks.length} uker</p>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${((weekIndex + 1) / board.weeks.length) * 100}%` }} /></div>
        <h1 className="display mt-3 text-6xl">Uke {isoWeekNumber(week)}</h1>
        <p className="mt-2 text-muted">
          {formatWeekRange(week)} ·{" "}
          {over ? "Utfordringen er ferdig 🎉" : !started ? `Starter ${formatDay(c.starts_on)}` : <strong className="text-ink">{timeLeft(week)}</strong>}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {ruleParts(c).map((r) => <li key={r} className="rounded-full bg-line/70 px-2.5 py-1 text-xs font-semibold">{r}</li>)}
        </ul>
      </section>

      {!me && (allowed
        ? <JoinCard c={c} joined={false} count={board.members.length} />
        : <p className="card p-4 text-sm text-muted">Du er ikke med i {c.name}. Vil du være med, si fra til kontrolløren.</p>)}

      {myPending > 0 && (
        <Link href="/logg" className="block rounded-2xl bg-warn-soft p-4 text-warn">
          <p className="font-bold">{myPending === 1 ? "1 økt venter på innsjekk" : `${myPending} økter venter på innsjekk`}</p>
          <p className="text-sm">Sjekk inn{c.proof_required ? " med bilde" : ""}{c.check_in_hours ? ` innen ${c.check_in_hours} timer` : ""}, ellers teller den ikke →</p>
        </Link>
      )}

      {me && myWeek && (
        <section className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Din uke</h2>
            <Pill tone={statusLabel(c, myWeek).tone}>{statusLabel(c, myWeek).text}</Pill>
          </div>
          <div className="mt-3"><WeekProgress c={c} r={myWeek} /></div>
          <p className="mt-2 text-sm text-muted">
            {myWeek.state === "before"
              ? "Du er med fra neste uke."
              : `${Math.min(myWeek.qualifying, c.min_sessions)} av ${c.min_sessions} økter sjekket inn${myWeek.hasLong ? ` (langøkt teller ×${c.long_session_counts})` : ""}`}
            {task && myWeek.state !== "before" && (myWeek.taskMet ? " · ukeskrav ✓" : " · ukeskrav mangler")}
          </p>
          {myWeek.state !== "done" && myWeek.state !== "before" && !myWeek.passed && (
            <Link href="/logg" className="btn btn-heat mt-4 w-full">{user.strava_athlete_id ? "Se øktene dine" : "Logg en økt"}</Link>
          )}
        </section>
      )}

      {owedWeeks.length > 0 && (
        <section className="rounded-2xl bg-bad p-4 text-white">
          <p className="display text-3xl">Du skylder {owedWeeks.length * c.penalty_kr} kr</p>
          <p className="mt-1 text-sm opacity-90">
            For {owedWeeks.map((w) => `uke ${isoWeekNumber(w)}`).join(", ")}.
            {vippsLink ? " Betal i Vipps, og trykk så «Jeg har betalt»." : c.vipps_info ? ` Vipps til ${c.vipps_info}.` : " Vipps til bøtekassa."}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {vippsLink && (
              <a href={vippsLink} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#ff5b24] text-white">
                Betal {owedWeeks.length * c.penalty_kr} kr med Vipps
              </a>
            )}
            <ClaimPaid weeks={owedWeeks} />
          </div>
        </section>
      )}
      {me && me.claimedKr > 0 && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">{me.claimedKr} kr meldt betalt – venter på at admin bekrefter.</p>
      )}

      {task && (
        <section className="rounded-2xl bg-ink p-4 text-paper">
          <p className="text-xs font-bold tracking-wider text-heat uppercase">Ukas ekstrakrav</p>
          <p className="display mt-1 text-2xl">{task.title}</p>
          {task.description && <p className="mt-1 text-sm">{task.description}</p>}
          <p className="mt-2 text-sm">
            Minst én av øktene som teller må oppfylle dette.
            {task.auto_sports.length > 0 && ` ${task.auto_sports.map(sportLabel).join(", ")} teller automatisk.`}
          </p>
        </section>
      )}

      <section className="card p-4">
        <h2 className="mb-2 font-bold">Alle denne uka</h2>
        <ul className="divide-y divide-line">
          {board.members
            .map((m) => ({ m, r: m.results[weekIndex] }))
            .sort((a, b) => Number(b.r.passed) - Number(a.r.passed) || b.r.qualifying - a.r.qualifying || b.r.minutes - a.r.minutes)
            .map(({ m, r }) => {
              const s = statusLabel(c, r);
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar p={m} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-1.5 font-semibold"><Link href={`/person/${m.id}`} className="truncate">{m.name}</Link>{m.is_admin && <RoleTag />}</p>
                    <WeekProgress c={c} r={r} small />
                  </div>
                  <Pill tone={s.tone}>{s.text}</Pill>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Betalt inn</p>
          <p className="display mt-1 text-4xl">{potPaid} kr</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Ikke betalt ennå</p>
          <p className={`display mt-1 text-4xl ${potOpen ? "text-bad" : ""}`}>{potOpen} kr</p>
        </div>
      </section>

      {upcoming.map((u) => <JoinCard key={u.id} c={u} joined={u.joined} count={u.count} />)}

      <section className="card p-4">
        <h2 className="font-bold">Siste økter</h2>
        {feed.length ? (
          <>
          <ul className="divide-y divide-line">
            {feed.map(({ w, m }) => (
              <WorkoutRow key={w.id} w={w} who={m} me={user.id} c={c} task={board.tasks.get(mondayOf(osloDate(new Date(w.started_at))))} />
            ))}
          </ul>
          <Link href="/siste" className="btn btn-ghost mt-2 w-full">Se alle økter</Link>
          </>
        ) : (
          <p className="py-4 text-sm text-muted">Ingen økter ennå. Hvem blir først?</p>
        )}
      </section>
    </div>
  );
}
