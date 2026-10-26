import type { Workout } from "./challenge";

const STRENGTH = ["WeightTraining", "Crossfit", "HighIntensityIntervalTraining", "Workout"];
const RUN = ["Run", "TrailRun", "VirtualRun"];
const RIDE = ["Ride", "VirtualRide", "GravelRide", "MountainBikeRide", "EBikeRide"];

export type Stats = ReturnType<typeof computeStats>;

export function computeStats(workouts: Workout[]) {
  // Only checked-in workouts are part of the challenge, so only they show up in the numbers.
  const valid = workouts.filter((w) => !w.rejected && w.checked_in_at);
  const km = (codes: string[]) => valid.filter((w) => codes.includes(w.sport)).reduce((s, w) => s + (w.distance_m ?? 0), 0) / 1000;
  const bySport = new Map<string, { sport: string; count: number; minutes: number; km: number }>();
  for (const w of valid) {
    const e = bySport.get(w.sport) ?? { sport: w.sport, count: 0, minutes: 0, km: 0 };
    e.count++;
    e.minutes += w.duration_min;
    e.km += (w.distance_m ?? 0) / 1000;
    bySport.set(w.sport, e);
  }
  return {
    sessions: valid.length,
    minutes: valid.reduce((s, w) => s + w.duration_min, 0),
    runKm: km(RUN),
    rideKm: km(RIDE),
    swimKm: km(["Swim"]),
    walkKm: km(["Walk", "Hike"]),
    strengthMin: valid.filter((w) => STRENGTH.includes(w.sport)).reduce((s, w) => s + w.duration_min, 0),
    elevation: valid.reduce((s, w) => s + (w.elevation_m ?? 0), 0),
    longest: valid.reduce((m, w) => Math.max(m, w.duration_min), 0),
    bySport: [...bySport.values()].sort((a, b) => b.minutes - a.minutes),
  };
}

export function fmtKm(km: number): string {
  return km.toLocaleString("nb-NO", { maximumFractionDigits: km < 10 ? 1 : 0 });
}

export function fmtHours(min: number): string {
  return (min / 60).toLocaleString("nb-NO", { maximumFractionDigits: 1 });
}
