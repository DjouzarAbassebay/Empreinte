import { bunnyConfigured, embedUrl } from "@/lib/bunny";

export function VideoPlayer({ videoId, title, status }: { videoId: string | null; title: string; status?: string }) {
  if (!videoId || !bunnyConfigured()) {
    return (
      <div className="player">
        <div className="player-empty">La vidéo n'est pas encore disponible.</div>
      </div>
    );
  }
  if (status && status !== "ready") {
    return (
      <div className="player">
        <div className="player-empty">
          {status === "failed" ? "L'encodage de la vidéo a échoué." : "La vidéo est en cours d'encodage. Elle apparaîtra ici dans quelques minutes."}
        </div>
      </div>
    );
  }
  return (
    <div className="player">
      <iframe
        src={embedUrl(videoId)}
        title={title}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
