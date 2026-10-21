import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET = "fichiers";

/** URL signée (1 h) pour télécharger un fichier privé, avec le nom d'origine. */
export async function signedDownloadUrl(path: string, fileName?: string | null) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600, fileName ? { download: fileName } : { download: true });
  if (error || !data) return null;
  return data.signedUrl;
}

export async function removeFile(path: string | null | undefined) {
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([path]);
}
