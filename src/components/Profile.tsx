import Link from "next/link";
import type { Board, Challenge } from "@/lib/challenge";
import type { PersonStats } from "@/lib/leaderboard";
import { sportLabel } from "@/lib/sports";
import { fmtKm } from "@/lib/stats";
import { formatMinutes, isoWeekNumber, osloDate } from "@/lib/time";

type Member = Board["members"][number];

/** Workouts counted per week, with the weekly requirement as a dashed line. */
export function WeeklyChart({ c, m }: { c: Challenge; m: Member }) {
  const weeks = m.results.filter((r) => r.state !== "future" && r.state !== "before");
  if (!weeks.length) return null;
  const top = Math.max(c.min_sessions + 1, ...weeks.map((r) => r.qualifying));
  const H = 120;
  return (
    <section className="card p-4">
      <h2 className="mb-3 font-bold">Økter per uke</h2>
      <div className="relative" style={{ height: H + 22 }}>
        <div className="absolute inset-x-0 border-t-2 border-dashed border-muted/50" style={{ top: H - (c.min_sessions / top) * H }}>
          <span className="absolute -top-5 right-0 text-[10px] font-bold text-muted">krav {c.min_sessions}</span>
        </div>
        <div className="flex h-full items-end gap-2">
          {weeks.map((r) => {
            const color = r.passed ? "bg-ok" : r.state === "running" ? "bg-heat" : "bg-bad/70";
            return (
              <div key={r.week} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted">{r.qualifying || ""}</span>
                <div className={`w-full max-w-10 rounded-t-md ${color}`} style={{ height: Math.max(3, (r.qualifying / top) * H) }} />
                <span className="text-[10px] text-muted">{isoWeekNumber(r.week)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">Grønn = i boks · rød = bot · oransje = denne uka</p>
    </section>
  );
}

/** Streak plus personal bests. */
export function Records({ p }: { p: PersonStats }) {
  const m = p.m;
  const valid = m.workouts.filter((w) => w.checked_in_at && !w.rejected);
  const runs = valid.filter((w) => ["Run", "TrailRun"].includes(w.sport) && w.distance_m);
  const longestRun = runs.reduce<(typeof runs)[number] | null>((a, w) => (!a || w.distance_m! > a.distance_m! ? w : a), null);
  const bestWeek = m.results.reduce((a, r) => (r.minutes > a.minutes ? r : a), m.results[0]);
  const tiles: { label: string; value: string; sub?: string; href?: string }[] = [
    { label: "Uker på rad", value: String(p.streak), sub: p.bestStreak > p.streak ? `rekord ${p.bestStreak}` : p.streak ? "personlig rekord" : undefined },
    p.longest ? { label: "Lengste økt", value: formatMinutes(p.longest.duration_min), sub: sportLabel(p.longest.sport), href: `/okt/${p.longest.id}` } : null,
    longestRun ? { label: "Lengste løpetur", value: `${fmtKm(longestRun.distance_m! / 1000)} km`, href: `/okt/${longestRun.id}` } : null,
    bestWeek && bestWeek.minutes > 0 ? { label: "Beste uke", value: formatMinutes(bestWeek.minutes), sub: `uke ${isoWeekNumber(bestWeek.week)}` } : null,
    { label: "Kudos fått", value: `${p.kudosReceived} 🔥`, sub: `${p.kudosGiven} gitt` },
    m.jokers.enabled ? { label: "Jokere på lur", value: `${m.jokers.held} 🃏`, sub: `maks ${m.jokers.max} · ${m.jokers.used} brukt` } : null,
  ].filter(Boolean) as { label: string; value: string; sub?: string; href?: string }[];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((t) => {
        const inner = (
          <>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{t.label}</p>
            <p className="display mt-1 text-3xl">{t.value}</p>
            {t.sub && <p className="text-xs text-muted">{t.sub}</p>}
          </>
        );
        return t.href ? <Link key={t.label} href={t.href} className="card p-3">{inner}</Link> : <div key={t.label} className="card p-3">{inner}</div>;
      })}
    </section>
  );
}

type Badge = { id: string; title: string; how: string; earned: boolean; emoji: string };

/** Small achievements – earned ones in colour, the rest show what it takes. */
export function badgesFor(p: PersonStats, c: Challenge, firstWeeks: number): Badge[] {
  const m = p.m;
  const valid = m.workouts.filter((w) => w.checked_in_at && !w.rejected);
  const done = m.results.filter((r) => r.state === "done");
  const sports = new Set(valid.map((w) => w.sport));
  const early = valid.filter((w) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "numeric", hourCycle: "h23" }).format(new Date(w.started_at))) < 7);
  return [
    { id: "first", emoji: "🏁", title: "Først i boks", how: "Bli først til å fullføre en uke", earned: firstWeeks > 0 },
    { id: "streak", emoji: "🔥", title: "Jernvilje", how: "4 uker på rad i boks", earned: p.bestStreak >= 4 },
    { id: "debtfree", emoji: "💰", title: "Gjeldfri", how: "Ingen bøter etter 3 ferdige uker", earned: done.length >= 3 && done.every((r) => r.passed || r.fine === "waived") },
    { id: "long", emoji: "⏱️", title: "Langdistanse", how: "En økt på 2 timer eller mer", earned: valid.some((w) => w.duration_min >= 120) },
    { id: "swim", emoji: "🏊", title: "Svømmer'n", how: "5 økter i vann", earned: valid.filter((w) => ["Swim", "Rowing", "Kayaking", "StandUpPaddling"].includes(w.sport)).length >= 5 },
    { id: "early", emoji: "🌅", title: "Morgenfugl", how: "5 økter startet før kl. 7", earned: early.length >= 5 },
    { id: "allround", emoji: "🎯", title: "Allsidig", how: "5 forskjellige treningsformer", earned: sports.size >= 5 },
    { id: "cheer", emoji: "📣", title: "Heiagjeng", how: "Gi 20 kudos", earned: p.kudosGiven >= 20 },
  ].map((b) => ({ ...b, earned: b.earned && osloDate() >= c.starts_on }));
}

export function Badges({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-bold">Merker</h2>
        <span className="text-sm text-muted">{earned} av {badges.length}</span>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {badges.map((b) => (
          <li key={b.id} className={`flex flex-col items-center rounded-xl p-2 text-center ${b.earned ? "bg-heat-soft" : "bg-line/40 opacity-60"}`} title={b.how}>
            <span className={`text-2xl ${b.earned ? "" : "grayscale"}`} aria-hidden="true">{b.emoji}</span>
            <span className="mt-1 text-[11px] leading-tight font-bold">{b.title}</span>
            {!b.earned && <span className="mt-0.5 text-[10px] leading-tight text-muted">{b.how}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
