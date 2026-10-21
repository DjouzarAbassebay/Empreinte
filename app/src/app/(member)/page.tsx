import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { IconArrow } from "@/components/Icons";
import { requireUser } from "@/lib/auth";
import { getCompletedLessonIds, getEvents, getModulesWithLessons, getResources } from "@/lib/queries";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mdp?: string }> }) {
  const { mdp } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const [modules, completed, events, { resources }] = await Promise.all([
    getModulesWithLessons(supabase),
    getCompletedLessonIds(supabase, user.id),
    getEvents(supabase),
    getResources(supabase),
  ]);

  const openModules = modules.filter((m) => m.published);
  const allLessons = openModules.flatMap((m) => m.lessons.filter((l) => l.published));
  const doneCount = allLessons.filter((l) => completed.has(l.id)).length;
  const nextLesson = allLessons.find((l) => !completed.has(l.id));
  const pct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at).getTime() >= now).slice(0, 3);
  const latestResources = [...resources.filter((r) => r.published)].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const firstName = profile.full_name.split(" ")[0] || "";

  return (
    <>
      {mdp === "ok" && <div className="alert alert-ok" style={{ marginBottom: 20 }}>Votre mot de passe est enregistré.</div>}
      <div className="page-head">
        <div>
          <span className="label">Espace membre</span>
          <h1 style={{ marginTop: 8 }}>
            Bonjour{firstName ? ` ${firstName}` : ""}. <em>Votre empreinte</em> avance.
          </h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass card">
          <span className="label">Formation</span>
          <h2>{allLessons.length ? `${doneCount} leçon${doneCount > 1 ? "s" : ""} sur ${allLessons.length}` : "Bientôt disponible"}</h2>
          <div className="progress" style={{ margin: "14px 0 18px" }}><span style={{ width: `${pct}%` }} /></div>
          {nextLesson ? (
            <Link href={`/formation/${nextLesson.id}`} className="btn btn-primary">
              {doneCount ? "Reprendre" : "Commencer"} : {nextLesson.title} <IconArrow />
            </Link>
          ) : allLessons.length ? (
            <p className="muted">Toutes les leçons disponibles sont terminées. Bravo.</p>
          ) : (
            <p className="muted">Les vidéos apparaîtront ici dès leur mise en ligne.</p>
          )}
        </div>

        <div className="glass card">
          <span className="label">Ressources récentes</span>
          {latestResources.length ? (
            <div className="list" style={{ marginTop: 6 }}>
              {latestResources.map((r) => (
                <Link key={r.id} href={`/ressources#r-${r.id}`} className="item">
                  <span className="grow">
                    <span className="title">{r.title}</span>
                    {r.description && <span className="sub">{r.description}</span>}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">Aucune ressource pour le moment.</p>
          )}
        </div>
      </div>

      <section className="block">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h2>Prochains lives</h2>
          <Link href="/agenda" className="btn btn-ghost btn-sm">Tout l'agenda <IconArrow /></Link>
        </div>
        {upcoming.length ? (
          <div className="stack">
            {upcoming.map((e) => <EventCard key={e.id} event={e} userId={user.id} compact />)}
          </div>
        ) : (
          <div className="glass card"><p className="muted">Aucun live programmé pour l'instant.</p></div>
        )}
      </section>
    </>
  );
}
