"use client";

import { useActionState, useMemo, useState } from "react";
import { logWorkout } from "@/app/(app)/actions";
import { resizeImage as resize } from "@/lib/resize";
import { COMMON_SPORTS, SPORTS, sportIcon } from "@/lib/sports";
import { Icon } from "./Icon";

const DURATIONS = [35, 45, 60, 90];

function minusMinutes(hhmm: string, minutes: number): { time: string; dayBack: boolean } {
  const [h, m] = hhmm.split(":").map(Number);
  let total = h * 60 + m - minutes;
  const dayBack = total < 0;
  if (dayBack) total += 24 * 60;
  return { time: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`, dayBack };
}

/**
 * Manual workout = check-in, so it needs the same facts: what, when, how long, and a photo.
 * Built for thumbs: big sport and duration buttons, «I dag / I går» instead of a date picker,
 * and the save button pinned above the tab bar.
 */
export function LogForm({
  today,
  yesterday,
  nowTime,
  task,
  sessionMinutes,
  proofRequired,
}: {
  today: string;
  yesterday: string;
  nowTime: string;
  task: { title: string; auto: string[] } | null;
  sessionMinutes: number;
  proofRequired: boolean;
}) {
  const [state, action, pending] = useActionState(logWorkout, undefined);
  const [sport, setSport] = useState("Run");
  const [showAll, setShowAll] = useState(false);
  const [duration, setDuration] = useState("");
  const [day, setDay] = useState<"today" | "yesterday">("today");
  const [time, setTime] = useState<string | null>(null); // null = follow «now minus duration»
  const [proof, setProof] = useState("");

  // People log after training, so the start time defaults to now minus the duration.
  const auto = useMemo(() => minusMinutes(nowTime, Number(duration) || 0), [nowTime, duration]);
  const startTime = time ?? auto.time;
  const startDay = time === null && auto.dayBack && day === "today" ? yesterday : day === "today" ? today : yesterday;
  const hasDistance = SPORTS[sport]?.distance;
  const others = Object.entries(SPORTS).filter(([code]) => !COMMON_SPORTS.includes(code));
  const ready = !!duration && (!proofRequired || !!proof);

  const chip = (active: boolean) =>
    `flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border px-2 text-sm font-semibold ${active ? "border-ink bg-ink text-paper" : "border-line bg-field"}`;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="started_at" value={`${startDay}T${startTime}`} />

      <fieldset>
        <legend className="label">Hva trente du?</legend>
        <div className="grid grid-cols-3 gap-2">
          {COMMON_SPORTS.map((code) => (
            <button key={code} type="button" className={chip(sport === code)} onClick={() => { setSport(code); setShowAll(false); }}>
              <Icon name={sportIcon(code)} className="h-4 w-4 shrink-0" />{SPORTS[code].label}
            </button>
          ))}
        </div>
        {showAll || !COMMON_SPORTS.includes(sport) ? (
          <select className="field mt-2" value={COMMON_SPORTS.includes(sport) ? "" : sport} onChange={(e) => setSport(e.target.value)} aria-label="Annen treningsform">
            <option value="" disabled>Velg treningsform …</option>
            {others.map(([code, s]) => <option key={code} value={code}>{s.label}</option>)}
          </select>
        ) : (
          <button type="button" className="mt-2 text-sm font-semibold text-muted underline" onClick={() => setShowAll(true)}>Annet …</button>
        )}
      </fieldset>

      <fieldset>
        <legend className="label">Hvor lenge?</legend>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((m) => (
            <button key={m} type="button" className={chip(duration === String(m))} onClick={() => setDuration(String(m))}>{m} min</button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-muted">Annet:</span>
          <span className="relative w-28">
            <input name="duration_min" type="number" inputMode="numeric" min={1} max={1440} className="field pr-11" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">min</span>
          </span>
        </label>
        {duration && Number(duration) < sessionMinutes && (
          <p className="mt-2 text-sm text-warn">Under {sessionMinutes} min teller ikke som en av ukas økter, men den kommer med i statistikken.</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="label">Når startet du?</legend>
        <div className="flex gap-2">
          <button type="button" className={`${chip(startDay === today)} flex-1`} onClick={() => setDay("today")}>I dag</button>
          <button type="button" className={`${chip(startDay === yesterday)} flex-1`} onClick={() => setDay("yesterday")}>I går</button>
          <input type="time" aria-label="Klokkeslett" className="field w-28" value={startTime} onChange={(e) => setTime(e.target.value || null)} required />
        </div>
      </fieldset>

      {hasDistance && (
        <label className="block">
          <span className="label">Distanse (valgfritt)</span>
          <span className="relative block">
            <input name="distance_km" inputMode="decimal" className="field pr-11" placeholder="5,2" />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">km</span>
          </span>
        </label>
      )}

      <div>
        <span className="label">Bilde{proofRequired ? " (påkrevd)" : " (valgfritt)"}</span>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-field p-3 text-center text-sm text-muted">
          {proof ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proof} alt="Valgt bilde" className="max-h-56 rounded-lg" />
          ) : (
            <>
              <Icon name="camera" className="h-6 w-6" />
              <span className="font-semibold text-ink">Ta eller velg bilde</span>
              <span>Skjermbilde fra klokka/appen, eller et bilde av økta</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setProof(await resize(f));
            }}
          />
        </label>
        <input type="hidden" name="proof" value={proof} />
      </div>

      <label className="block">
        <span className="label">Kommentar (valgfritt)</span>
        <input name="title" className="field" placeholder="Bein-dag, intervaller, morgensvøm …" maxLength={80} />
      </label>

      {task && !task.auto.includes(sport) && (
        <label className="flex items-start gap-3 rounded-xl bg-heat-soft p-3">
          <input type="checkbox" name="meets_task" className="mt-1 h-5 w-5 accent-[#ff4d1c]" />
          <span><strong>Oppfyller ukeskravet:</strong> {task.title}</span>
        </label>
      )}
      {task && task.auto.includes(sport) && <p className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-ok">✓ Denne typen økt oppfyller ukeskravet automatisk.</p>}

      <div className="sticky bottom-[calc(88px+env(safe-area-inset-bottom))] -mx-4 border-t border-line bg-card/95 px-4 pt-3 pb-3 backdrop-blur sm:bottom-0">
        {state?.error && <p className="mb-2 text-sm font-semibold text-bad">{state.error}</p>}
        <button className="btn btn-heat w-full text-lg disabled:opacity-50" disabled={pending || !ready}>
          {pending ? "Lagrer …" : ready ? "Registrer og sjekk inn" : !duration ? "Velg hvor lenge" : "Legg ved et bilde"}
        </button>
      </div>
    </form>
  );
}
