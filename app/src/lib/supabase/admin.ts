import { createClient } from "@supabase/supabase-js";

/**
 * Client avec la clé service_role : contourne les règles RLS.
 * À n'utiliser que côté serveur, après avoir vérifié que la personne est admin.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
