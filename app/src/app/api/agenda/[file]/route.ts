import { NextResponse } from "next/server";
import { buildIcs } from "@/lib/ics";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

/** Fichier .ics d'un seul live (personne connectée). */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.ics$/, "");
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  if (!data) return new NextResponse("Introuvable", { status: 404 });
  const event = data as CalendarEvent;
  return new NextResponse(buildIcs([event]), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="empreinte-${id.slice(0, 8)}.ics"`,
    },
  });
}
