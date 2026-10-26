import { fmtHours, fmtKm, type Stats } from "@/lib/stats";

export function StatTiles({ s }: { s: Stats }) {
  const tiles = [
    { label: "Økter", value: String(s.sessions) },
    { label: "Timer totalt", value: fmtHours(s.minutes) },
    { label: "Km løpt", value: fmtKm(s.runKm) },
    { label: "Timer styrke", value: fmtHours(s.strengthMin) },
    { label: "Km sykkel", value: fmtKm(s.rideKm) },
    { label: "Km gått", value: fmtKm(s.walkKm) },
    { label: "Km svømt", value: fmtKm(s.swimKm) },
    { label: "Høydemeter", value: s.elevation.toLocaleString("nb-NO") },
  ];
  // Empty metrics (nobody swam, no elevation) are noise; sessions and hours always show.
  const shown = tiles.filter((t, i) => i < 2 || t.value !== "0");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {shown.map((t) => (
        <div key={t.label} className="card p-3">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">{t.label}</p>
          <p className="display mt-1 text-3xl">{t.value}</p>
        </div>
      ))}
    </div>
  );
}
