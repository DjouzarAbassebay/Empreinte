import type { Metadata } from "next";
import { IconDownload, IconLink, IconPlay } from "@/components/Icons";
import { VideoPlayer } from "@/components/VideoPlayer";
import { requireUser } from "@/lib/auth";
import { getResources } from "@/lib/queries";
import type { Resource } from "@/lib/types";

export const metadata: Metadata = { title: "Ressources" };

function size(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function ResourceItem({ r }: { r: Resource }) {
  if (r.kind === "video") {
    return (
      <details id={`r-${r.id}`} className="toggle">
        <summary><IconPlay className="" /> {r.title}{r.description ? <span className="muted small" style={{ fontWeight: 400 }}> · {r.description}</span> : null}</summary>
        <div className="toggle-body"><VideoPlayer videoId={r.bunny_video_id} title={r.title} /></div>
      </details>
    );
  }
  const href = r.kind === "link" ? (r.url ?? "#") : `/api/fichiers/ressource/${r.id}`;
  return (
    <a id={`r-${r.id}`} className="item file-item" href={href} target={r.kind === "link" ? "_blank" : undefined} rel={r.kind === "link" ? "noopener" : undefined}>
      <span className="ico">{r.kind === "link" ? <IconLink /> : <IconDownload />}</span>
      <span className="grow">
        <span className="title">{r.title}</span>
        <span className="sub">{[r.description, r.kind === "file" ? [r.file_name, size(r.file_size)].filter(Boolean).join(" · ") : null].filter(Boolean).join(" · ")}</span>
      </span>
    </a>
  );
}

export default async function ResourcesPage() {
  const { supabase } = await requireUser();
  const { categories, resources } = await getResources(supabase);
  const visible = resources.filter((r) => r.published);
  const uncategorized = visible.filter((r) => !r.category_id || !categories.some((c) => c.id === r.category_id));

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Ressources</span>
          <h1 style={{ marginTop: 8 }}>Votre boîte à outils.</h1>
          <p className="intro">Skills thématiques, vidéos supplémentaires, gabarits et documents. Tout ce qui complète le parcours, au même endroit.</p>
        </div>
      </div>

      {visible.length === 0 && <div className="glass card"><p className="muted">Les ressources arrivent au fil du bootcamp.</p></div>}

      <div className="stack">
        {categories.map((c) => {
          const items = visible.filter((r) => r.category_id === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="glass card">
              <h2>{c.name}</h2>
              {c.description && <p className="muted" style={{ marginBottom: 6 }}>{c.description}</p>}
              <div className="list" style={{ marginTop: 14 }}>
                {items.map((r) => <ResourceItem key={r.id} r={r} />)}
              </div>
            </section>
          );
        })}
        {uncategorized.length > 0 && (
          <section className="glass card">
            <h2>Autres ressources</h2>
            <div className="list" style={{ marginTop: 14 }}>
              {uncategorized.map((r) => <ResourceItem key={r.id} r={r} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
