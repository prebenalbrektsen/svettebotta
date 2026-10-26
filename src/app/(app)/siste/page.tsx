import { BackLink } from "@/components/BackLink";
import { WorkoutRow } from "@/components/WorkoutRow";
import { requireUser } from "@/lib/auth";
import { activeChallenge, loadBoard } from "@/lib/challenge";
import { mondayOf, osloDate } from "@/lib/time";

/** Every checked-in workout in the challenge, newest first. */
export default async function FeedPage() {
  const user = await requireUser();
  const c = await activeChallenge();
  if (!c) return <p className="pt-6 text-muted">Ingen utfordring ennå.</p>;
  const board = await loadBoard(c);
  const feed = board.members
    .flatMap((m) => m.workouts.filter((w) => w.checked_in_at).map((w) => ({ w, m })))
    .sort((a, b) => +new Date(b.w.started_at) - +new Date(a.w.started_at));
  return (
    <div className="space-y-3 pt-2">
      <BackLink />
      <h1 className="display text-4xl">Alle økter</h1>
      <section className="card px-4">
        <ul className="divide-y divide-line">
          {feed.map(({ w, m }) => (
            <WorkoutRow key={w.id} w={w} who={m} me={user.id} c={c} isAdmin={user.is_admin} task={board.tasks.get(mondayOf(osloDate(new Date(w.started_at))))} />
          ))}
          {!feed.length && <li className="py-4 text-sm text-muted">Ingen økter ennå.</li>}
        </ul>
      </section>
    </div>
  );
}
