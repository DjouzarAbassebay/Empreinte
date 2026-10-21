import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signedDownloadUrl } from "@/lib/storage";
import type { ContentBlock } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string; blockId: string }> }) {
  const { lessonId, blockId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("content").eq("id", lessonId).single();
  const block = ((data?.content ?? []) as ContentBlock[]).find((b) => b.id === blockId);
  if (!block?.file_path) return new NextResponse("Introuvable", { status: 404 });
  const url = await signedDownloadUrl(block.file_path, block.file_name);
  if (!url) return new NextResponse("Fichier indisponible", { status: 404 });
  return NextResponse.redirect(url);
}
