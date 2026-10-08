import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { calendarConfig, calendarLastSuccess, syncSelectedCalendars } from "./calendar";
beforeEach(() => {
  vi.stubEnv("PERSONAL_OS_API_URL", "https://example.test/api");
  vi.stubEnv("PERSONAL_OS_API_SECRET", "server-secret");
  vi.stubEnv("PERSONAL_OS_CALENDAR_IDS", " a , b , a ");
  vi.stubEnv("PERSONAL_OS_CALENDAR_PAST_DAYS", "");
  vi.stubEnv("PERSONAL_OS_CALENDAR_FUTURE_DAYS", "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Calendar repository", () => {
  it("uses explicit deduplicated server IDs and a bounded default window", () => {
    expect(calendarConfig()).toMatchObject({calendarIds: ["a", "b"], pastDays: 7, futureDays: 30, configured: true});
    vi.stubEnv("PERSONAL_OS_CALENDAR_IDS", "");
    expect(calendarConfig().configured).toBe(false);
  });
  it("rejects invalid window ENV", () => {
    vi.stubEnv("PERSONAL_OS_CALENDAR_FUTURE_DAYS", "181");
    expect(() => calendarConfig()).toThrow();
  });
  it("sends sync only with server configuration and validates counts", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ok: true, apiVersion: 2, result: {created: 1, updated: 0, canceled: 0, skipped: 2}, lastSuccess: "2026-10-08T12:00:00.000Z"}));
    vi.stubGlobal("fetch", fetch);
    expect(await syncSelectedCalendars()).toMatchObject({result: {created: 1}});
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({action: "calendarSync", calendarIds: ["a", "b"], pastDays: 7, futureDays: 30, secret: "server-secret"});
    expect(fetch.mock.calls[0][1].cache).toBe("no-store");
  });
  it("reads last success without invoking sync", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ok: true, apiVersion: 2, lastSuccess: null}));
    vi.stubGlobal("fetch", fetch);
    expect(await calendarLastSuccess()).toBeNull();
    expect(JSON.parse(fetch.mock.calls[0][1].body).action).toBe("calendarStatus");
  });
  it("surfaces safe access errors and rejects unconfirmed success", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ok: false, error: {code: "CALENDAR_ACCESS", message: "Read access required"}})).mockResolvedValueOnce(Response.json({ok: true, apiVersion: 2, result: {created: -1}}));
    vi.stubGlobal("fetch", fetch);
    await expect(syncSelectedCalendars()).rejects.toThrow("Read access required");
    await expect(syncSelectedCalendars()).rejects.toThrow("не подтверждён");
  });
});
