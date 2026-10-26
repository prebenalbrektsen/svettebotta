import type { Challenge, WeekResult } from "@/lib/challenge";

/** One segment per required workout; a long workout fills as many as it is worth. */
export function WeekProgress({ c, r, small }: { c: Challenge; r: WeekResult; small?: boolean }) {
  const filled = Math.min(r.qualifying, c.min_sessions);
  return (
    <div className={`flex ${small ? "gap-1" : "gap-1.5"}`} aria-label={`${filled} av ${c.min_sessions}`}>
      {Array.from({ length: c.min_sessions }, (_, i) => (
        <span
          key={i}
          className={`${small ? "h-2 w-5" : "h-3 flex-1"} rounded-full ${i < filled ? (r.passed ? "bg-ok" : "bg-heat") : "bg-line"}`}
        />
      ))}
    </div>
  );
}

/** Short on purpose: it sits next to names on a phone. */
export function statusLabel(c: Challenge, r: WeekResult): { text: string; tone: "ok" | "warn" | "bad" | "muted" } {
  if (r.state === "future") return { text: "Ikke startet", tone: "muted" };
  if (r.state === "before") return { text: "Ikke med", tone: "muted" };
  if (r.passed) return { text: "I boks", tone: "ok" };
  if (r.state === "done") {
    if (r.fine === "paid") return { text: "Betalt", tone: "muted" };
    if (r.fine === "waived") return { text: "Fritatt", tone: "muted" };
    if (r.fine === "joker") return { text: "Joker brukt 🃏", tone: "muted" };
    if (r.fine === "claimed") return { text: "Meldt betalt", tone: "warn" };
    return { text: `Bot ${c.penalty_kr} kr`, tone: "bad" };
  }
  const missing = Math.max(0, c.min_sessions - r.qualifying);
  if (r.volumeMet) return { text: "Ukeskrav", tone: "warn" };
  return { text: r.taskMet ? `${missing} igjen` : `${missing} igjen + krav`, tone: "warn" };
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const cls = { ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", muted: "bg-line/60 text-muted" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${cls}`}>{children}</span>;
}
