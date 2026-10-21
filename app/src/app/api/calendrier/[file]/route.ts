import { NextResponse } from "next/server";
import { buildIcs } from "@/lib/ics";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent } from "@/lib/types";

/**
 * Flux calendrier personnel (abonnement Google Agenda / Apple Calendrier).
 * Authentifié par le jeton secret du profil, car les agendas ne transmettent pas de cookies.
 */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const token = file.replace(/\.ics$/, "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new NextResponse("Introuvable", { status: 404 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("calendar_token", token).single();
  if (!profile) return new NextResponse("Introuvable", { status: 404 });

  const [{ data: events }, { data: regs }] = await Promise.all([
    admin.from("events").select("*").eq("published", true).order("starts_at"),
    admin.from("event_registrations").select("event_id").eq("user_id", profile.id),
  ]);
  const mine = new Set((regs ?? []).map((r: { event_id: string }) => r.event_id));
  // Explorations et autres lives pour tout le monde, Labs uniquement si inscrit.
  const list = ((events ?? []) as CalendarEvent[]).filter((e) => e.type !== "lab" || mine.has(e.id));

  return new NextResponse(buildIcs(list, "Empreinte · Lives"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
