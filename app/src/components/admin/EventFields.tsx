import { toParisParts } from "@/lib/dates";
import type { CalendarEvent } from "@/lib/types";

/** Champs communs aux formulaires de création et de modification d'un live. */
export function EventFields({ event }: { event?: CalendarEvent }) {
  const start = event ? toParisParts(event.starts_at) : { date: "", time: "19:00" };
  const end = event ? toParisParts(event.ends_at) : { date: "", time: "20:30" };
  return (
    <>
      <div className="form-row">
        <div className="field">
          <label htmlFor="e-type">Type</label>
          <select id="e-type" name="type" className="select" defaultValue={event?.type ?? "lab"}>
            <option value="lab">Lab (inscription, 3 places)</option>
            <option value="exploration">Exploration (tout le groupe)</option>
            <option value="autre">Autre live</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="e-cap">Places (Labs)</label>
          <input id="e-cap" name="capacity" type="number" min={1} className="input" defaultValue={event ? (event.capacity ?? "") : 3} placeholder="Illimité" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="e-title">Titre</label>
        <input id="e-title" name="title" className="input" defaultValue={event?.title ?? ""} placeholder="Lab semaine 1 · mardi" required />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="e-date">Date</label>
          <input id="e-date" name="date" type="date" className="input" defaultValue={start.date} required />
        </div>
        <div className="field">
          <label htmlFor="e-start">Début (heure de Paris)</label>
          <input id="e-start" name="start" type="time" className="input" defaultValue={start.time} required />
        </div>
        <div className="field">
          <label htmlFor="e-end">Fin</label>
          <input id="e-end" name="end" type="time" className="input" defaultValue={end.time} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="e-zoom">Lien Zoom</label>
        <input id="e-zoom" name="zoom_url" type="url" className="input" defaultValue={event?.zoom_url ?? ""} placeholder="https://zoom.us/j/…" />
        <span className="hint">Pour un Lab, le lien n'est montré qu'aux inscrits.</span>
      </div>
      <div className="field">
        <label htmlFor="e-desc">Description (facultatif)</label>
        <textarea id="e-desc" name="description" className="textarea" rows={3} defaultValue={event?.description ?? ""} />
      </div>
      <label className="check"><input type="checkbox" name="published" defaultChecked={event ? event.published : true} /> Visible par les participants</label>
    </>
  );
}
