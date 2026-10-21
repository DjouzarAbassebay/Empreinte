import Link from "next/link";
import { EventFields } from "@/components/admin/EventFields";
import { Notice } from "@/components/admin/Notice";
import { createEvent } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDayShort, formatRange } from "@/lib/dates";
import { getEvents } from "@/lib/queries";
import { EVENT_TYPE_LABEL } from "@/lib/types";

export default async function AdminAgendaPage({ searchParams }: { searchParams: Promise<{ message?: string; etat?: string }> }) {
  const { message, etat } = await searchParams;
  const { supabase } = await requireAdmin();
  const events = await getEvents(supabase);
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.ends_at).getTime() < now).reverse();

  const Row = ({ e }: { e: (typeof events)[number] }) => (
    <Link href={`/admin/agenda/${e.id}`} className="item">
      <span className={`pill ${e.type === "lab" ? "pill-spark" : e.type === "exploration" ? "pill-accent" : "pill-muted"}`}>{EVENT_TYPE_LABEL[e.type]}</span>
      <span className="grow">
        <span className="title">{e.title}{!e.published && <span className="pill pill-warn" style={{ marginLeft: 8 }}>Masqué</span>}</span>
        <span className="sub">{formatDayShort(e.starts_at)} · {formatRange(e.starts_at, e.ends_at)}{e.capacity !== null ? ` · ${e.registrations.length}/${e.capacity} inscrits` : ""}{e.replay_video_id ? " · replay" : ""}</span>
      </span>
    </Link>
  );

  return (
    <>
      <Notice message={message} etat={etat} />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="glass card">
          <h2>Nouveau créneau</h2>
          <form action={createEvent} className="form" style={{ marginTop: 10 }}>
            <EventFields />
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </form>
        </div>
        <div className="stack">
          <div className="glass card">
            <h2>À venir ({upcoming.length})</h2>
            <div className="list" style={{ marginTop: 10 }}>
              {upcoming.map((e) => <Row key={e.id} e={e} />)}
              {upcoming.length === 0 && <p className="muted small">Aucun créneau à venir.</p>}
            </div>
          </div>
          {past.length > 0 && (
            <div className="glass card">
              <h2>Passés ({past.length})</h2>
              <p className="small muted">Ouvrez un live passé pour y déposer le replay.</p>
              <div className="list" style={{ marginTop: 10 }}>
                {past.map((e) => <Row key={e.id} e={e} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
