"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
}

function safeName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

/** Envoi direct navigateur → bucket privé "fichiers" (50 Mo maximum). */
export function FileUploader({
  folder,
  onUploaded,
  label = "Envoyer un fichier",
}: {
  folder: string;
  onUploaded: (file: UploadedFile) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (file: File) => {
    setError(null);
    if (file.size > 50 * 1024 * 1024) {
      setError("Fichier trop lourd : 50 Mo maximum.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: err } = await supabase.storage.from("fichiers").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (err) throw err;
      onUploaded({ path, name: file.name, size: file.size });
    } catch (e) {
      setError((e as Error).message || "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="upload-zone">
      <span className="lbl" style={{ fontWeight: 600 }}>{label}</span>
      <input
        type="file"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f);
          e.target.value = "";
        }}
      />
      {busy && <span className="small muted">Envoi en cours…</span>}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
