"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { attachVideo } from "@/lib/actions/admin";

type Target = { kind: "lesson" | "resource" | "event"; id: string };

/**
 * Envoi direct navigateur → Bunny Stream (protocole TUS, reprise possible).
 * Soit la vidéo est rattachée immédiatement à une cible (leçon, replay),
 * soit l'identifiant est transmis via onUploaded (création d'une ressource).
 */
export function VideoUploader({
  target,
  defaultTitle,
  onUploaded,
  label = "Envoyer une vidéo",
}: {
  target?: Target;
  defaultTitle: string;
  onUploaded?: (videoId: string) => void;
  label?: string;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  const start = async (file: File) => {
    setError(null);
    setMessage(null);
    setProgress(0);
    try {
      const res = await fetch("/api/bunny/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: defaultTitle || file.name }),
      });
      const ticket = (await res.json()) as { error?: string; videoId: string; libraryId: string; expires: number; signature: string; endpoint: string };
      if (!res.ok || ticket.error) throw new Error(ticket.error ?? "Préparation impossible.");

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: ticket.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 50 * 1024 * 1024,
          headers: {
            AuthorizationSignature: ticket.signature,
            AuthorizationExpire: String(ticket.expires),
            VideoId: ticket.videoId,
            LibraryId: ticket.libraryId,
          },
          metadata: { filetype: file.type, title: defaultTitle || file.name },
          onError: (err) => reject(err),
          onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
          onSuccess: () => resolve(),
        });
        uploadRef.current = upload;
        upload.start();
      });

      if (target) {
        const r = await attachVideo(target, ticket.videoId);
        if (!r.ok) throw new Error(r.message ?? "Rattachement impossible.");
        setMessage("Vidéo envoyée. L'encodage prend quelques minutes.");
        router.refresh();
      } else {
        onUploaded?.(ticket.videoId);
        setMessage("Vidéo envoyée.");
      }
    } catch (e) {
      setError((e as Error).message || "L'envoi a échoué.");
    } finally {
      setProgress(null);
      uploadRef.current = null;
    }
  };

  return (
    <div className="upload-zone">
      <span className="lbl" style={{ fontWeight: 600 }}>{label}</span>
      <input
        type="file"
        accept="video/*"
        disabled={progress !== null}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f);
          e.target.value = "";
        }}
      />
      {progress !== null && (
        <div className="row" style={{ gap: 12 }}>
          <div className="progress" style={{ flex: 1 }}><span style={{ width: `${progress}%` }} /></div>
          <span className="small muted">{progress}%</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { uploadRef.current?.abort(); setProgress(null); setError("Envoi annulé."); }}>Annuler</button>
        </div>
      )}
      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <span className="hint">Formats habituels (mp4, mov). L'envoi se fait directement vers Bunny Stream, sans limite de taille côté site.</span>
    </div>
  );
}
