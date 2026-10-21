"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveLessonContent } from "@/lib/actions/admin";
import type { BlockType, ContentBlock } from "@/lib/types";
import { IconDown, IconUp } from "../Icons";
import { FileUploader } from "./FileUploader";

const TYPE_LABEL: Record<BlockType, string> = {
  text: "Texte",
  toggle: "Liste déroulante",
  prompt: "Prompt à copier",
  file: "Document à télécharger",
  link: "Lien",
};

function newBlock(type: BlockType): ContentBlock {
  return { id: crypto.randomUUID(), type, title: "", body: "" };
}

export function LessonContentEditor({ lessonId, initial }: { lessonId: string; initial: ContentBlock[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (id: string, patch: Partial<ContentBlock>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirty(true);
  };
  const move = (i: number, dir: -1 | 1) => {
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setDirty(true);
  };
  const remove = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setDirty(true);
  };
  const add = (type: BlockType) => {
    setBlocks((bs) => [...bs, newBlock(type)]);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const r = await saveLessonContent(lessonId, blocks);
    setSaving(false);
    setNotice(r.ok ? { ok: true, text: "Contenu enregistré." } : { ok: false, text: r.message ?? "Erreur." });
    if (r.ok) {
      setDirty(false);
      router.refresh();
    }
  };

  return (
    <div className="block-editor">
      {blocks.length === 0 && <p className="muted small">Aucun contenu sous la vidéo pour l'instant. Ajoutez un bloc ci-dessous.</p>}

      {blocks.map((b, i) => (
        <div key={b.id} className="block-card">
          <div className="block-head">
            <span className="pill pill-accent">{TYPE_LABEL[b.type]}</span>
            <span className="sortable-handle">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter"><IconUp /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Descendre"><IconDown /></button>
            </span>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(b.id)}>Retirer</button>
          </div>

          <div className="field">
            <label htmlFor={`t-${b.id}`}>{b.type === "file" ? "Intitulé affiché" : b.type === "prompt" ? "Nom du prompt" : "Titre"}{b.type === "text" ? " (facultatif)" : ""}</label>
            <input id={`t-${b.id}`} className="input" value={b.title} onChange={(e) => update(b.id, { title: e.target.value })} />
          </div>

          {(b.type === "text" || b.type === "toggle") && (
            <div className="field">
              <label htmlFor={`b-${b.id}`}>Contenu</label>
              <textarea id={`b-${b.id}`} className="textarea" rows={6} value={b.body} onChange={(e) => update(b.id, { body: e.target.value })} />
              <span className="hint">Mise en forme : ## titre, - liste, 1. liste numérotée, **gras**, *italique*, `code`, [lien](https://…).</span>
            </div>
          )}

          {b.type === "prompt" && (
            <div className="field">
              <label htmlFor={`b-${b.id}`}>Texte du prompt</label>
              <textarea id={`b-${b.id}`} className="textarea mono" rows={8} value={b.body} onChange={(e) => update(b.id, { body: e.target.value })} />
              <span className="hint">Affiché tel quel, avec un bouton « Copier le prompt ».</span>
            </div>
          )}

          {b.type === "link" && (
            <>
              <div className="field">
                <label htmlFor={`u-${b.id}`}>Adresse</label>
                <input id={`u-${b.id}`} className="input" type="url" placeholder="https://" value={b.url ?? ""} onChange={(e) => update(b.id, { url: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor={`b-${b.id}`}>Description (facultatif)</label>
                <input id={`b-${b.id}`} className="input" value={b.body} onChange={(e) => update(b.id, { body: e.target.value })} />
              </div>
            </>
          )}

          {b.type === "file" && (
            <>
              {b.file_path ? (
                <div className="row small">
                  <span className="pill pill-ok">Fichier prêt</span>
                  <span>{b.file_name}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(b.id, { file_path: undefined, file_name: undefined, file_size: undefined })}>Remplacer</button>
                </div>
              ) : (
                <FileUploader
                  folder={`lecons/${lessonId}`}
                  onUploaded={(f) => update(b.id, { file_path: f.path, file_name: f.name, file_size: f.size, title: b.title || f.name })}
                />
              )}
              <div className="field">
                <label htmlFor={`b-${b.id}`}>Description (facultatif)</label>
                <input id={`b-${b.id}`} className="input" value={b.body} onChange={(e) => update(b.id, { body: e.target.value })} />
              </div>
            </>
          )}
        </div>
      ))}

      <div className="row" style={{ gap: 8 }}>
        <span className="small muted">Ajouter :</span>
        {(Object.keys(TYPE_LABEL) as BlockType[]).map((t) => (
          <button key={t} type="button" className="btn btn-ghost btn-sm" onClick={() => add(t)}>+ {TYPE_LABEL[t]}</button>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? "Enregistrement…" : "Enregistrer le contenu"}
        </button>
        {dirty && !saving && <span className="small muted">Modifications non enregistrées.</span>}
        {notice && <span className={`small ${notice.ok ? "" : "muted"}`} style={{ color: notice.ok ? "var(--ok)" : "var(--warn)" }}>{notice.text}</span>}
      </div>
    </div>
  );
}
