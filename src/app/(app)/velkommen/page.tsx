import { ConnectWithStrava } from "@/components/StravaBrand";
import Link from "next/link";
import { JoinCard } from "@/components/JoinCard";
import { WatchGuide } from "@/components/WatchGuide";
import { AddPasskey } from "@/components/Passkeys";
import { requireUser } from "@/lib/auth";
import { activeChallenge, mayJoin } from "@/lib/challenge";
import { one } from "@/lib/db";
import { stravaConfigured } from "@/lib/strava";

/** First stop after accepting an invite: the three things that decide whether the app gets used. */
export default async function WelcomePage() {
  const user = await requireUser();
  const c = await activeChallenge();
  const membership = c
    ? await one<{ joined: boolean; count: number }>(
        `select exists(select 1 from challenge_members where challenge_id = $1 and user_id = $2) as joined,
                (select count(*)::int from challenge_members where challenge_id = $1) as count`,
        [c.id, user.id],
      )
    : null;
  const step = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-bold text-paper";
  return (
    <div className="space-y-5 pt-2">
      <h1 className="display text-5xl">Velkommen, {user.name.split(" ")[0]}!</h1>
      <p className="text-muted">Tre ting, så er du klar.</p>

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-3"><span className={step}>1</span><h2 className="font-bold">Bli med i utfordringen</h2></div>
        {c && membership && (membership.joined || (await mayJoin(c, user.id)))
          ? <JoinCard c={c} joined={membership.joined} count={membership.count} />
          : <p className="text-sm text-muted">{c ? "Kontrolløren velger hvem som er med – du får beskjed i Prat når du kan bli med." : "Ingen utfordring er startet ennå – du får beskjed i Prat."}</p>}
      </section>

      {stravaConfigured() && (
        <section className="card space-y-3 p-4">
          <div className="flex items-center gap-3"><span className={step}>2</span><h2 className="font-bold">Koble til Strava</h2></div>
          <p className="text-sm text-muted">Da kommer øktene fra klokka inn av seg selv – du sjekker dem bare inn med et bilde.</p>
          {user.strava_athlete_id ? <p className="font-semibold text-ok">✓ Koblet til</p> : <ConnectWithStrava />}
          <WatchGuide />
        </section>
      )}

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-3"><span className={step}>{stravaConfigured() ? 3 : 2}</span><h2 className="font-bold">Legg appen på hjemskjermen</h2></div>
        <ul className="space-y-2 text-sm">
          <li><strong>iPhone (Safari):</strong> trykk Del-knappen (firkant med pil opp) → «Legg til på Hjem-skjerm».</li>
          <li><strong>Android (Chrome):</strong> trykk ⋮ øverst til høyre → «Legg til på startskjermen».</li>
        </ul>
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-3"><span className={step}>{stravaConfigured() ? 4 : 3}</span><h2 className="font-bold">Logg inn med Face ID</h2></div>
        <p className="text-sm text-muted">Slipp passordet neste gang – logg inn med ansiktet eller fingeren.</p>
        <AddPasskey />
      </section>

      <Link href="/" className="btn w-full">Ferdig – til forsiden</Link>
    </div>
  );
}
