import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { LessonContentEditor } from "@/components/admin/LessonContentEditor";
import { Notice } from "@/components/admin/Notice";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { VideoPlayer } from "@/components/VideoPlayer";
import { deleteLesson, detachVideo, refreshLessonVideo, syncLessonVideo, updateLesson } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { statusLabel } from "@/lib/bunny";
import { formatDuration } from "@/lib/dates";
import type { Lesson, Module } from "@/lib/types";

export default async function AdminLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; etat?: string }>;
}) {
  const { id } = await params;
  const { message, etat } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (!data) notFound();
  let lesson = data as Lesson;
  if (lesson.bunny_video_id && lesson.video_status !== "ready" && lesson.video_status !== "failed") {
    const status = await syncLessonVideo(lesson.id);
    if (status) lesson = { ...lesson, video_status: status };
  }
  const { data: mod } = await supabase.from("modules").select("*").eq("id", lesson.module_id).single();
  const parent = mod as Module | null;

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <Link href="/admin/formation" className="btn btn-ghost btn-sm">← Formation</Link>
        <Link href={`/formation/${lesson.id}`} className="btn btn-ghost btn-sm" target="_blank">Voir comme participant</Link>
      </div>
      <Notice message={message} etat={etat} />

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="glass card">
            <span className="label">{parent?.title}</span>
            <form action={updateLesson} className="form">
              <input type="hidden" name="id" value={lesson.id} />
              <div className="field"><label htmlFor="l-title">Titre</label><input id="l-title" name="title" className="input" defaultValue={lesson.title} required /></div>
              <div className="field"><label htmlFor="l-sum">Résumé court (facultatif)</label><input id="l-sum" name="summary" className="input" defaultValue={lesson.summary} /></div>
              <label className="check"><input type="checkbox" name="published" defaultChecked={lesson.published} /> Leçon publiée (visible si le module est débloqué)</label>
              <div className="form-actions"><button type="submit" className="btn btn-primary">Enregistrer</button></div>
            </form>
            <hr className="sep" />
            <form action={deleteLesson}>
              <input type="hidden" name="id" value={lesson.id} />
              <ConfirmButton message={`Supprimer la leçon « ${lesson.title} » ?`}>Supprimer la leçon</ConfirmButton>
            </form>
          </div>

          <div className="glass card">
            <h2>Vidéo</h2>
            {lesson.bunny_video_id ? (
              <>
                <div className="row small" style={{ margin: "6px 0 12px" }}>
                  <span className={`pill ${lesson.video_status === "ready" ? "pill-ok" : lesson.video_status === "failed" ? "pill-warn" : "pill-accent"}`}>{statusLabel(lesson.video_status)}</span>
                  {lesson.video_duration > 0 && <span className="muted">{formatDuration(lesson.video_duration)}</span>}
                  {lesson.video_status !== "ready" && (
                    <form action={refreshLessonVideo}><input type="hidden" name="id" value={lesson.id} /><button type="submit" className="btn btn-ghost btn-sm">Actualiser l'état</button></form>
                  )}
                </div>
                <VideoPlayer videoId={lesson.bunny_video_id} title={lesson.title} status={lesson.video_status} />
                <div className="form-actions" style={{ marginTop: 12 }}>
                  <form action={detachVideo}>
                    <input type="hidden" name="kind" value="lesson" />
                    <input type="hidden" name="id" value={lesson.id} />
                    <ConfirmButton className="btn btn-ghost btn-sm" message="Retirer cette vidéo ? Elle sera supprimée de Bunny.">Retirer la vidéo</ConfirmButton>
                  </form>
                </div>
                <div style={{ marginTop: 12 }}>
                  <VideoUploader target={{ kind: "lesson", id: lesson.id }} defaultTitle={lesson.title} label="Remplacer la vidéo" />
                </div>
              </>
            ) : (
              <VideoUploader target={{ kind: "lesson", id: lesson.id }} defaultTitle={lesson.title} />
            )}
          </div>
        </div>

        <div className="glass card">
          <h2>Contenu sous la vidéo</h2>
          <p className="small muted" style={{ marginBottom: 14 }}>Ateliers, prompts à copier, documents à télécharger, listes déroulantes. L'ordre ci-dessous est l'ordre d'affichage.</p>
          <LessonContentEditor lessonId={lesson.id} initial={lesson.content ?? []} />
        </div>
      </div>
    </>
  );
}
