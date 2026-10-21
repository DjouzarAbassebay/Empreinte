"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteVideo, getVideo, normalizeStatus } from "@/lib/bunny";
import { parisToUtc } from "@/lib/dates";
import { removeFile } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentBlock, Lesson, Resource } from "@/lib/types";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "1";

function revalidateAll() {
  for (const p of ["/", "/agenda", "/formation", "/ressources", "/admin", "/admin/agenda", "/admin/formation", "/admin/ressources", "/admin/participants"]) {
    revalidatePath(p);
  }
}

function back(path: string, message: string, ok = true): never {
  redirect(`${path}?message=${encodeURIComponent(message)}&etat=${ok ? "ok" : "erreur"}`);
}

/* =============================== Participants =============================== */

function generatePassword() {
  // 12 caractères lisibles, sans ambiguïté (pas de 0/O, 1/l/I).
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createParticipant(formData: FormData) {
  await requireAdmin();
  const email = str(formData, "email").toLowerCase();
  const fullName = str(formData, "full_name");
  const password = str(formData, "password") || generatePassword();
  if (!email || !fullName) back("/admin/participants", "Nom et e-mail obligatoires.", false);
  if (password.length < 8) back("/admin/participants", "Mot de passe : 8 caractères minimum.", false);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) back("/admin/participants", `Création impossible : ${error?.message ?? "erreur inconnue"}.`, false);
  await admin.from("profiles").upsert({ id: data.user.id, email, full_name: fullName });
  revalidateAll();
  redirect(`/admin/participants?nouveau=${data.user.id}&mdp=${encodeURIComponent(password)}`);
}

export async function resetParticipantPassword(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const password = generatePassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) back("/admin/participants", `Impossible : ${error.message}.`, false);
  redirect(`/admin/participants?nouveau=${id}&mdp=${encodeURIComponent(password)}`);
}

export async function updateParticipant(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const fullName = str(formData, "full_name");
  const admin = createAdminClient();
  await admin.from("profiles").update({ full_name: fullName }).eq("id", id);
  revalidateAll();
  back("/admin/participants", "Participant mis à jour.");
}

export async function deleteParticipant(formData: FormData) {
  const { user } = await requireAdmin();
  const id = str(formData, "id");
  if (id === user.id) back("/admin/participants", "Vous ne pouvez pas supprimer votre propre compte.", false);
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) back("/admin/participants", `Suppression impossible : ${error.message}.`, false);
  revalidateAll();
  back("/admin/participants", "Participant supprimé.");
}

/* =============================== Agenda =============================== */

function parseEventForm(formData: FormData) {
  const date = str(formData, "date");
  const start = str(formData, "start");
  const end = str(formData, "end");
  if (!date || !start || !end) return { error: "Date, heure de début et de fin obligatoires." };
  const starts_at = parisToUtc(date, start);
  const ends_at = parisToUtc(date, end);
  if (ends_at <= starts_at) return { error: "L'heure de fin doit être après le début." };
  const type = str(formData, "type") as "exploration" | "lab" | "autre";
  const capRaw = str(formData, "capacity");
  const capacity = type === "lab" ? (capRaw ? Math.max(1, Number(capRaw)) : 3) : capRaw ? Math.max(1, Number(capRaw)) : null;
  return {
    values: {
      type: ["exploration", "lab", "autre"].includes(type) ? type : "lab",
      title: str(formData, "title") || (type === "lab" ? "Lab" : "Exploration"),
      description: str(formData, "description"),
      starts_at: starts_at.toISOString(),
      ends_at: ends_at.toISOString(),
      zoom_url: str(formData, "zoom_url"),
      capacity,
      published: bool(formData, "published"),
    },
  };
}

export async function createEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseEventForm(formData);
  if ("error" in parsed) back("/admin/agenda", parsed.error!, false);
  const { error } = await supabase.from("events").insert(parsed.values);
  if (error) back("/admin/agenda", `Erreur : ${error.message}`, false);
  revalidateAll();
  back("/admin/agenda", "Créneau ajouté.");
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const parsed = parseEventForm(formData);
  if ("error" in parsed) back(`/admin/agenda/${id}`, parsed.error!, false);
  const { error } = await supabase.from("events").update(parsed.values).eq("id", id);
  if (error) back(`/admin/agenda/${id}`, `Erreur : ${error.message}`, false);
  revalidateAll();
  back(`/admin/agenda/${id}`, "Créneau enregistré.");
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data } = await supabase.from("events").select("replay_video_id").eq("id", id).single();
  await supabase.from("events").delete().eq("id", id);
  if (data?.replay_video_id) await deleteVideo(data.replay_video_id);
  revalidateAll();
  back("/admin/agenda", "Créneau supprimé.");
}

export async function removeRegistration(formData: FormData) {
  const { supabase } = await requireAdmin();
  const eventId = str(formData, "event_id");
  const userId = str(formData, "user_id");
  await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", userId);
  revalidateAll();
  back(`/admin/agenda/${eventId}`, "Inscription retirée.");
}

export async function addRegistration(formData: FormData) {
  await requireAdmin();
  const eventId = str(formData, "event_id");
  const userId = str(formData, "user_id");
  if (!userId) back(`/admin/agenda/${eventId}`, "Choisissez un participant.", false);
  const admin = createAdminClient();
  const { error } = await admin.from("event_registrations").insert({ event_id: eventId, user_id: userId });
  if (error) back(`/admin/agenda/${eventId}`, "Déjà inscrit.", false);
  revalidateAll();
  back(`/admin/agenda/${eventId}`, "Participant inscrit.");
}

/* =============================== Formation : modules =============================== */

export async function createModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = str(formData, "title");
  if (!title) back("/admin/formation", "Titre obligatoire.", false);
  const { data: last } = await supabase.from("modules").select("position").order("position", { ascending: false }).limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;
  await supabase.from("modules").insert({ title, subtitle: str(formData, "subtitle"), description: str(formData, "description"), position });
  revalidateAll();
  back("/admin/formation", "Module créé.");
}

export async function updateModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  await supabase.from("modules").update({
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    description: str(formData, "description"),
  }).eq("id", id);
  revalidateAll();
  back("/admin/formation", "Module enregistré.");
}

export async function toggleModulePublished(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const published = bool(formData, "published");
  await supabase.from("modules").update({ published }).eq("id", id);
  revalidateAll();
  back("/admin/formation", published ? "Module visible par les participants." : "Module masqué.");
}

export async function moveModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const dir = str(formData, "dir") === "up" ? -1 : 1;
  const { data } = await supabase.from("modules").select("id").order("position").order("created_at");
  const ids = (data ?? []).map((m: { id: string }) => m.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/formation");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((mid, pos) => supabase.from("modules").update({ position: pos }).eq("id", mid)));
  revalidateAll();
  redirect("/admin/formation");
}

export async function deleteModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data: lessons } = await supabase.from("lessons").select("bunny_video_id,content").eq("module_id", id);
  await supabase.from("modules").delete().eq("id", id);
  for (const l of (lessons ?? []) as Pick<Lesson, "bunny_video_id" | "content">[]) {
    if (l.bunny_video_id) await deleteVideo(l.bunny_video_id);
    for (const b of l.content ?? []) await removeFile(b.file_path);
  }
  revalidateAll();
  back("/admin/formation", "Module supprimé.");
}

/* =============================== Formation : leçons =============================== */

export async function createLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const moduleId = str(formData, "module_id");
  const title = str(formData, "title");
  if (!title) back("/admin/formation", "Titre de la leçon obligatoire.", false);
  const { data: last } = await supabase.from("lessons").select("position").eq("module_id", moduleId).order("position", { ascending: false }).limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase.from("lessons").insert({ module_id: moduleId, title, position }).select("id").single();
  if (error || !data) back("/admin/formation", "Création impossible.", false);
  revalidateAll();
  redirect(`/admin/formation/lecon/${data.id}`);
}

export async function updateLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  await supabase.from("lessons").update({
    title: str(formData, "title"),
    summary: str(formData, "summary"),
    published: bool(formData, "published"),
  }).eq("id", id);
  revalidateAll();
  back(`/admin/formation/lecon/${id}`, "Leçon enregistrée.");
}

export async function moveLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const moduleId = str(formData, "module_id");
  const dir = str(formData, "dir") === "up" ? -1 : 1;
  const { data } = await supabase.from("lessons").select("id").eq("module_id", moduleId).order("position").order("created_at");
  const ids = (data ?? []).map((l: { id: string }) => l.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/formation");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((lid, pos) => supabase.from("lessons").update({ position: pos }).eq("id", lid)));
  revalidateAll();
  redirect("/admin/formation");
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data } = await supabase.from("lessons").select("bunny_video_id,content").eq("id", id).single();
  await supabase.from("lessons").delete().eq("id", id);
  if (data?.bunny_video_id) await deleteVideo(data.bunny_video_id);
  for (const b of ((data?.content ?? []) as ContentBlock[])) await removeFile(b.file_path);
  revalidateAll();
  back("/admin/formation", "Leçon supprimée.");
}

/** Enregistre le contenu (blocs) d'une leçon, envoyé en JSON par l'éditeur. */
export async function saveLessonContent(lessonId: string, blocks: ContentBlock[]) {
  const { supabase } = await requireAdmin();
  const clean: ContentBlock[] = blocks
    .filter((b) => b && typeof b.id === "string" && ["text", "prompt", "toggle", "file", "link"].includes(b.type))
    .map((b) => ({
      id: b.id,
      type: b.type,
      title: String(b.title ?? "").slice(0, 300),
      body: String(b.body ?? "").slice(0, 50_000),
      file_path: b.file_path || undefined,
      file_name: b.file_name || undefined,
      file_size: typeof b.file_size === "number" ? b.file_size : undefined,
      url: b.url ? String(b.url).slice(0, 2000) : undefined,
    }));
  // Supprime du stockage les fichiers qui ne sont plus référencés.
  const { data: before } = await supabase.from("lessons").select("content").eq("id", lessonId).single();
  const kept = new Set(clean.map((b) => b.file_path).filter(Boolean));
  for (const b of ((before?.content ?? []) as ContentBlock[])) {
    if (b.file_path && !kept.has(b.file_path)) await removeFile(b.file_path);
  }
  const { error } = await supabase.from("lessons").update({ content: clean }).eq("id", lessonId);
  revalidateAll();
  return error ? { ok: false, message: error.message } : { ok: true };
}

/* =============================== Vidéos (Bunny) =============================== */

type VideoTarget = { kind: "lesson" | "resource" | "event"; id: string };

/** Après un envoi réussi : rattache la vidéo à la leçon, ressource ou replay. */
export async function attachVideo(target: VideoTarget, videoId: string) {
  const { supabase } = await requireAdmin();
  const table = target.kind === "lesson" ? "lessons" : target.kind === "resource" ? "resources" : "events";
  const column = target.kind === "event" ? "replay_video_id" : "bunny_video_id";
  const { data: current } = await supabase.from(table).select(column).eq("id", target.id).single();
  const previous = current ? (current as Record<string, string | null>)[column] : null;
  const patch: Record<string, unknown> = { [column]: videoId };
  if (target.kind === "lesson") {
    patch.video_status = "encoding";
    patch.video_duration = 0;
  }
  const { error } = await supabase.from(table).update(patch).eq("id", target.id);
  if (previous && previous !== videoId) await deleteVideo(previous);
  revalidateAll();
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function detachVideo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const kind = str(formData, "kind") as VideoTarget["kind"];
  const id = str(formData, "id");
  const table = kind === "lesson" ? "lessons" : kind === "resource" ? "resources" : "events";
  const column = kind === "event" ? "replay_video_id" : "bunny_video_id";
  const { data: current } = await supabase.from(table).select(column).eq("id", id).single();
  const previous = current ? (current as Record<string, string | null>)[column] : null;
  const patch: Record<string, unknown> = { [column]: null };
  if (kind === "lesson") patch.video_status = "none";
  await supabase.from(table).update(patch).eq("id", id);
  if (previous) await deleteVideo(previous);
  revalidateAll();
  const dest = kind === "lesson" ? `/admin/formation/lecon/${id}` : kind === "event" ? `/admin/agenda/${id}` : "/admin/ressources";
  back(dest, "Vidéo retirée.");
}

/** Interroge Bunny et met à jour l'état d'encodage d'une leçon. */
export async function syncLessonVideo(lessonId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("lessons").select("bunny_video_id,video_status").eq("id", lessonId).single();
  if (!data?.bunny_video_id) return null;
  const info = await getVideo(data.bunny_video_id);
  if (!info) return data.video_status as string;
  const status = normalizeStatus(info.status);
  if (status !== data.video_status || info.length) {
    await admin.from("lessons").update({ video_status: status, video_duration: info.length ?? 0 }).eq("id", lessonId);
  }
  return status;
}

export async function refreshLessonVideo(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const status = await syncLessonVideo(id);
  revalidateAll();
  back(`/admin/formation/lecon/${id}`, status === "ready" ? "Vidéo prête." : "Encodage toujours en cours.");
}

/* =============================== Ressources =============================== */

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = str(formData, "name");
  if (!name) back("/admin/ressources", "Nom de catégorie obligatoire.", false);
  const { data: last } = await supabase.from("resource_categories").select("position").order("position", { ascending: false }).limit(1);
  await supabase.from("resource_categories").insert({ name, description: str(formData, "description"), position: (last?.[0]?.position ?? -1) + 1 });
  revalidateAll();
  back("/admin/ressources", "Catégorie créée.");
}

export async function updateCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("resource_categories").update({ name: str(formData, "name"), description: str(formData, "description") }).eq("id", str(formData, "id"));
  revalidateAll();
  back("/admin/ressources", "Catégorie enregistrée.");
}

export async function moveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const dir = str(formData, "dir") === "up" ? -1 : 1;
  const { data } = await supabase.from("resource_categories").select("id").order("position").order("created_at");
  const ids = (data ?? []).map((c: { id: string }) => c.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/ressources");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((cid, pos) => supabase.from("resource_categories").update({ position: pos }).eq("id", cid)));
  revalidateAll();
  redirect("/admin/ressources");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("resource_categories").delete().eq("id", str(formData, "id"));
  revalidateAll();
  back("/admin/ressources", "Catégorie supprimée. Ses ressources sont passées dans « Autres ».");
}

/** Crée une ressource. Pour un fichier, l'envoi a déjà été fait depuis le navigateur. */
export async function createResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const kind = str(formData, "kind") as Resource["kind"];
  const title = str(formData, "title");
  if (!title) back("/admin/ressources", "Titre obligatoire.", false);
  const categoryId = str(formData, "category_id") || null;
  const { data: last } = await supabase.from("resources").select("position").order("position", { ascending: false }).limit(1);
  const row: Partial<Resource> = {
    title,
    description: str(formData, "description"),
    kind: ["file", "video", "link"].includes(kind) ? kind : "link",
    category_id: categoryId,
    position: (last?.[0]?.position ?? -1) + 1,
    published: bool(formData, "published"),
  };
  if (kind === "link") {
    row.url = str(formData, "url");
    if (!row.url) back("/admin/ressources", "Adresse du lien obligatoire.", false);
  }
  if (kind === "file") {
    row.file_path = str(formData, "file_path") || null;
    row.file_name = str(formData, "file_name") || null;
    row.file_size = Number(str(formData, "file_size")) || null;
    if (!row.file_path) back("/admin/ressources", "Envoyez d'abord le fichier.", false);
  }
  if (kind === "video") {
    row.bunny_video_id = str(formData, "bunny_video_id") || null;
    if (!row.bunny_video_id) back("/admin/ressources", "Envoyez d'abord la vidéo.", false);
  }
  const { error } = await supabase.from("resources").insert(row);
  if (error) back("/admin/ressources", `Erreur : ${error.message}`, false);
  revalidateAll();
  back("/admin/ressources", "Ressource ajoutée.");
}

export async function updateResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const patch: Partial<Resource> = {
    title: str(formData, "title"),
    description: str(formData, "description"),
    category_id: str(formData, "category_id") || null,
    published: bool(formData, "published"),
  };
  if (formData.has("url")) patch.url = str(formData, "url");
  await supabase.from("resources").update(patch).eq("id", id);
  revalidateAll();
  back("/admin/ressources", "Ressource enregistrée.");
}

export async function moveResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const dir = str(formData, "dir") === "up" ? -1 : 1;
  const { data: me } = await supabase.from("resources").select("category_id").eq("id", id).single();
  let q = supabase.from("resources").select("id").order("position").order("created_at");
  q = me?.category_id ? q.eq("category_id", me.category_id) : q.is("category_id", null);
  const { data } = await q;
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/ressources");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((rid, pos) => supabase.from("resources").update({ position: pos }).eq("id", rid)));
  revalidateAll();
  redirect("/admin/ressources");
}

export async function deleteResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data } = await supabase.from("resources").select("file_path,bunny_video_id").eq("id", id).single();
  await supabase.from("resources").delete().eq("id", id);
  await removeFile(data?.file_path);
  if (data?.bunny_video_id) await deleteVideo(data.bunny_video_id);
  revalidateAll();
  back("/admin/ressources", "Ressource supprimée.");
}
