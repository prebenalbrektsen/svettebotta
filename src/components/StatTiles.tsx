import type { Stats } from "@/lib/stats";
import { Count } from "./Count";

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

export function StatTiles({ s }: { s: Stats }) {
  const km = (v: number) => ({ value: round(v, v < 10 ? 1 : 0), decimals: v < 10 ? 1 : 0 });
  const tiles = [
    { label: "Økter", value: s.sessions, decimals: 0 },
    { label: "Timer totalt", value: round(s.minutes / 60, 1), decimals: 1 },
    { label: "Km løpt", ...km(s.runKm) },
    { label: "Timer styrke", value: round(s.strengthMin / 60, 1), decimals: 1 },
    { label: "Km sykkel", ...km(s.rideKm) },
    { label: "Km gått", ...km(s.walkKm) },
    { label: "Km svømt", ...km(s.swimKm) },
    { label: "Høydemeter", value: s.elevation, decimals: 0 },
  ];
  // Empty metrics (nobody swam, no elevation) are noise; sessions and hours always show.
  const shown = tiles.filter((t, i) => i < 2 || t.value > 0);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {shown.map((t) => (
        <div key={t.label} className="card p-3">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">{t.label}</p>
          <p className="display mt-1 text-3xl"><Count value={t.value} decimals={t.decimals} /></p>
        </div>
      ))}
    </div>
  );
}
