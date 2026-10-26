/** How each kind of watch gets its workouts into Strava (and so into Svettebøtta). */
export function WatchGuide() {
  const steps = [
    { title: "Garmin", text: "Garmin Connect-appen → Innstillinger (⋯ Mer) → Tilkoblede apper → Strava → Koble til. Øktene går automatisk videre etterpå." },
    { title: "Apple Watch", text: "Strava-appen på iPhone → Innstillinger → Apper, tjenester og enheter → Helse → slå på import av treningsøkter. Øktene fra Trening-appen på klokka kommer da inn i Strava. (Eller ta opp økta med Strava-appen på klokka.)" },
    { title: "Polar, Suunto, Coros, Wahoo, Fitbit", text: "Koble Strava til i klokkeprodusentens app, under tilkoblede tjenester/partnere." },
    { title: "Ingen klokke?", text: "Ta opp økta i Strava-appen på telefonen – eller registrer den for hånd her med et bilde." },
  ];
  return (
    <details className="card p-4">
      <summary className="cursor-pointer font-semibold">Slik får du økter fra klokka inn i Strava</summary>
      <ol className="mt-3 space-y-3 text-sm">
        {steps.map((s) => (
          <li key={s.title}>
            <p className="font-bold">{s.title}</p>
            <p className="text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">En gratis Strava-konto holder.</p>
    </details>
  );
}
