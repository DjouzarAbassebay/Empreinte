import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Personne connectée et son profil. Redirige vers la connexion sinon. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profil absent (compte créé avant le trigger) : on le reconstruit à la volée.
    const fallback: Profile = {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? "",
      role: "member",
      calendar_token: "",
      created_at: user.created_at,
    };
    return { supabase, user, profile: fallback };
  }
  return { supabase, user, profile: profile as Profile };
}

/** Comme requireUser, mais exige le rôle admin. */
export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") redirect("/");
  return ctx;
}
