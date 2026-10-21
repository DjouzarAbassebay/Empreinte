"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase côté navigateur (envois de fichiers depuis l'admin). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
