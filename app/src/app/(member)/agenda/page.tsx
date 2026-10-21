import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { IconCalendar } from "@/components/Icons";
import { requireUser } from "@/lib/auth";
import { getEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ message?: string; etat?: string }> }) {
  const { message, etat } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const events = await getEvents(supabase);
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.ends_at).getTime() < now).reverse();
  const feedUrl = profile.calendar_token ? `/api/calendrier/${profile.calendar_token}.ics` : null;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Agenda</span>
          <h1 style={{ marginTop: 8 }}>Vos lives.</h1>
          <p className="intro">Les Explorations réunissent tout le groupe le mardi soir. Les Labs se font à 3 maximum : inscrivez-vous au créneau qui vous convient, chaque semaine.</p>
        </div>
        {feedUrl && (
          <a className="btn btn-ghost" href={feedUrl}>
            <IconCalendar /> S'abonner au calendrier
          </a>
        )}
      </div>

      {message && (
        <div className={`alert ${etat === "ok" ? "alert-ok" : "alert-error"}`} role="status" style={{ marginBottom: 20 }}>{message}</div>
      )}

      {upcoming.length ? (
        <div className="stack">
          {upcoming.map((e) => <EventCard key={e.id} event={e} userId={user.id} />)}
        </div>
      ) : (
        <div className="glass card"><p className="muted">Aucun live à venir pour l'instant. Les créneaux sont ajoutés chaque semaine.</p></div>
      )}

      {past.length > 0 && (
        <section className="block">
          <h2>Lives passés et replays</h2>
          <div className="stack">
            {past.map((e) => <EventCard key={e.id} event={e} userId={user.id} />)}
          </div>
        </section>
      )}

      {feedUrl && (
        <p className="small muted" style={{ marginTop: 28 }}>
          Pour un abonnement qui se met à jour tout seul dans Google Agenda ou Apple Calendrier, utilisez cette adresse : <code className="code-box" style={{ display: "inline", padding: "2px 8px", fontSize: ".8rem" }}>{(process.env.NEXT_PUBLIC_SITE_URL ?? "") + feedUrl}</code>
        </p>
      )}
    </>
  );
}
