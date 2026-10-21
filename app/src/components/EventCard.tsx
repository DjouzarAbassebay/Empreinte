import { registerForEvent, unregisterFromEvent } from "@/lib/actions/member";
import { formatRange, TZ } from "@/lib/dates";
import { EVENT_TYPE_LABEL, type CalendarEvent, type EventRegistration } from "@/lib/types";
import { IconCalendar, IconVideo } from "./Icons";
import { VideoPlayer } from "./VideoPlayer";

type EventWithRegs = CalendarEvent & { registrations: EventRegistration[] };

const dayParts = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short", weekday: "short" });

export function EventCard({
  event,
  userId,
  compact = false,
}: {
  event: EventWithRegs;
  userId: string;
  compact?: boolean;
}) {
  const parts = dayParts.formatToParts(new Date(event.starts_at));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const isLab = event.type === "lab";
  const past = new Date(event.ends_at).getTime() < Date.now();
  const started = new Date(event.starts_at).getTime() < Date.now();
  const count = event.registrations.length;
  const registered = event.registrations.some((r) => r.user_id === userId);
  const full = event.capacity !== null && count >= event.capacity;
  const showZoom = Boolean(event.zoom_url) && !past && (!isLab || registered);

  return (
    <article id={`e-${event.id}`} className={`glass card event ${event.type} ${past ? "past" : ""}`}>
      <div className="when">
        <div className="d">{get("day")}</div>
        <div className="m">{get("month").replace(".", "")}</div>
        <div className="w">{get("weekday").replace(".", "")}</div>
      </div>
      <div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`pill ${isLab ? "pill-spark" : event.type === "exploration" ? "pill-accent" : "pill-muted"}`}>
            {EVENT_TYPE_LABEL[event.type]}
          </span>
          {registered && !past && <span className="pill pill-ok">Inscrit</span>}
          {past && <span className="pill pill-muted">Terminé</span>}
        </div>
        <h3 style={{ marginTop: 10 }}>{event.title}</h3>
        <div className="meta">
          <span>{formatRange(event.starts_at, event.ends_at)}</span>
          {isLab && event.capacity !== null && (
            <span className="row" style={{ gap: 8 }}>
              <span className="seats" aria-hidden="true">
                {Array.from({ length: event.capacity }).map((_, i) => (
                  <i key={i} className={i < count ? "on" : ""} />
                ))}
              </span>
              {count}/{event.capacity} place{event.capacity > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {!compact && event.description && (
          <p className="small" style={{ marginTop: 10, whiteSpace: "pre-line" }}>{event.description}</p>
        )}
        <div className="actions">
          {showZoom && (
            <a className="btn btn-primary btn-sm" href={event.zoom_url} target="_blank" rel="noopener">
              <IconVideo /> Rejoindre sur Zoom
            </a>
          )}
          {isLab && !started && !registered && (
            full ? (
              <button type="button" className="btn btn-ghost btn-sm" disabled>Complet</button>
            ) : (
              <form action={registerForEvent} className="inline-form">
                <input type="hidden" name="event_id" value={event.id} />
                <button type="submit" className="btn btn-primary btn-sm">S'inscrire à ce Lab</button>
              </form>
            )
          )}
          {isLab && !started && registered && (
            <form action={unregisterFromEvent} className="inline-form">
              <input type="hidden" name="event_id" value={event.id} />
              <button type="submit" className="btn btn-ghost btn-sm">Me désinscrire</button>
            </form>
          )}
          {!past && (
            <a className="btn btn-ghost btn-sm" href={`/api/agenda/${event.id}.ics`}>
              <IconCalendar /> Ajouter à mon agenda
            </a>
          )}
        </div>
        {!compact && past && event.replay_video_id && (
          <div style={{ marginTop: 18 }}>
            <span className="label" style={{ marginBottom: 10 }}>Replay</span>
            <VideoPlayer videoId={event.replay_video_id} title={`Replay : ${event.title}`} />
          </div>
        )}
      </div>
    </article>
  );
}
