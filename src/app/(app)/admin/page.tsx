import Link from "next/link";
import { ActionForm, CopyLink } from "@/components/ActionForm";
import { AddParticipantForm } from "@/components/AddParticipantForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { activeChallenge, loadBoard, type Challenge } from "@/lib/challenge";
import { query } from "@/lib/db";
import { stravaConfigured, webhookStatus } from "@/lib/strava";
import { ActivateWebhook } from "@/components/ActivateWebhook";
import { addDays, formatWeekRange, isoWeekNumber, mondayOf, osloDate } from "@/lib/time";
import { activateStravaWebhook, approveUser, confirmAllClaimed, createGroupLink, disableGroupLink, rejectUser, deleteTask, newInvite, saveChallenge, saveTask, setFine, settleAll, toggleInvite, toggleMember } from "../actions";

const TABS = [
  { id: "boter", label: "Bøter" },
  { id: "ukeskrav", label: "Ukeskrav" },
  { id: "deltakere", label: "Deltakere" },
  { id: "regler", label: "Regler" },
] as const;

function ChallengeFields({ c }: { c?: Challenge }) {
  const today = osloDate();
  const start = c?.starts_on ?? mondayOf(addDays(today, 7));
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <label className="block"><span className="label">Navn</span><input name="name" className="field" defaultValue={c?.name ?? "Høstbøtta"} required /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Start (mandag)</span><input type="date" name="starts_on" className="field" defaultValue={start} required /></label>
        <label className="block"><span className="label">Slutt (søndag)</span><input type="date" name="ends_on" className="field" defaultValue={c?.ends_on ?? addDays(start, 8 * 7 - 1)} required /></label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block"><span className="label">Økter per uke</span><input type="number" min={1} name="min_sessions" className="field" defaultValue={c?.min_sessions ?? 3} required /></label>
        <label className="block"><span className="label">Min per økt</span><input type="number" min={1} name="session_minutes" className="field" defaultValue={c?.session_minutes ?? 35} required /></label>
        <label className="block"><span className="label">Bot (kr)</span><input type="number" min={0} name="penalty_kr" className="field" defaultValue={c?.penalty_kr ?? 50} required /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Langøkt fra (min) – tomt = ingen langøkt</span>
          <input type="number" min={1} name="long_session_minutes" className="field" defaultValue={c ? (c.long_session_minutes ?? "") : 60} />
        </label>
        <label className="block">
          <span className="label">Langøkt teller som (økter)</span>
          <input type="number" min={1} name="long_session_counts" className="field" defaultValue={c?.long_session_counts ?? 2} />
        </label>
      </div>
      <p className="-mt-1 text-xs text-muted">Sett «teller som» lik antall økter per uke hvis én langøkt skal holde for hele uka.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Sjekk inn innen (timer) – tomt = før uka er over</span>
          <input type="number" min={1} name="check_in_hours" className="field" defaultValue={c ? (c.check_in_hours ?? "") : 24} />
        </label>
        <label className="block">
          <span className="label">Maks økter per dag som teller – tomt = ingen grense</span>
          <input type="number" min={1} name="max_per_day" className="field" defaultValue={c ? (c.max_per_day ?? "") : 1} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="proof_required" className="h-5 w-5 accent-[#ff4d1c]" defaultChecked={c ? c.proof_required : true} />
        Bilde påkrevd for å sjekke inn (også for Strava-økter)
      </label>
      <fieldset className="space-y-2">
        <legend className="label">Hvem kan bli med?</legend>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="join_mode" value="open" defaultChecked={(c?.join_mode ?? "open") === "open"} className="h-5 w-5 accent-[#ff4d1c]" /> Alle i appen kan melde seg på</label>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="join_mode" value="selected" defaultChecked={c?.join_mode === "selected"} className="h-5 w-5 accent-[#ff4d1c]" /> Bare de jeg velger (under Deltakere)</label>
      </fieldset>
      <label className="block">
        <span className="label">Beskrivelse – vises på «Bli med»-kortet (valgfritt)</span>
        <textarea name="description" rows={3} className="field" defaultValue={c?.description ?? ""} placeholder="Åtte uker før jul. Den som har flest uker i boks slipper å vaske opp på julaften." />
      </label>
      <label className="block">
        <span className="label">Vipps-lenke til bøtekassa (vises når noen skylder)</span>
        <input name="vipps_info" className="field" defaultValue={c?.vipps_info ?? ""} placeholder="Lim inn Vipps-lenken til bøtekassa, eller skriv navn/nummer" />
      </label>
    </>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ fane?: string }> }) {
  await requireAdmin();
  const c = await activeChallenge();
  const board = c ? await loadBoard(c) : null;
  const allUsers = await query<{ id: number; name: string; email: string | null; invite_token: string | null; is_admin: boolean; strava: boolean; approved: boolean; created_at: Date }>(
    "select id, name, email, invite_token, is_admin, strava_athlete_id is not null as strava, approved, created_at from users order by name",
  );
  const users = allUsers.filter((u) => u.approved);
  const pending = allUsers.filter((u) => !u.approved);
  const groupToken = (await query<{ value: string }>("select value from settings where key = 'group_invite'"))[0]?.value ?? null;
  const memberIds = new Set(board?.members.map((m) => m.id));
  const invited = new Set(
    c ? (await query<{ user_id: number }>("select user_id from challenge_invites where challenge_id = $1", [c.id])).map((r) => r.user_id) : [],
  );
  const appUrl = process.env.APP_URL ?? "";

  // Unsettled fines, grouped per person: one row per person with a total, not one per week.
  const debtors = (board?.members ?? [])
    .map((m) => ({ m, weeks: m.results.filter((r) => r.fine === "owed" || r.fine === "claimed") }))
    .filter((d) => d.weeks.length)
    .sort((a, b) => Number(b.weeks.some((w) => w.fine === "claimed")) - Number(a.weeks.some((w) => w.fine === "claimed")));
  const claimedCount = debtors.reduce((n, d) => n + d.weeks.filter((w) => w.fine === "claimed").length, 0);
  const settled = (board?.members ?? []).flatMap((m) => m.results.filter((r) => r.fine === "paid" || r.fine === "waived").map((r) => ({ m, r })));

  const { fane } = await searchParams;
  const webhook = fane === "regler" ? await webhookStatus().catch(() => null) : null;
  const connected = users.filter((u) => u.strava).length;
  const tab = TABS.some((t) => t.id === fane) ? fane! : pending.length ? "deltakere" : claimedCount || debtors.length ? "boter" : "deltakere";

  // Until the basics are in place, a checklist sits on top.
  const setup = [
    { done: !!c, text: "Opprett en utfordring", href: "?fane=regler" },
    { done: !!c?.vipps_info, text: "Legg inn Vipps-lenken til bøtekassa", href: "?fane=regler" },
    { done: users.length > 1, text: "Legg til deltakerne og send dem invitasjonen", href: "?fane=deltakere" },
    { done: stravaConfigured(), text: "Koble appen til Strava (API-nøkler fra strava.com/settings/api)", href: null },
  ];

  return (
    <div className="space-y-5 pt-2">
      <h1 className="display text-5xl">Admin</h1>

      {setup.some((x) => !x.done) && (
        <section className="card p-4">
          <h2 className="mb-2 font-bold">Kom i gang</h2>
          <ol className="space-y-2 text-sm">
            {setup.map((x) => (
              <li key={x.text} className="flex items-start gap-2">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${x.done ? "bg-ok text-white" : "border-2 border-line"}`}>{x.done && <Icon name="check" className="h-3 w-3" />}</span>
                {x.href && !x.done ? <Link href={x.href} className="font-semibold underline">{x.text}</Link> : <span className={x.done ? "text-muted line-through" : ""}>{x.text}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!c ? (
        <section className="card p-4">
          <h2 className="mb-3 font-bold">Opprett første utfordring</h2>
          <ActionForm action={saveChallenge} submit="Opprett utfordring"><ChallengeFields /></ActionForm>
        </section>
      ) : (
        <>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Admin">
            {TABS.map((t) => (
              <Link key={t.id} href={`?fane=${t.id}`} className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.id ? "bg-ink text-paper" : "bg-line/60 text-muted"}`}>
                {t.label}
                {t.id === "boter" && claimedCount > 0 && <span className="ml-1.5 rounded-full bg-heat px-1.5 text-xs text-white">{claimedCount}</span>}
                {t.id === "deltakere" && pending.length > 0 && <span className="ml-1.5 rounded-full bg-heat px-1.5 text-xs text-white">{pending.length}</span>}
              </Link>
            ))}
          </nav>

          {tab === "boter" && board && (
            <section className="card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-bold">Ubetalte bøter</h2>
                {claimedCount > 1 && <form action={confirmAllClaimed}><button className="btn btn-sm">Godkjenn alle meldte</button></form>}
              </div>
              {!debtors.length && <p className="text-sm text-muted">Ingen ubetalte bøter.</p>}
              <ul className="divide-y divide-line">
                {debtors.map(({ m, weeks }) => {
                  const claimed = weeks.filter((w) => w.fine === "claimed").length;
                  return (
                    <li key={m.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 flex-1 basis-40">
                          <p className="truncate font-semibold">{m.name} · {weeks.length * c.penalty_kr} kr</p>
                          <p className="text-xs text-muted">
                            {weeks.map((w) => `uke ${isoWeekNumber(w.week)}`).join(", ")}
                            {claimed > 0 && <strong className="text-warn"> · har meldt betalt – sjekk Vipps</strong>}
                          </p>
                        </div>
                        <form action={settleAll.bind(null, m.id, "paid")}><button className="btn btn-sm bg-ok">Betalt alt</button></form>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-muted">Uke for uke</summary>
                        <ul className="mt-2 space-y-2">
                          {weeks.map((r) => (
                            <li key={r.week} className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="min-w-0 flex-1">Uke {isoWeekNumber(r.week)} · {r.fine === "claimed" ? "meldt betalt" : `${r.qualifying} av ${c.min_sessions} økter${r.volumeMet && !r.taskMet ? ", mangler ukeskrav" : ""}`}</span>
                              <form action={setFine.bind(null, m.id, r.week, "paid")}><button className="btn btn-ghost btn-sm">Betalt</button></form>
                              <form action={setFine.bind(null, m.id, r.week, "waived")}><button className="btn btn-ghost btn-sm">Frita</button></form>
                              {r.fine === "claimed" && <form action={setFine.bind(null, m.id, r.week, "owed")}><button className="btn btn-ghost btn-sm">Ikke mottatt</button></form>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  );
                })}
              </ul>
              {settled.length > 0 && (
                <details className="mt-3 border-t border-line pt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-muted">Oppgjorte ({settled.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {settled.map(({ m, r }) => (
                      <li key={`${m.id}-${r.week}`} className="flex items-center justify-between gap-2">
                        <span>{m.name} · uke {isoWeekNumber(r.week)} · {r.fine === "paid" ? "betalt" : "fritatt"}</span>
                        <form action={setFine.bind(null, m.id, r.week, "owed")}><button className="text-xs underline">Angre</button></form>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}

          {tab === "ukeskrav" && board && (
            <section className="card p-4">
              <p className="mb-3 text-sm text-muted">Et ekstra krav for én uke, f.eks. «En økt i vann». Minst én av øktene som teller må oppfylle det.</p>
              <ActionForm action={saveTask} submit="Legg ut ukeskrav">
                <label className="block">
                  <span className="label">Uke</span>
                  <select name="week" className="field" defaultValue={board.weeks.includes(board.currentWeek) ? board.currentWeek : board.weeks[0]}>
                    {board.weeks.map((w) => <option key={w} value={w}>Uke {isoWeekNumber(w)} ({formatWeekRange(w)})</option>)}
                  </select>
                </label>
                <label className="block"><span className="label">Krav</span><input name="title" className="field" placeholder="En økt i vann" required /></label>
                <label className="block"><span className="label">Forklaring (valgfritt)</span><input name="description" className="field" placeholder="Svømming, vannjogging eller aquagym teller." /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="water" className="h-5 w-5 accent-[#ff4d1c]" /> Svømming, roing, padling og SUP teller automatisk</label>
              </ActionForm>
              {board.tasks.size > 0 && (
                <ul className="mt-4 divide-y divide-line border-t border-line">
                  {[...board.tasks.values()].sort((a, b) => a.week_start.localeCompare(b.week_start)).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span><strong>Uke {isoWeekNumber(t.week_start)}:</strong> {t.title}</span>
                      <form action={deleteTask.bind(null, t.id)}><button className="btn btn-ghost btn-sm">Fjern</button></form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "deltakere" && pending.length > 0 && (
            <section className="card border-2 border-heat p-4">
              <h2 className="mb-1 font-bold">Venter på godkjenning</h2>
              <p className="mb-2 text-sm text-muted">Kom inn via fellesinvitasjonen. Godkjenn de du kjenner.</p>
              <ul className="divide-y divide-line">
                {pending.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="font-semibold break-words">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                    <form action={approveUser.bind(null, u.id)}><button className="btn btn-sm bg-ok">Godkjenn</button></form>
                    <form action={rejectUser.bind(null, u.id)}><button className="btn btn-ghost btn-sm">Avvis</button></form>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "deltakere" && (
            <section className="card space-y-2 p-4">
              <h2 className="font-bold">Fellesinvitasjon</h2>
              <p className="text-sm text-muted">Én lenke du kan legge i familiechatten. De som åpner den lager konto selv – og du godkjenner dem her før de kommer inn.</p>
              {groupToken ? (
                <>
                  <p className="truncate rounded-lg bg-line/50 px-3 py-2 text-xs">{appUrl}/bli-med/{groupToken}</p>
                  <CopyLink url={`${appUrl}/bli-med/${groupToken}`} big />
                  <div className="flex gap-3 text-xs">
                    <form action={createGroupLink}><button className="font-semibold text-muted underline">Lag ny lenke (den gamle slutter å virke)</button></form>
                    <form action={disableGroupLink}><button className="font-semibold text-muted underline">Slå av</button></form>
                  </div>
                </>
              ) : (
                <form action={createGroupLink}><button className="btn btn-heat">Lag fellesinvitasjon</button></form>
              )}
            </section>
          )}

          {tab === "deltakere" && (
            <section className="card p-4">
              <AddParticipantForm appUrl={appUrl} />
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {users.map((u) => (
                  <li key={u.id} className="py-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold break-words">{u.name}{u.is_admin && <span className="ml-1 text-xs text-muted">(deg)</span>}</p>
                        <p className="text-xs text-muted">
                          {u.invite_token && !u.email ? "Har ikke åpnet invitasjonen ennå" : u.email}
                          {u.strava && " · Strava ✓"}
                          {c && (memberIds.has(u.id) ? ` · med i ${c.name}` : c.join_mode === "selected" && !invited.has(u.id) ? " · har ikke tilgang til utfordringen" : " · ikke påmeldt ennå")}
                        </p>
                      </div>
                      {!u.is_admin && (
                        <details data-menu className="relative">
                          <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full bg-line/60" aria-label={`Valg for ${u.name}`}><Icon name="more" className="h-4 w-4" /></summary>
                          <div className="absolute right-0 z-10 mt-1 flex w-60 flex-col rounded-xl border border-line bg-card p-1 shadow-lg">
                            <form action={newInvite.bind(null, u.id)}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-line/50">Ny innloggingslenke (glemt passord)</button></form>
                            {c && <form action={toggleMember.bind(null, u.id)}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-line/50">{memberIds.has(u.id) ? `Ta ut av ${c.name}` : `Meld på ${c.name}`}</button></form>}
                          </div>
                        </details>
                      )}
                    </div>
                    {c?.join_mode === "selected" && !memberIds.has(u.id) && (
                      <form action={toggleInvite.bind(null, c.id, u.id)} className="mt-2">
                        <button className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${invited.has(u.id) ? "border-ok bg-ok-soft text-ok" : "border-line"}`}>
                          {invited.has(u.id) ? `✓ Kan bli med i ${c.name}` : `Gi tilgang til ${c.name}`}
                        </button>
                      </form>
                    )}
                    {u.invite_token && <div className="mt-2"><CopyLink url={`${appUrl}/invitasjon/${u.invite_token}`} /></div>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "regler" && (
            <>
              <section className="card space-y-2 p-4">
                <h2 className="font-bold">Strava</h2>
                {!stravaConfigured() ? (
                  <p className="text-sm text-muted">Ikke satt opp ennå: legg inn STRAVA_CLIENT_ID og STRAVA_CLIENT_SECRET i Vercel og deploy på nytt.</p>
                ) : webhook ? (
                  <p className="text-sm"><strong className="text-ok">✓ Tilkoblet med sanntids-synk.</strong> <span className="text-muted">Nye økter kommer inn sekunder etter at de er lagret på Strava. {connected} {connected === 1 ? "deltaker har" : "deltakere har"} koblet til.</span></p>
                ) : (
                  <>
                    <p className="text-sm text-muted">Strava er koblet til ({connected} {connected === 1 ? "deltaker" : "deltakere"}), men øktene hentes bare hvert 10. minutt. Slå på sanntids-synk så kommer de inn med en gang.</p>
                    <ActivateWebhook action={activateStravaWebhook} />
                  </>
                )}
              </section>
              <section className="card p-4">
                <h2 className="mb-1 font-bold">{c.name}</h2>
                <p className="mb-3 text-sm text-muted">Endringer gjelder hele utfordringen, også uker som er ferdige – bøtene regnes ut på nytt.</p>
                <ActionForm action={saveChallenge} submit="Lagre endringer"><ChallengeFields c={c} /></ActionForm>
              </section>
              <details className="card p-4">
                <summary className="cursor-pointer font-bold">Start ny utfordring</summary>
                <p className="my-3 text-sm text-muted">Alle får et «Bli med»-kort på forsiden og en melding i Prat. Den blir aktiv fra startdatoen.</p>
                <ActionForm action={saveChallenge} submit="Opprett"><ChallengeFields /></ActionForm>
              </details>
            </>
          )}
        </>
      )}
    </div>
  );
}
