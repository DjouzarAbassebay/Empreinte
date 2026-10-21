export const TZ = "Europe/Paris";

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const dayShortFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const fullFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDay(iso: string) {
  return capitalize(dayFmt.format(new Date(iso)));
}
export function formatDayShort(iso: string) {
  return capitalize(dayShortFmt.format(new Date(iso)).replace(".", ""));
}
export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso)).replace(":", "h");
}
export function formatRange(startIso: string, endIso: string) {
  return `${formatTime(startIso)} à ${formatTime(endIso)}`;
}
export function formatFull(iso: string) {
  return capitalize(fullFmt.format(new Date(iso)));
}
export function formatDuration(seconds: number) {
  if (!seconds) return "";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Composantes locales (Europe/Paris) d'un instant, pour pré-remplir un formulaire. */
export function toParisParts(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** Convertit une date et une heure saisies en heure de Paris vers un instant UTC. */
export function parisToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // Première estimation comme si Paris était en UTC, puis correction par l'écart réel.
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const offset = parisOffsetMinutes(new Date(guess));
    guess = Date.UTC(y, mo - 1, d, h, mi) - offset * 60_000;
  }
  return new Date(guess);
}

function parisOffsetMinutes(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}
