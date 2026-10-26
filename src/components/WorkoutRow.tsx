import Link from "next/link";
import type { Challenge, WeeklyTask, Workout } from "@/lib/challenge";
import { checkInDeadline, meetsTask, workoutCredit } from "@/lib/challenge";
import { sportIcon, sportLabel } from "@/lib/sports";
import { formatMinutes, relativeTime } from "@/lib/time";
import { approveWorkout, deleteWorkout, toggleKudos, toggleMeetsTask, toggleRejected } from "@/app/(app)/actions";
import { CheckIn } from "./CheckIn";
import { Icon } from "./Icon";

function timeLeft(deadline: Date): string {
  const min = Math.max(0, Math.round((deadline.getTime() - Date.now()) / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} t igjen` : `${min} min igjen`;
}

/** What the workout means for the week. A plain «teller» is the normal case, so it gets no label. */
function StatusPill({ w, c }: { w: Workout; c: Challenge }) {
  const pill = (cls: string, text: string) => <span className={`rounded px-1.5 py-0.5 ${cls}`}>{text}</span>;
  switch (w.status) {
    case "counts": return workoutCredit(c, w) > 1 ? pill("bg-ok-soft text-ok", `Langøkt – teller ×${workoutCredit(c, w)}`) : null;
    case "pending": return pill("bg-warn-soft text-warn", `Venter på innsjekk · ${timeLeft(checkInDeadline(c, w))}`);
    case "expired": return pill("bg-line text-muted", "Ikke sjekket inn i tide");
    case "short": return pill("bg-line text-muted", `Under ${c.session_minutes} min – teller ikke`);
    case "sameday": return pill("bg-line text-muted", `Teller ikke – maks ${c.max_per_day} per dag`);
    case "rejected": return pill("bg-bad-soft text-bad", "Underkjent av kontrolløren");
    default: return null;
  }
}

export function WorkoutRow({
  w,
  c,
  who,
  task,
  canEdit,
  isAdmin,
  me,
}: {
  w: Workout;
  c: Challenge;
  me?: number;
  who?: { id: number; name: string; color: string };
  task?: WeeklyTask;
  canEdit?: boolean;
  isAdmin?: boolean;
}) {
  const km = w.distance_m ? (w.distance_m / 1000).toLocaleString("nb-NO", { maximumFractionDigits: 1 }) : null;
  const mine = me !== undefined && w.user_id === me;
  const waiting = w.status === "pending" || w.status === "expired";
  const meta = [
    w.title ? sportLabel(w.sport) : null,
    formatMinutes(w.duration_min),
    km && `${km} km`,
    w.avg_hr && `♥ ${w.avg_hr}`,
    relativeTime(new Date(w.started_at)),
    w.source === "strava" ? "Strava" : null,
  ].filter(Boolean);
  const showTaskToggle = canEdit && task && !task.auto_sports.includes(w.sport);
  const menu = (canEdit && w.source === "manual") || isAdmin;

  return (
    <li className={`flex gap-3 py-3 ${w.rejected ? "opacity-60" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: who ? `${who.color}1f` : "#0000000d", color: who?.color ?? "inherit" }}>
        <Icon name={sportIcon(w.sport)} label={sportLabel(w.sport)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {who && <Link href={`/person/${who.id}`} style={{ color: who.color }}>{who.name} · </Link>}
          <Link href={`/okt/${w.id}`}>{w.title || sportLabel(w.sport)}</Link>
        </p>
        <p className="truncate text-sm text-muted">{meta.join(" · ")}</p>
        {(w.status !== "counts" || workoutCredit(c, w) > 1 || (task && w.checked_in_at && meetsTask(w, task))) && (
          <p className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
            <StatusPill w={w} c={c} />
            {task && w.checked_in_at && meetsTask(w, task) && <span className="rounded bg-ok-soft px-1.5 py-0.5 text-ok">✓ {task.title}</span>}
          </p>
        )}

        {canEdit && mine && w.status === "pending" && (
          <div className="mt-2"><CheckIn workoutId={w.id} checkedIn={false} hasPhoto={w.has_proof} proofRequired={c.proof_required} /></div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          {me !== undefined && w.checked_in_at && (
            <>
              <form action={toggleKudos.bind(null, w.id)}>
                <button
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-semibold ${w.kudos_by.includes(me) ? "bg-heat text-white" : "bg-line/60 text-muted"}`}
                  disabled={mine}
                  aria-label={mine ? `${w.kudos_by.length} kudos` : w.kudos_by.includes(me) ? "Ta tilbake kudos" : "Gi kudos"}
                >
                  <Icon name="flame" className="h-4 w-4" />{w.kudos_by.length || ""}
                </button>
              </form>
              <Link href={`/okt/${w.id}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-line/60 px-2.5 font-semibold text-muted" aria-label="Kommentarer">
                <Icon name="comment" className="h-4 w-4" />{w.comment_count || ""}
              </Link>
            </>
          )}
          {showTaskToggle && (
            <form action={toggleMeetsTask.bind(null, w.id)}>
              <button className={`inline-flex h-8 items-center rounded-full border px-2.5 text-xs font-semibold ${w.meets_task ? "border-ok bg-ok-soft text-ok" : "border-line"}`}>
                {w.meets_task ? `✓ ${task!.title}` : `Oppfyller «${task!.title}»?`}
              </button>
            </form>
          )}
          {menu && (
            <details className="relative">
              <summary className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full bg-line/60 text-muted" aria-label="Flere valg">
                <Icon name="more" className="h-4 w-4" />
              </summary>
              <div className="absolute left-0 z-10 mt-1 flex w-56 flex-col rounded-xl border border-line bg-card p-1 shadow-lg">
                {canEdit && w.source === "manual" && (
                  <form action={deleteWorkout.bind(null, w.id)}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-line/50">Slett økta</button></form>
                )}
                {isAdmin && waiting && (
                  <form action={approveWorkout.bind(null, w.id)}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-line/50">Godkjenn uten innsjekk</button></form>
                )}
                {isAdmin && (
                  <form action={toggleRejected.bind(null, w.id)}>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-line/50">{w.rejected ? "Godkjenn likevel" : "Underkjenn økta"}</button>
                  </form>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
      {w.has_proof && (
        <Link href={`/okt/${w.id}`} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/bilde/${w.id}?liten=1`} alt="Dokumentasjon" loading="lazy" className="h-14 w-14 rounded-lg border border-line object-cover" />
        </Link>
      )}
    </li>
  );
}
