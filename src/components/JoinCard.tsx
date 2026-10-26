import { joinChallenge, leaveChallenge } from "@/app/(app)/actions";
import { ruleParts, type Challenge } from "@/lib/challenge";
import { formatDay, osloDate } from "@/lib/time";

/** A challenge you can sign up for (or, before it starts, back out of). */
export function JoinCard({ c, joined, count }: { c: Challenge; joined: boolean; count: number }) {
  const started = osloDate() >= c.starts_on;
  return (
    <section className="rounded-2xl border-2 border-heat bg-card p-4">
      <p className="text-xs font-bold tracking-wider text-heat uppercase">{started ? "Utfordringen er i gang" : `Starter ${formatDay(c.starts_on)}`}</p>
      <h2 className="display mt-1 text-3xl">{c.name}</h2>
      <p className="mt-1 text-sm text-muted">{formatDay(c.starts_on)} – {formatDay(c.ends_on)} · {count} {count === 1 ? "deltaker" : "deltakere"} så langt</p>
      {c.description && <p className="mt-2 text-sm whitespace-pre-line">{c.description}</p>}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {ruleParts(c).map((r) => <li key={r} className="rounded-full bg-line/70 px-2.5 py-1 text-xs font-semibold">{r}</li>)}
      </ul>
      {joined ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-ok">✓ Du er med</span>
          {!started && <form action={leaveChallenge.bind(null, c.id)}><button className="btn btn-ghost btn-sm">Meld meg av</button></form>}
        </div>
      ) : (
        <>
          <form action={joinChallenge.bind(null, c.id)} className="mt-4"><button className="btn btn-heat w-full">Bli med</button></form>
          <p className="mt-2 text-xs text-muted">
            {started ? "Du blir med fra neste hele uke – ukene før teller ikke." : "Du kan melde deg av helt til utfordringen starter."}
          </p>
        </>
      )}
    </section>
  );
}
