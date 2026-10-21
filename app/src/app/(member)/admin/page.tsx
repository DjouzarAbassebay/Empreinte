import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDayShort, formatTime } from "@/lib/dates";
import { getEvents, getModulesWithLessons } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonProgress, Profile } from "@/lib/types";
import { EVENT_TYPE_LABEL } from "@/lib/types";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();
  const [{ data: profiles }, { data: progress }, modules, events] = await Promise.all([
    admin.from("profiles").select("*").order("full_name"),
    admin.from("lesson_progress").select("*"),
    getModulesWithLessons(supabase),
    getEvents(supabase),
  ]);
  const participants = ((profiles ?? []) as Profile[]).filter((p) => p.role !== "admin");
  const lessons = modules.filter((m) => m.published).flatMap((m) => m.lessons.filter((l) => l.published));
  const lessonIds = new Set(lessons.map((l) => l.id));
  const doneBy = new Map<string, number>();
  for (const p of (progress ?? []) as LessonProgress[]) {
    if (lessonIds.has(p.lesson_id)) doneBy.set(p.user_id, (doneBy.get(p.user_id) ?? 0) + 1);
  }
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at).getTime() >= now).slice(0, 6);
  const nameOf = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p.full_name || p.email]));

  return (
    <>
      <div className="grid-3">
        <div className="glass card stat"><span className="label">Participants</span><span className="big">{participants.length}</span><Link href="/admin/participants" className="small">Gérer</Link></div>
        <div className="glass card stat"><span className="label">Leçons publiées</span><span className="big">{lessons.length}</span><Link href="/admin/formation" className="small">Gérer</Link></div>
        <div className="glass card stat"><span className="label">Lives à venir</span><span className="big">{events.filter((e) => new Date(e.ends_at).getTime() >= now).length}</span><Link href="/admin/agenda" className="small">Gérer</Link></div>
      </div>

      <section className="block">
        <h2>Progression des participants</h2>
        <div className="glass card table-wrap">
          <table className="table">
            <thead><tr><th>Participant</th><th>Leçons terminées</th><th style={{ width: "40%" }}>Avancement</th></tr></thead>
            <tbody>
              {participants.map((p) => {
                const done = doneBy.get(p.id) ?? 0;
                const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.full_name || "(sans nom)"}</strong><br /><span className="small muted">{p.email}</span></td>
                    <td>{done} / {lessons.length}</td>
                    <td><div className="progress"><span style={{ width: `${pct}%` }} /></div></td>
                  </tr>
                );
              })}
              {participants.length === 0 && <tr><td colSpan={3} className="muted">Aucun participant pour l'instant.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="block">
        <h2>Prochains lives et inscrits</h2>
        <div className="stack">
          {upcoming.map((e) => (
            <Link key={e.id} href={`/admin/agenda/${e.id}`} className="glass card-sm item">
              <span className="grow">
                <span className="title">{EVENT_TYPE_LABEL[e.type]} · {e.title}</span>
                <span className="sub">{formatDayShort(e.starts_at)} à {formatTime(e.starts_at)}{e.type === "lab" ? ` · ${e.registrations.length}/${e.capacity ?? "∞"} inscrits` : ""}{!e.published ? " · masqué" : ""}</span>
                {e.type === "lab" && e.registrations.length > 0 && (
                  <span className="sub">{e.registrations.map((r) => nameOf.get(r.user_id) ?? "?").join(", ")}</span>
                )}
              </span>
            </Link>
          ))}
          {upcoming.length === 0 && <div className="glass card"><p className="muted">Aucun live programmé.</p></div>}
        </div>
      </section>
    </>
  );
}
