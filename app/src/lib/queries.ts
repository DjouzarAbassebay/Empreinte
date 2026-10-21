import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent, EventRegistration, Lesson, Module, Resource, ResourceCategory } from "@/lib/types";

export async function getModulesWithLessons(supabase: SupabaseClient) {
  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("modules").select("*").order("position").order("created_at"),
    supabase.from("lessons").select("*").order("position").order("created_at"),
  ]);
  const byModule = new Map<string, Lesson[]>();
  for (const l of (lessons ?? []) as Lesson[]) {
    const arr = byModule.get(l.module_id) ?? [];
    arr.push(l);
    byModule.set(l.module_id, arr);
  }
  return ((modules ?? []) as Module[]).map((m) => ({ ...m, lessons: byModule.get(m.id) ?? [] }));
}

export async function getCompletedLessonIds(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id));
}

export async function getEvents(supabase: SupabaseClient) {
  const [{ data: events }, { data: regs }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at"),
    supabase.from("event_registrations").select("*"),
  ]);
  const regByEvent = new Map<string, EventRegistration[]>();
  for (const r of (regs ?? []) as EventRegistration[]) {
    const arr = regByEvent.get(r.event_id) ?? [];
    arr.push(r);
    regByEvent.set(r.event_id, arr);
  }
  return ((events ?? []) as CalendarEvent[]).map((e) => ({ ...e, registrations: regByEvent.get(e.id) ?? [] }));
}

export async function getResources(supabase: SupabaseClient) {
  const [{ data: categories }, { data: resources }] = await Promise.all([
    supabase.from("resource_categories").select("*").order("position").order("created_at"),
    supabase.from("resources").select("*").order("position").order("created_at"),
  ]);
  return {
    categories: (categories ?? []) as ResourceCategory[],
    resources: (resources ?? []) as Resource[],
  };
}
