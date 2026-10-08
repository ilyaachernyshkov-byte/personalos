"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { syncSelectedCalendars, type CalendarResult } from "@/repositories/calendar";
export async function syncCalendarAction(): Promise<{ ok: true; data: CalendarResult } | { ok: false; error: string }> {
  await requireAuth();
  try {
    return { ok: true, data: await syncSelectedCalendars() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Не удалось синхронизировать Calendar" };
  } finally {
    // A backend failure can follow partial writes. Refresh those too.
    for (const path of ["/", "/plan-fact", "/analytics", "/settings"]) revalidatePath(path);
  }
}
