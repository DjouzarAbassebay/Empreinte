import { NextResponse } from "next/server";
import { bunnyConfigured, createUploadTicket } from "@/lib/bunny";
import { createClient } from "@/lib/supabase/server";

/** Prépare un envoi vidéo direct navigateur → Bunny Stream (admin uniquement). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (!bunnyConfigured()) return NextResponse.json({ error: "Bunny Stream n'est pas configuré." }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { title?: string };
  try {
    const ticket = await createUploadTicket(body.title?.trim() || "Vidéo Empreinte");
    return NextResponse.json(ticket);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
