import { Badges, badgesFor, Records, WeeklyChart } from "@/components/Profile";
import { firstFinishCounts, personStats } from "@/lib/leaderboard";
import { BackLink } from "@/components/BackLink";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RoleTag } from "@/components/RoleTag";
import { StatTiles } from "@/components/StatTiles";
import { Pill, statusLabel, WeekProgress } from "@/components/WeekProgress";
import { WorkoutRow } from "@/components/WorkoutRow";
import { requireUser } from "@/lib/auth";
import { activeChallenge, loadBoard } from "@/lib/challenge";
import { computeStats } from "@/lib/stats";
import { isoWeekNumber, mondayOf, osloDate } from "@/lib/time";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await activeChallenge();
  if (!c) notFound();
  const board = await loadBoard(c);
  const p = board.members.find((m) => m.id === Number(id));
  if (!p) notFound();
  const stats = computeStats(p.workouts);
  const pStats = (await personStats(c, board, "alt")).find((x) => x.m.id === p.id)!;
  const firsts = await firstFinishCounts(c);
  const passed = p.results.filter((r) => r.state === "done" && r.passed).length;
  const done = p.results.filter((r) => r.state === "done").length;

  return (
    <div className="space-y-5 pt-2">
      <BackLink />
      <div className="flex items-center gap-3">
        <Avatar p={p} size={56} />
        <div className="min-w-0">
          <h1 className="display line-clamp-2 text-4xl break-words sm:text-5xl">{p.name}</h1>
          {p.is_admin && <p className="mb-1"><RoleTag /></p>}
          <p className="text-sm text-muted">{passed} av {done} ferdige uker i boks{p.strava_athlete_id ? " · på Strava" : ""}</p>
        </div>
      </div>
      {stats.sessions > 0 ? (
        <>
          <Records p={pStats} />
          <WeeklyChart c={c} m={p} />
          <Badges badges={badgesFor(pStats, c, firsts.get(p.id) ?? 0)} />
          <StatTiles s={stats} />
        </>
      ) : (
        <p className="card p-4 text-sm text-muted">Ingen innsjekkede økter ennå.{p.results.some((r) => r.state === "before") ? " Ukene før vedkommende ble med teller ikke." : ""}</p>
      )}
      <section className="card p-4">
        <h2 className="mb-2 font-bold">Ukene</h2>
        <ul className="divide-y divide-line">
          {p.results.filter((r) => r.state !== "future" && r.state !== "before").reverse().map((r) => {
            const s = statusLabel(c, r);
            return (
              <li key={r.week} className="flex items-center gap-3 py-2.5">
                <span className="w-16 shrink-0 font-semibold">Uke {isoWeekNumber(r.week)}</span>
                <div className="flex-1"><WeekProgress c={c} r={r} small /></div>
                <Pill tone={s.tone}>{s.text}</Pill>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card p-4">
        <h2 className="font-bold">Økter</h2>
        <ul className="divide-y divide-line">
          {p.workouts.map((w) => (
            <WorkoutRow key={w.id} w={w} me={user.id} task={board.tasks.get(mondayOf(osloDate(new Date(w.started_at))))} c={c} isAdmin={user.is_admin} />
          ))}
          {!p.workouts.length && <li className="py-3 text-sm text-muted">Ingen økter ennå.</li>}
        </ul>
      </section>
    </div>
  );
}
