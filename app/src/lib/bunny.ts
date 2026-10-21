import { createHash } from "node:crypto";

const API = "https://video.bunnycdn.com";

function env() {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  if (!libraryId || !apiKey) throw new Error("BUNNY_LIBRARY_ID ou BUNNY_API_KEY manquante.");
  return { libraryId, apiKey };
}

export function bunnyConfigured() {
  return Boolean(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_API_KEY);
}

/** Crée l'objet vidéo et renvoie ce qu'il faut au navigateur pour l'envoi TUS. */
export async function createUploadTicket(title: string) {
  const { libraryId, apiKey } = env();
  const res = await fetch(`${API}/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Bunny : création impossible (${res.status}).`);
  const video = (await res.json()) as { guid: string };
  const expires = Math.floor(Date.now() / 1000) + 6 * 3600;
  const signature = createHash("sha256")
    .update(libraryId + apiKey + expires + video.guid)
    .digest("hex");
  return { videoId: video.guid, libraryId, expires, signature, endpoint: `${API}/tusupload` };
}

export interface BunnyVideoInfo {
  guid: string;
  title: string;
  status: number;
  encodeProgress: number;
  length: number;
}

export async function getVideo(videoId: string): Promise<BunnyVideoInfo | null> {
  const { libraryId, apiKey } = env();
  try {
    const res = await fetch(`${API}/library/${libraryId}/videos/${videoId}`, {
      headers: { AccessKey: apiKey, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as BunnyVideoInfo;
  } catch {
    return null;
  }
}

export async function deleteVideo(videoId: string) {
  const { libraryId, apiKey } = env();
  await fetch(`${API}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey },
  }).catch(() => undefined);
}

/** Libellé lisible de l'état d'encodage Bunny. */
export function statusLabel(status: number | string) {
  const s = typeof status === "string" ? status : String(status);
  switch (s) {
    case "0":
    case "queued":
      return "En file d'attente";
    case "1":
    case "processing":
      return "Traitement";
    case "2":
    case "encoding":
      return "Encodage";
    case "3":
    case "4":
    case "ready":
      return "Prête";
    case "5":
    case "failed":
      return "Échec";
    case "6":
    case "uploading":
      return "Envoi en cours";
    default:
      return "Aucune vidéo";
  }
}

export function normalizeStatus(status: number): string {
  if (status === 3 || status === 4) return "ready";
  if (status === 5 || status === 6) return "failed";
  if (status === 0) return "queued";
  return "encoding";
}

/** URL d'intégration du lecteur, signée si la protection par jeton est activée. */
export function embedUrl(videoId: string) {
  const libraryId = process.env.BUNNY_LIBRARY_ID ?? "";
  const url = new URL(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`);
  url.searchParams.set("autoplay", "false");
  url.searchParams.set("preload", "true");
  url.searchParams.set("responsive", "true");
  const tokenKey = process.env.BUNNY_TOKEN_KEY;
  if (tokenKey) {
    const expires = Math.floor(Date.now() / 1000) + 12 * 3600;
    const token = createHash("sha256").update(tokenKey + videoId + expires).digest("hex");
    url.searchParams.set("token", token);
    url.searchParams.set("expires", String(expires));
  }
  return url.toString();
}
