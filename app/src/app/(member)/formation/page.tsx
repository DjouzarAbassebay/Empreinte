import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconLock, IconPlay } from "@/components/Icons";
import { requireUser } from "@/lib/auth";
import { formatDuration } from "@/lib/dates";
import { getCompletedLessonIds, getModulesWithLessons } from "@/lib/queries";

export const metadata: Metadata = { title: "Formation" };

export default async function FormationPage() {
  const { supabase, user } = await requireUser();
  const [modules, completed] = await Promise.all([
    getModulesWithLessons(supabase),
    getCompletedLessonIds(supabase, user.id),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Formation</span>
          <h1 style={{ marginTop: 8 }}>Le parcours vidéo.</h1>
          <p className="intro">Le préambule puis les 4 semaines. Chaque semaine se débloque au fil du bootcamp. Sous chaque vidéo : les ateliers, les prompts et les documents à télécharger.</p>
        </div>
      </div>

      {modules.length === 0 && (
        <div className="glass card"><p className="muted">Le parcours sera disponible très bientôt.</p></div>
      )}

      <div className="stack">
        {modules.map((m, idx) => {
          const lessons = m.lessons.filter((l) => l.published);
          const done = lessons.filter((l) => completed.has(l.id)).length;
          const locked = !m.published;
          return (
            <section key={m.id} className={`glass card ${locked ? "locked" : ""}`}>
              <div className="row-between">
                <div>
                  <span className="label">{m.subtitle || `Étape ${idx + 1}`}</span>
                  <h2>{m.title}</h2>
                </div>
                {locked ? (
                  <span className="pill pill-muted"><IconLock className="" /> Bientôt</span>
                ) : lessons.length ? (
                  <span className={`pill ${done === lessons.length ? "pill-ok" : "pill-accent"}`}>{done}/{lessons.length} terminée{done > 1 ? "s" : ""}</span>
                ) : null}
              </div>
              {m.description && <p className="muted" style={{ marginTop: 8, maxWidth: "62ch" }}>{m.description}</p>}
              {!locked && lessons.length > 0 && (
                <div className="list" style={{ marginTop: 18 }}>
                  {lessons.map((l, i) => {
                    const isDone = completed.has(l.id);
                    return (
                      <Link key={l.id} href={`/formation/${l.id}`} className="item">
                        <span className={`num ${isDone ? "done" : ""}`}>{isDone ? <IconCheck className="" /> : i + 1}</span>
                        <span className="grow">
                          <span className="title">{l.title}</span>
                          <span className="sub">{[l.video_duration ? formatDuration(l.video_duration) : l.bunny_video_id ? "Vidéo" : "Contenu", l.summary].filter(Boolean).join(" · ")}</span>
                        </span>
                        <IconPlay className="" />
                      </Link>
                    );
                  })}
                </div>
              )}
              {!locked && lessons.length === 0 && <p className="muted small" style={{ marginTop: 12 }}>Les leçons de ce module arrivent.</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
