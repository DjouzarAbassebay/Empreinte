"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const MESSAGES: Record<string, string> = {
  ok: "Vous êtes inscrit.",
  complet: "Ce Lab est complet.",
  deja_inscrit: "Vous êtes déjà inscrit à ce créneau.",
  passe: "Ce créneau est passé.",
  introuvable: "Créneau introuvable.",
  non_connecte: "Reconnectez-vous.",
};

export async function registerForEvent(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("register_for_event", { p_event_id: eventId });
  const code = error ? "introuvable" : String(data);
  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda?message=${encodeURIComponent(MESSAGES[code] ?? code)}&etat=${code === "ok" ? "ok" : "erreur"}#e-${eventId}`);
}

export async function unregisterFromEvent(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const { supabase, user } = await requireUser();
  await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user.id);
  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda?message=${encodeURIComponent("Votre inscription est annulée.")}&etat=ok#e-${eventId}`);
}

export async function toggleLessonComplete(formData: FormData) {
  const lessonId = String(formData.get("lesson_id") ?? "");
  const done = formData.get("done") === "1";
  const { supabase, user } = await requireUser();
  if (done) {
    await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId).eq("user_id", user.id);
  } else {
    await supabase.from("lesson_progress").upsert({ lesson_id: lessonId, user_id: user.id });
  }
  revalidatePath("/formation");
  revalidatePath(`/formation/${lessonId}`);
  revalidatePath("/");
}
