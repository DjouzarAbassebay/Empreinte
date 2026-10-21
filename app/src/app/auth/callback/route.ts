import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Échange le code reçu par e-mail (réinitialisation de mot de passe) contre une session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const suite = searchParams.get("suite") ?? "/";
  const next = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(
    `${origin}/mot-de-passe-oublie?erreur=${encodeURIComponent("Lien invalide ou expiré.")}`,
  );
}
