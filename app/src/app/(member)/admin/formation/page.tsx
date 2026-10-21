import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Notice } from "@/components/admin/Notice";
import { IconDown, IconUp } from "@/components/Icons";
import { createLesson, createModule, deleteModule, moveLesson, moveModule, toggleModulePublished, updateModule } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { statusLabel } from "@/lib/bunny";
import { getModulesWithLessons } from "@/lib/queries";

export default async function AdminFormationPage({ searchParams }: { searchParams: Promise<{ message?: string; etat?: string }> }) {
  const { message, etat } = await searchParams;
  const { supabase } = await requireAdmin();
  const modules = await getModulesWithLessons(supabase);

  return (
    <>
      <Notice message={message} etat={etat} />
      <div className="stack">
        {modules.map((m, i) => (
          <section key={m.id} className="glass card">
            <div className="row-between">
              <div className="row" style={{ gap: 8 }}>
                <span className="sortable-handle">
                  <form action={moveModule}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={i === 0} aria-label="Monter"><IconUp /></button></form>
                  <form action={moveModule}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={i === modules.length - 1} aria-label="Descendre"><IconDown /></button></form>
                </span>
                <h2>{m.title}</h2>
                <span className={`pill ${m.published ? "pill-ok" : "pill-warn"}`}>{m.published ? "Visible" : "Masqué"}</span>
              </div>
              <form action={toggleModulePublished}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="published" value={m.published ? "0" : "1"} />
                <button type="submit" className={`btn btn-sm ${m.published ? "btn-ghost" : "btn-primary"}`}>{m.published ? "Masquer aux participants" : "Débloquer pour les participants"}</button>
              </form>
            </div>

            <details className="toggle" style={{ marginTop: 14 }}>
              <summary>Modifier le module</summary>
              <div className="toggle-body">
                <form action={updateModule} className="form">
                  <input type="hidden" name="id" value={m.id} />
                  <div className="form-row">
                    <div className="field"><label htmlFor={`mt-${m.id}`}>Titre</label><input id={`mt-${m.id}`} name="title" className="input" defaultValue={m.title} required /></div>
                    <div className="field"><label htmlFor={`ms-${m.id}`}>Sur-titre (ex. Semaine 1)</label><input id={`ms-${m.id}`} name="subtitle" className="input" defaultValue={m.subtitle} /></div>
                  </div>
                  <div className="field"><label htmlFor={`md-${m.id}`}>Description</label><textarea id={`md-${m.id}`} name="description" className="textarea" rows={2} defaultValue={m.description} /></div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
                  </div>
                </form>
                <form action={deleteModule} style={{ marginTop: 10 }}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message={`Supprimer le module « ${m.title} » et toutes ses leçons (vidéos comprises) ?`}>Supprimer le module</ConfirmButton>
                </form>
              </div>
            </details>

            <div className="list" style={{ marginTop: 14 }}>
              {m.lessons.map((l, j) => (
                <div key={l.id} className="item">
                  <span className="sortable-handle">
                    <form action={moveLesson}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="module_id" value={m.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={j === 0} aria-label="Monter"><IconUp /></button></form>
                    <form action={moveLesson}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="module_id" value={m.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={j === m.lessons.length - 1} aria-label="Descendre"><IconDown /></button></form>
                  </span>
                  <span className="num">{j + 1}</span>
                  <span className="grow">
                    <span className="title">{l.title}</span>
                    <span className="sub">{l.bunny_video_id ? statusLabel(l.video_status) : "Sans vidéo"} · {(l.content ?? []).length} bloc{(l.content ?? []).length > 1 ? "s" : ""} · {l.published ? "publiée" : "brouillon"}</span>
                  </span>
                  <Link href={`/admin/formation/lecon/${l.id}`} className="btn btn-ghost btn-sm">Ouvrir</Link>
                </div>
              ))}
            </div>
            <form action={createLesson} className="row" style={{ marginTop: 12 }}>
              <input type="hidden" name="module_id" value={m.id} />
              <input name="title" className="input" placeholder="Titre de la nouvelle leçon" required style={{ flex: 1 }} />
              <button type="submit" className="btn btn-ghost btn-sm">+ Ajouter une leçon</button>
            </form>
          </section>
        ))}

        <section className="glass card">
          <h2>Nouveau module</h2>
          <p className="small muted">Par exemple : Préambule, Semaine 1 · Le contexte, Semaine 2 · Les skills…</p>
          <form action={createModule} className="form" style={{ marginTop: 10 }}>
            <div className="form-row">
              <div className="field"><label htmlFor="nm-title">Titre</label><input id="nm-title" name="title" className="input" required /></div>
              <div className="field"><label htmlFor="nm-sub">Sur-titre</label><input id="nm-sub" name="subtitle" className="input" placeholder="Semaine 1" /></div>
            </div>
            <div className="field"><label htmlFor="nm-desc">Description</label><textarea id="nm-desc" name="description" className="textarea" rows={2} /></div>
            <div className="form-actions"><button type="submit" className="btn btn-primary">Créer le module (masqué par défaut)</button></div>
          </form>
        </section>
      </div>
    </>
  );
}
