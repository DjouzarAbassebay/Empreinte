"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function safeNext(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("suite"));
  if (!email || !password) {
    redirect(`/connexion?erreur=${encodeURIComponent("Renseignez votre e-mail et votre mot de passe.")}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/connexion?erreur=${encodeURIComponent("E-mail ou mot de passe incorrect.")}&suite=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?suite=/nouveau-mot-de-passe`,
    });
  }
  // Même message dans tous les cas pour ne pas révéler les comptes existants.
  redirect("/mot-de-passe-oublie?envoye=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    redirect(`/nouveau-mot-de-passe?erreur=${encodeURIComponent("8 caractères minimum.")}`);
  }
  if (password !== confirm) {
    redirect(`/nouveau-mot-de-passe?erreur=${encodeURIComponent("Les deux mots de passe ne correspondent pas.")}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/nouveau-mot-de-passe?erreur=${encodeURIComponent("Le lien a expiré. Refaites une demande.")}`);
  }
  redirect("/?mdp=ok");
}
