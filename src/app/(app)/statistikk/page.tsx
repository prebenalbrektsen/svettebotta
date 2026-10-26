import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { StatTiles } from "@/components/StatTiles";
import { requireUser } from "@/lib/auth";
import { activeChallenge, loadBoard } from "@/lib/challenge";
import { Icon } from "@/components/Icon";
import { sportIcon, sportLabel } from "@/lib/sports";
import { computeStats, fmtHours, fmtKm } from "@/lib/stats";
import { addDays, isoWeekNumber, osloDate } from "@/lib/time";

export default async function StatsPage() {
  await requireUser();
  const c = await activeChallenge();
  if (!c) return <p className="pt-6 text-muted">Ingen utfordring ennå.</p>;
  const board = await loadBoard(c);
  const all = computeStats(board.members.flatMap((m) => m.workouts));
  const people = board.members
    .map((m) => ({ m, s: computeStats(m.workouts), passed: m.results.filter((r) => r.state !== "future" && r.passed).length }))
    // The challenge is about weeks in the bag; minutes only break ties.
    .sort((a, b) => b.passed - a.passed || b.s.minutes - a.s.minutes);
  const maxPassed = Math.max(1, ...people.map((p) => p.passed));
  const doneWeeks = board.weeks.filter((w) => addDays(w, 6) < osloDate()).length;
  const teamWeekly = board.weeks.map((w, i) => ({ w, min: board.members.reduce((s, m) => s + m.results[i].minutes, 0) }));
  const maxWeek = Math.max(1, ...teamWeekly.map((t) => t.min));

  return (
    <div className="space-y-6 pt-2">
      <section>
        <h1 className="display text-5xl">Statistikk</h1>
        <p className="mt-1 text-muted">{c.name} · alle sammen</p>
      </section>
      <StatTiles s={all} />

      <section className="card p-4">
        <h2 className="mb-3 font-bold">Tavla – flest uker i boks</h2>
        <ol className="space-y-3">
          {people.map(({ m, s, passed }, i) => (
            <li key={m.id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/person/${m.id}`} className="flex min-w-0 items-center gap-2 font-semibold">
                  <span className="w-5 shrink-0 text-right text-muted">{i + 1}.</span><Avatar p={m} size={24} /><span className="truncate">{m.name}</span>
                </Link>
                <span className="shrink-0 font-semibold">{passed} {passed === 1 ? "uke" : "uker"}</span>
              </div>
              <div className="mt-1 ml-7 h-2.5 rounded-full bg-line">
                <div className="h-full rounded-full" style={{ width: `${(passed / maxPassed) * 100}%`, background: m.color }} />
              </div>
              <p className="mt-0.5 ml-7 text-xs text-muted">{fmtHours(s.minutes)} t · {s.sessions} økter{s.runKm > 0 ? ` · ${fmtKm(s.runKm)} km løp` : ""} · {m.paidKr + m.owedKr + m.claimedKr} kr i bøter</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold">Uke for uke</h2>
        {/* Name column pinned, weeks scroll sideways if they don't fit. */}
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="border-separate border-spacing-0 text-center text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] bg-card pr-3 pb-2 text-left font-semibold text-muted">Uke</th>
                {board.weeks.map((w) => (
                  <th key={w} className={`w-10 min-w-10 pb-2 font-semibold ${w === board.currentWeek ? "text-ink" : "text-muted"}`}>{isoWeekNumber(w)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.members.map((m) => (
                <tr key={m.id}>
                  <td className="sticky left-0 z-[1] max-w-28 truncate border-t border-line bg-card py-2 pr-3 text-left font-semibold">{m.name.split(" ")[0]}</td>
                  {m.results.map((r) => (
                    <td key={r.week} className={`border-t border-line py-2 ${r.week === board.currentWeek ? "bg-line/40" : ""}`} title={`${r.qualifying} økter, ${r.minutes} min`}>
                      {r.state === "future" || r.state === "before" ? <span className="text-muted/40">–</span>
                        : r.passed ? <span className="font-bold text-ok" aria-label="I boks">✓</span>
                        : r.state === "running" ? <span className="font-semibold text-warn">{r.qualifying}</span>
                        : <span className="font-bold text-bad" aria-label="Bot">✗</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">✓ i boks · ✗ bot · tall = økter så langt denne uka · – ikke med · {doneWeeks} av {board.weeks.length} uker ferdig</p>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold">Minutter per uke – hele gjengen</h2>
        <div className="flex h-36 items-end gap-2">
          {teamWeekly.map(({ w, min }) => (
            <div key={w} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted">{min || ""}</span>
              <div className="w-full rounded-t-md bg-heat" style={{ height: `${(min / maxWeek) * 100}px` }} />
              <span className="text-xs text-muted">{isoWeekNumber(w)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-bold">Hva vi trener</h2>
        <ul className="divide-y divide-line">
          {all.bySport.map((s) => (
            <li key={s.sport} className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2"><Icon name={sportIcon(s.sport)} className="h-4 w-4 text-muted" /><strong>{sportLabel(s.sport)}</strong></span>
              <span className="text-muted">{s.count} økter · {fmtHours(s.minutes)} t{s.km > 0 && ` · ${fmtKm(s.km)} km`}</span>
            </li>
          ))}
          {!all.bySport.length && <li className="py-2 text-sm text-muted">Ingen økter ennå.</li>}
        </ul>
      </section>
    </div>
  );
}
