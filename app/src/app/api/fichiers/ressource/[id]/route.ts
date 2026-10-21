import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signedDownloadUrl } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // La règle RLS garantit que seules les ressources visibles sont renvoyées.
  const { data } = await supabase.from("resources").select("file_path,file_name").eq("id", id).single();
  if (!data?.file_path) return new NextResponse("Introuvable", { status: 404 });
  const url = await signedDownloadUrl(data.file_path, data.file_name);
  if (!url) return new NextResponse("Fichier indisponible", { status: 404 });
  return NextResponse.redirect(url);
}
