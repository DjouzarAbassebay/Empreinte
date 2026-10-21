"use client";

import { useState } from "react";
import { createResource } from "@/lib/actions/admin";
import type { ResourceCategory, ResourceKind } from "@/lib/types";
import { FileUploader, type UploadedFile } from "./FileUploader";
import { VideoUploader } from "./VideoUploader";

export function ResourceForm({ categories }: { categories: ResourceCategory[] }) {
  const [kind, setKind] = useState<ResourceKind>("file");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const ready = kind === "link" || (kind === "file" && file) || (kind === "video" && videoId);

  return (
    <form action={createResource} className="form">
      <div className="form-row">
        <div className="field">
          <label htmlFor="r-kind">Type</label>
          <select id="r-kind" name="kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as ResourceKind)}>
            <option value="file">Document à télécharger</option>
            <option value="video">Vidéo</option>
            <option value="link">Lien</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="r-cat">Catégorie</label>
          <select id="r-cat" name="category_id" className="select" defaultValue={categories[0]?.id ?? ""}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="">Sans catégorie</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-title">Titre</label>
        <input id="r-title" name="title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="r-desc">Description courte (facultatif)</label>
        <input id="r-desc" name="description" className="input" />
      </div>

      {kind === "link" && (
        <div className="field">
          <label htmlFor="r-url">Adresse</label>
          <input id="r-url" name="url" className="input" type="url" placeholder="https://" required />
        </div>
      )}

      {kind === "file" && (
        file ? (
          <div className="row small">
            <span className="pill pill-ok">Fichier prêt</span>
            <span>{file.name}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>Remplacer</button>
            <input type="hidden" name="file_path" value={file.path} />
            <input type="hidden" name="file_name" value={file.name} />
            <input type="hidden" name="file_size" value={file.size} />
          </div>
        ) : (
          <FileUploader folder="ressources" onUploaded={(f) => { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }} />
        )
      )}

      {kind === "video" && (
        videoId ? (
          <div className="row small">
            <span className="pill pill-ok">Vidéo envoyée</span>
            <input type="hidden" name="bunny_video_id" value={videoId} />
          </div>
        ) : (
          <VideoUploader defaultTitle={title || "Ressource"} onUploaded={setVideoId} />
        )
      )}

      <label className="check"><input type="checkbox" name="published" defaultChecked /> Visible par les participants</label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!ready}>Ajouter la ressource</button>
        {!ready && <span className="small muted">Envoyez d'abord le {kind === "file" ? "fichier" : "la vidéo"}.</span>}
      </div>
    </form>
  );
}
