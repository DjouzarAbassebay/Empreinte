import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { EventFields } from "@/components/admin/EventFields";
import { Notice } from "@/components/admin/Notice";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { VideoPlayer } from "@/components/VideoPlayer";
import { addRegistration, deleteEvent, detachVideo, removeRegistration, updateEvent } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { formatFull, formatRange } from "@/lib/dates";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent, EventRegistration, Profile } from "@/lib/types";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; etat?: string }>;
}) {
  const { id } = await params;
  const { message, etat } = await searchParams;
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();
  const [{ data: event }, { data: regs }, { data: profiles }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase.from("event_registrations").select("*").eq("event_id", id).order("created_at"),
    admin.from("profiles").select("*").order("full_name"),
  ]);
  if (!event) notFound();
  const e = event as CalendarEvent;
  const registrations = (regs ?? []) as EventRegistration[];
  const people = (profiles ?? []) as Profile[];
  const byId = new Map(people.map((p) => [p.id, p]));
  const notRegistered = people.filter((p) => !registrations.some((r) => r.user_id === p.id));

  return (
    <>
      <Link href="/admin/agenda" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>← Agenda</Link>
      <Notice message={message} etat={etat} />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="glass card">
          <h2>{e.title}</h2>
          <p className="muted small" style={{ marginBottom: 14 }}>{formatFull(e.starts_at)} · {formatRange(e.starts_at, e.ends_at)}</p>
          <form action={updateEvent} className="form">
            <input type="hidden" name="id" value={e.id} />
            <EventFields event={e} />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
          <hr className="sep" />
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={e.id} />
            <ConfirmButton message="Supprimer ce créneau et ses inscriptions ?">Supprimer le créneau</ConfirmButton>
          </form>
        </div>

        <div className="stack">
          <div className="glass card">
            <h2>Inscrits {e.capacity !== null ? `(${registrations.length}/${e.capacity})` : `(${registrations.length})`}</h2>
            {e.type !== "lab" && <p className="small muted">Les Explorations sont ouvertes à tout le groupe, sans inscription.</p>}
            <div className="list" style={{ marginTop: 10 }}>
              {registrations.map((r) => {
                const p = byId.get(r.user_id);
                return (
                  <div key={r.user_id} className="item">
                    <span className="grow">
                      <span className="title">{p?.full_name || p?.email || "Compte supprimé"}</span>
                      <span className="sub">{p?.email}</span>
                    </span>
                    <form action={removeRegistration}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <input type="hidden" name="user_id" value={r.user_id} />
                      <button type="submit" className="btn btn-ghost btn-sm">Retirer</button>
                    </form>
                  </div>
                );
              })}
              {registrations.length === 0 && <p className="muted small">Personne pour l'instant.</p>}
            </div>
            {notRegistered.length > 0 && (
              <form action={addRegistration} className="row" style={{ marginTop: 14 }}>
                <input type="hidden" name="event_id" value={e.id} />
                <select name="user_id" className="select" style={{ flex: 1 }} defaultValue="">
                  <option value="" disabled>Inscrire quelqu'un manuellement…</option>
                  {notRegistered.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select>
                <button type="submit" className="btn btn-ghost btn-sm">Inscrire</button>
              </form>
            )}
          </div>

          <div className="glass card">
            <h2>Replay</h2>
            <p className="small muted" style={{ marginBottom: 12 }}>Déposez l'enregistrement du live : il apparaîtra sous ce créneau, dans « Lives passés et replays ».</p>
            {e.replay_video_id ? (
              <>
                <VideoPlayer videoId={e.replay_video_id} title={`Replay : ${e.title}`} />
                <form action={detachVideo} style={{ marginTop: 12 }}>
                  <input type="hidden" name="kind" value="event" />
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmButton className="btn btn-ghost btn-sm" message="Retirer ce replay ? La vidéo sera supprimée de Bunny.">Retirer le replay</ConfirmButton>
                </form>
                <div style={{ marginTop: 12 }}>
                  <VideoUploader target={{ kind: "event", id: e.id }} defaultTitle={`Replay · ${e.title}`} label="Remplacer le replay" />
                </div>
              </>
            ) : (
              <VideoUploader target={{ kind: "event", id: e.id }} defaultTitle={`Replay · ${e.title}`} label="Envoyer le replay" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
