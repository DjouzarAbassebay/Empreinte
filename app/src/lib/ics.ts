import type { CalendarEvent } from "@/lib/types";
import { EVENT_TYPE_LABEL } from "@/lib/types";

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 60) {
    out.push(rest.slice(0, 60));
    rest = " " + rest.slice(60);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(events: CalendarEvent[], name = "Empreinte") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Empreinte//Espace membre//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(name)}`,
    "X-WR-TIMEZONE:Europe/Paris",
  ];
  const stamp = icsDate(new Date().toISOString());
  for (const e of events) {
    const desc = [e.description, e.zoom_url ? `Lien Zoom : ${e.zoom_url}` : ""]
      .filter(Boolean)
      .join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@bootcamp-empreinte.fr`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(e.starts_at)}`,
      `DTEND:${icsDate(e.ends_at)}`,
      fold(`SUMMARY:${escape(`${EVENT_TYPE_LABEL[e.type]} · ${e.title}`)}`),
    );
    if (desc) lines.push(fold(`DESCRIPTION:${escape(desc)}`));
    if (e.zoom_url) lines.push(fold(`URL:${e.zoom_url}`), fold(`LOCATION:${escape(e.zoom_url)}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
