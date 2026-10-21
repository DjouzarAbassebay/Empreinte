import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Notice } from "@/components/admin/Notice";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { IconDown, IconUp } from "@/components/Icons";
import { createCategory, deleteCategory, deleteResource, moveCategory, moveResource, updateCategory, updateResource } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getResources } from "@/lib/queries";
import type { Resource, ResourceCategory } from "@/lib/types";

const KIND_LABEL: Record<Resource["kind"], string> = { file: "Document", video: "Vidéo", link: "Lien" };

function ResourceRow({ r, categories, index, total }: { r: Resource; categories: ResourceCategory[]; index: number; total: number }) {
  return (
    <details className="toggle">
      <summary>
        <span className="pill pill-accent">{KIND_LABEL[r.kind]}</span>
        <span style={{ flex: 1 }}>{r.title}</span>
        {!r.published && <span className="pill pill-warn">Masquée</span>}
      </summary>
      <div className="toggle-body">
        <div className="row small" style={{ marginBottom: 12 }}>
          <span className="muted">Ordre dans la catégorie :</span>
          <span className="sortable-handle">
            <form action={moveResource}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={index === 0} aria-label="Monter"><IconUp /></button></form>
            <form action={moveResource}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={index === total - 1} aria-label="Descendre"><IconDown /></button></form>
          </span>
        </div>
        <form action={updateResource} className="form">
          <input type="hidden" name="id" value={r.id} />
          <div className="form-row">
            <div className="field"><label htmlFor={`rt-${r.id}`}>Titre</label><input id={`rt-${r.id}`} name="title" className="input" defaultValue={r.title} required /></div>
            <div className="field">
              <label htmlFor={`rc-${r.id}`}>Catégorie</label>
              <select id={`rc-${r.id}`} name="category_id" className="select" defaultValue={r.category_id ?? ""}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="">Sans catégorie</option>
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor={`rd-${r.id}`}>Description</label><input id={`rd-${r.id}`} name="description" className="input" defaultValue={r.description} /></div>
          {r.kind === "link" && <div className="field"><label htmlFor={`ru-${r.id}`}>Adresse</label><input id={`ru-${r.id}`} name="url" type="url" className="input" defaultValue={r.url ?? ""} /></div>}
          {r.kind === "file" && <p className="small muted">Fichier : {r.file_name}</p>}
          <label className="check"><input type="checkbox" name="published" defaultChecked={r.published} /> Visible par les participants</label>
          <div className="form-actions"><button type="submit" className="btn btn-primary btn-sm">Enregistrer</button></div>
        </form>
        <form action={deleteResource} style={{ marginTop: 10 }}>
          <input type="hidden" name="id" value={r.id} />
          <ConfirmButton message={`Supprimer « ${r.title} » ?`}>Supprimer</ConfirmButton>
        </form>
      </div>
    </details>
  );
}

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ message?: string; etat?: string }> }) {
  const { message, etat } = await searchParams;
  const { supabase } = await requireAdmin();
  const { categories, resources } = await getResources(supabase);
  const uncategorized = resources.filter((r) => !r.category_id || !categories.some((c) => c.id === r.category_id));

  return (
    <>
      <Notice message={message} etat={etat} />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="glass card">
            <h2>Ajouter une ressource</h2>
            <div style={{ marginTop: 10 }}><ResourceForm categories={categories} /></div>
          </div>
          <div className="glass card">
            <h2>Catégories</h2>
            <div className="list" style={{ marginTop: 10 }}>
              {categories.map((c, i) => (
                <div key={c.id} className="item" style={{ flexWrap: "wrap" }}>
                  <span className="sortable-handle">
                    <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={i === 0} aria-label="Monter"><IconUp /></button></form>
                    <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={i === categories.length - 1} aria-label="Descendre"><IconDown /></button></form>
                  </span>
                  <form action={updateCategory} className="grow row" style={{ gap: 8 }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input name="name" className="input" defaultValue={c.name} aria-label="Nom" style={{ flex: "1 1 140px" }} required />
                    <input name="description" className="input" defaultValue={c.description} aria-label="Description" placeholder="Description" style={{ flex: "2 1 180px" }} />
                    <button type="submit" className="btn btn-ghost btn-sm">Enregistrer</button>
                  </form>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton message={`Supprimer la catégorie « ${c.name} » ? Ses ressources seront conservées sans catégorie.`}>Supprimer</ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
            <form action={createCategory} className="row" style={{ marginTop: 12 }}>
              <input name="name" className="input" placeholder="Nouvelle catégorie (ex. Skills thématiques)" required style={{ flex: 1 }} />
              <button type="submit" className="btn btn-ghost btn-sm">+ Créer</button>
            </form>
          </div>
        </div>

        <div className="stack">
          {categories.map((c) => {
            const items = resources.filter((r) => r.category_id === c.id);
            return (
              <div key={c.id} className="glass card">
                <h2>{c.name} <span className="muted" style={{ fontWeight: 400, fontSize: ".9rem" }}>({items.length})</span></h2>
                <div className="list" style={{ marginTop: 10 }}>
                  {items.map((r, i) => <ResourceRow key={r.id} r={r} categories={categories} index={i} total={items.length} />)}
                  {items.length === 0 && <p className="muted small">Vide.</p>}
                </div>
              </div>
            );
          })}
          {uncategorized.length > 0 && (
            <div className="glass card">
              <h2>Sans catégorie</h2>
              <div className="list" style={{ marginTop: 10 }}>
                {uncategorized.map((r, i) => <ResourceRow key={r.id} r={r} categories={categories} index={i} total={uncategorized.length} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
