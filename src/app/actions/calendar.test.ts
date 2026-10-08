import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", () => ({requireAuth: vi.fn()}));
vi.mock("@/repositories/calendar", () => ({syncSelectedCalendars: vi.fn()}));
vi.mock("next/cache", () => ({revalidatePath: vi.fn()}));
import { requireAuth } from "@/lib/auth";
import { syncSelectedCalendars } from "@/repositories/calendar";
import { revalidatePath } from "next/cache";
import { syncCalendarAction } from "./calendar";
beforeEach(() => vi.resetAllMocks());
it("authenticates before sync and refreshes affected pages", async () => {
  vi.mocked(syncSelectedCalendars).mockResolvedValue({ok: true, apiVersion: 2, result: {created: 1, updated: 0, canceled: 0, skipped: 0}, lastSuccess: "2026-10-08T12:00:00.000Z"});
  expect(await syncCalendarAction()).toMatchObject({ok: true});
  expect(vi.mocked(requireAuth).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(syncSelectedCalendars).mock.invocationCallOrder[0]);
  expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/"], ["/plan-fact"], ["/analytics"], ["/settings"]]);
});
it("blocks unauthenticated sync", async () => {
  vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));
  await expect(syncCalendarAction()).rejects.toThrow("Unauthorized");
  expect(syncSelectedCalendars).not.toHaveBeenCalled();
});
it("refreshes partial writes and shows error on backend failure", async () => {
  vi.mocked(syncSelectedCalendars).mockRejectedValue(new Error("Calendar access failed"));
  expect(await syncCalendarAction()).toEqual({ok: false, error: "Calendar access failed"});
  expect(revalidatePath).toHaveBeenCalledTimes(4);
});
