import "server-only";
import { z } from "zod";

export function calendarConfig() {
  const calendarIds = [...new Set((process.env.PERSONAL_OS_CALENDAR_IDS || "").split(",").map(id => id.trim()).filter(Boolean))];
  const days = (value: string | undefined, fallback: number, min: number, max: number) => {
    const n = value === undefined || value === "" ? fallback : Number(value);
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Окно Calendar должно быть целым числом ${min}–${max}`);
    return n;
  };
  if (calendarIds.length > 20 || calendarIds.some(id => id.length > 500)) throw new Error("Допустимо до 20 Calendar IDs");
  return {
    calendarIds,
    pastDays: days(process.env.PERSONAL_OS_CALENDAR_PAST_DAYS, 7, 0, 90),
    futureDays: days(process.env.PERSONAL_OS_CALENDAR_FUTURE_DAYS, 30, 1, 180),
    configured: Boolean(calendarIds.length && process.env.PERSONAL_OS_API_URL && process.env.PERSONAL_OS_API_SECRET),
  };
}
const counts = z.object({ created: z.number().int().nonnegative(), updated: z.number().int().nonnegative(), canceled: z.number().int().nonnegative(), skipped: z.number().int().nonnegative() });
const success = z.object({ ok: z.literal(true), apiVersion: z.literal(2), result: counts, lastSuccess: z.string().datetime() });
export type CalendarResult = z.infer<typeof success>;
async function requestCalendar(action: "calendarSync" | "calendarStatus") {
  const config = calendarConfig();
  if (!config.configured) throw new Error("Настройте PERSONAL_OS_CALENDAR_IDS и Apps Script ENV на сервере");
  let response: Response;
  try {
    response = await fetch(process.env.PERSONAL_OS_API_URL!, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, calendarIds: config.calendarIds, pastDays: config.pastDays, futureDays: config.futureDays, secret: process.env.PERSONAL_OS_API_SECRET }),
      cache: "no-store", signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new Error("Ответ Calendar sync не получен. Проверьте План; повтор синхронизации безопасен благодаря dedup.");
  }
  if (!response.ok) throw new Error("Apps Script недоступен. Проверьте deployment и доступ.");
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error("Apps Script вернул некорректный ответ. Проверьте deployment."); }
  const error = z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }).safeParse(body);
  if (error.success) {
    if (["CALENDAR_ACCESS", "CALENDAR_DATA", "VALIDATION", "NO_FREE_ROW", "FORMULA_PROTECTED", "INVALID_HEADERS", "BUSY"].includes(error.data.error.code)) throw new Error(error.data.error.message);
    throw new Error("Обновите Apps Script кодом PHASE 3, включите Calendar API и подтвердите readonly-доступ владельца.");
  }
  return body;
}
export async function syncSelectedCalendars(): Promise<CalendarResult> {
  const result = success.safeParse(await requestCalendar("calendarSync"));
  if (!result.success) throw new Error("Calendar sync не подтверждён; проверьте deployment и План перед повтором.");
  return result.data;
}
export async function calendarLastSuccess() {
  const result = z.object({ ok: z.literal(true), apiVersion: z.literal(2), lastSuccess: z.string().datetime().nullable() }).parse(await requestCalendar("calendarStatus"));
  return result.lastSuccess;
}
