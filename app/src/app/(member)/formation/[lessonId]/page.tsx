import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentBlocks } from "@/components/ContentBlocks";
import { IconArrow, IconCheck } from "@/components/Icons";
import { VideoPlayer } from "@/components/VideoPlayer";
import { toggleLessonComplete } from "@/lib/actions/member";
import { requireUser } from "@/lib/auth";
import { getCompletedLessonIds, getModulesWithLessons } from "@/lib/queries";
import type { Lesson } from "@/lib/types";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { supabase, user } = await requireUser();
  const [modules, completed] = await Promise.all([
    getModulesWithLessons(supabase),
    getCompletedLessonIds(supabase, user.id),
  ]);
  const ordered: Lesson[] = modules.filter((m) => m.published).flatMap((m) => m.lessons.filter((l) => l.published));
  const index = ordered.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();
  const lesson = ordered[index];
  const parent = modules.find((m) => m.id === lesson.module_id);
  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const done = completed.has(lesson.id);

  return (
    <div className="wrap-narrow" style={{ margin: "0 auto" }}>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <Link href="/formation" className="btn btn-ghost btn-sm">← Le parcours</Link>
        <span className="muted small">{parent?.title}</span>
      </div>

      <VideoPlayer videoId={lesson.bunny_video_id} title={lesson.title} status={lesson.video_status} />

      <div className="row-between" style={{ marginTop: 22, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)" }}>{lesson.title}</h1>
          {lesson.summary && <p className="muted" style={{ marginTop: 6 }}>{lesson.summary}</p>}
        </div>
        <form action={toggleLessonComplete}>
          <input type="hidden" name="lesson_id" value={lesson.id} />
          <input type="hidden" name="done" value={done ? "1" : "0"} />
          <button type="submit" className={`btn ${done ? "btn-ghost" : "btn-primary"}`}>
            <IconCheck /> {done ? "Terminée" : "Marquer comme terminée"}
          </button>
        </form>
      </div>

      <ContentBlocks blocks={lesson.content ?? []} lessonId={lesson.id} />

      <div className="row-between" style={{ marginTop: 36 }}>
        {prev ? <Link href={`/formation/${prev.id}`} className="btn btn-ghost">← {prev.title}</Link> : <span />}
        {next ? (
          <Link href={`/formation/${next.id}`} className="btn btn-primary">{next.title} <IconArrow /></Link>
        ) : (
          <Link href="/formation" className="btn btn-ghost">Retour au parcours</Link>
        )}
      </div>
    </div>
  );
}
