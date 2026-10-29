// One line-icon set for the whole app (24×24, 2 px stroke, round caps), so nothing depends on how
// a phone happens to draw emoji.
const PATHS: Record<string, string[]> = {
  run: ["M14.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3", "M7 21l3-6 3 2v5", "M10 15l1-5 4 2 3-1", "M11 10L8 9l-2 3"],
  walk: ["M12.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3", "M10 21l2-6 3 3v3", "M12 15l-.5-6-3 2.5V14", "M11.5 9l3.5 2.5"],
  hike: ["M11.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3", "M9 21l2-6 3 3v3", "M11 15l-.5-6-3 2.5V14", "M10.5 9l3.5 2.5", "M17 10v11"],
  bike: ["M5.5 20a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7", "M18.5 20a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7", "M5.5 16.5L9 10h6l3.5 6.5", "M9 10l3.5 6.5", "M15 10l-1.5-4H11"],
  swim: ["M2 19c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5", "M17 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M4 14l5-5 3 2 2-2"],
  strength: ["M6 6v12", "M18 6v12", "M3 9v6", "M21 9v6", "M6 12h12"],
  yoga: ["M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M12 8v6", "M5 11l7 3 7-3", "M7 21l5-7 5 7"],
  ski: ["M14 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M3 21l18-5", "M9 18l2-5 4 1 1-5-4-1-3 3"],
  paddle: ["M5 19L19 5", "M16 5l3-3 3 3-3 3z", "M2 21c2 0 2-1.5 4-1.5"],
  ball: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M12 7l4 3-1.5 4.5h-5L8 10z", "M12 3v4", "M21 10.5l-5-.5", "M3 10.5l5-.5", "M14.5 14.5l3 4", "M9.5 14.5l-3 4"],
  pulse: ["M3 12h4l2-5 4 10 2-5h6"],
  flame: ["M12 3c1 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.6 2.3-4.6 0 2 1 3.1 2.2 3.1 0-3-1-5 0-7.5z"],
  comment: ["M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"],
  camera: ["M4 8h3l2-3h6l2 3h3v11H4z", "M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  back: ["M15 5l-7 7 7 7"],
  more: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M12 7v5l3 2"],
  runner: ["M15 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2", "M13 8l-2 5.5", "M11 13.5l3.5 2.5-1 5", "M11 13.5l-2.5 3.5-3.5 1.5", "M13 8l3.5 2 2.5-1.5", "M13 8l-3.5 1.5-2 2.5"], // the logo
  heart: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"],
};

export function Icon({ name, className = "h-5 w-5", label }: { name: string; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {(PATHS[name] ?? PATHS.pulse).map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
