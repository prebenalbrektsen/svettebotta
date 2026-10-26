// Every week runs Monday 00:00 to Sunday 24:00 Norwegian time, so all date maths uses
// Europe/Oslo calendar dates as plain "YYYY-MM-DD" strings.
const TZ = "Europe/Oslo";

export function osloDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7));
}

/** Monday dates of every week the challenge touches, first to last. */
export function weeksBetween(startsOn: string, endsOn: string): string[] {
  const weeks: string[] = [];
  for (let w = mondayOf(startsOn); w <= endsOn; w = addDays(w, 7)) weeks.push(w);
  return weeks;
}

export function isoWeekNumber(monday: string): number {
  const thursday = new Date(`${addDays(monday, 3)}T12:00:00Z`); // Thursday decides the ISO year
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.floor((thursday.getTime() - yearStart) / 86400000 / 7) + 1;
}

const dayFmt = new Intl.DateTimeFormat("nb-NO", { timeZone: TZ, day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("nb-NO", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function formatDay(date: string): string {
  return dayFmt.format(new Date(`${date}T12:00:00Z`));
}

export function formatWeekRange(monday: string): string {
  return `${formatDay(monday)}–${formatDay(addDays(monday, 6))}`;
}

export function formatDateTime(at: Date): string {
  return dateTimeFmt.format(at);
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} t ${m} min` : `${h} t`;
}

/** Converts a local Oslo "YYYY-MM-DDTHH:mm" (from a datetime-local input) to a Date. */
export function fromOsloLocal(value: string): Date {
  const guess = new Date(`${value}:00Z`);
  const shown = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(guess).replace(", ", "T");
  const offsetMs = new Date(`${shown}:00Z`).getTime() - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

export function toOsloLocalInput(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(at).replace(", ", "T");
}

const timeFmt = new Intl.DateTimeFormat("nb-NO", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("nb-NO", { timeZone: TZ, weekday: "long" });

/** «i dag 14:05», «i går 07:30», «fredag 18:00», then «12. okt.» – short enough for one line. */
export function relativeTime(at: Date, withTime = true): string {
  const day = osloDate(at);
  const today = osloDate();
  const time = withTime ? ` ${timeFmt.format(at)}` : "";
  if (day === today) return `i dag${time}`;
  if (day === addDays(today, -1)) return `i går${time}`;
  if (day > addDays(today, -6)) return `${weekdayFmt.format(at)}${time}`;
  return formatDay(day);
}

/** «akkurat nå», «for 4 min siden», «for 2 t siden», else relativeTime. */
export function ago(at: Date): string {
  const min = Math.round((Date.now() - at.getTime()) / 60000);
  if (min < 1) return "akkurat nå";
  if (min < 60) return `for ${min} min siden`;
  if (min < 12 * 60) return `for ${Math.floor(min / 60)} t siden`;
  return relativeTime(at);
}

/** Day heading for a chat: «I dag», «I går», «Fredag 23. okt.». */
export function dayHeading(at: Date): string {
  const day = osloDate(at);
  const today = osloDate();
  if (day === today) return "I dag";
  if (day === addDays(today, -1)) return "I går";
  const w = weekdayFmt.format(at);
  return `${w[0].toUpperCase()}${w.slice(1)} ${formatDay(day)}`;
}
