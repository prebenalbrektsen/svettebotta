// Sport codes are Strava's sport_type values, so manual and imported workouts share one list.
export const SPORTS: Record<string, { label: string; icon: string; distance?: boolean }> = {
  Run: { label: "Løping", icon: "run", distance: true },
  TrailRun: { label: "Terrengløp", icon: "run", distance: true },
  Walk: { label: "Gåtur", icon: "walk", distance: true },
  Hike: { label: "Fjelltur", icon: "hike", distance: true },
  Ride: { label: "Sykkel", icon: "bike", distance: true },
  VirtualRide: { label: "Spinning / innesykkel", icon: "bike", distance: true },
  Swim: { label: "Svømming", icon: "swim", distance: true },
  WeightTraining: { label: "Styrke", icon: "strength" },
  Crossfit: { label: "Crossfit", icon: "strength" },
  HighIntensityIntervalTraining: { label: "HIIT", icon: "pulse" },
  Workout: { label: "Trening", icon: "strength" },
  Yoga: { label: "Yoga", icon: "yoga" },
  Pilates: { label: "Pilates", icon: "yoga" },
  NordicSki: { label: "Langrenn", icon: "ski", distance: true },
  AlpineSki: { label: "Alpint", icon: "ski" },
  BackcountrySki: { label: "Topptur", icon: "ski", distance: true },
  Rowing: { label: "Roing", icon: "paddle", distance: true },
  Kayaking: { label: "Padling", icon: "paddle", distance: true },
  StandUpPaddling: { label: "SUP", icon: "paddle", distance: true },
  Soccer: { label: "Fotball", icon: "ball" },
  Padel: { label: "Padel", icon: "ball" },
  Tennis: { label: "Tennis", icon: "ball" },
  Badminton: { label: "Badminton", icon: "ball" },
  Elliptical: { label: "Ellipse", icon: "pulse" },
  StairStepper: { label: "Trappemaskin", icon: "pulse" },
  RockClimbing: { label: "Klatring", icon: "hike" },
  Dance: { label: "Dans", icon: "pulse" },
};

// "In water" style tasks: these count as meeting a water task without a tick.
export const WATER_SPORTS = ["Swim", "Rowing", "Kayaking", "StandUpPaddling", "Surfing", "Canoeing"];

export function sportLabel(code: string): string {
  return SPORTS[code]?.label ?? code.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function sportIcon(code: string): string {
  return SPORTS[code]?.icon ?? "pulse";
}

/** The sports most people log, shown as big buttons; the rest sit behind «Annet». */
export const COMMON_SPORTS = ["Run", "WeightTraining", "Walk", "Ride", "Swim", "Hike"];
