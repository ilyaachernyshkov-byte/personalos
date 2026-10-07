import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
import { repository } from "./index";
import { appsScriptRepository } from "./apps-script";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Apps Script repository", () => {
  it("selects real data in development and production without demo fallback", () => {
    vi.stubEnv("PERSONAL_OS_API_URL", "https://script.google.com/test");
    vi.stubEnv("PERSONAL_OS_API_SECRET", "test-secret");
    for (const mode of ["development", "production"]) {
      vi.stubEnv("NODE_ENV", mode);
      expect(repository()).toBe(appsScriptRepository);
      expect(repository().mode).toBe("google");
    }
  });
  it("fails closed on partial API configuration", () => {
    vi.stubEnv("PERSONAL_OS_API_URL", "https://script.google.com/test");
    vi.stubEnv("PERSONAL_OS_API_SECRET", "");
    expect(() => repository()).toThrow("Apps Script настроен частично");
  });
  it("posts the authenticated snapshot once and never falls back on API errors", async () => {
    vi.stubEnv("PERSONAL_OS_API_URL", "https://script.google.com/test");
    vi.stubEnv("PERSONAL_OS_API_SECRET", "test-secret");
    const data = Object.fromEntries(
      ["Проекты", "Этапы", "Задачи", "Процессы", "План", "Факт"].map((name) => [
        name,
        [],
      ]),
    );
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, data })));
    vi.stubGlobal("fetch", fetch);
    expect((await repository().read()).projects).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
    const options = fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.cache).toBe("no-store");
    expect(JSON.parse(options.body)).toEqual({
      action: "snapshot",
      secret: "test-secret",
    });
    fetch.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    await expect(repository().read()).rejects.toThrow(
      "Не удалось прочитать Apps Script",
    );
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "Denied" })),
    );
    await expect(repository().read()).rejects.toThrow(
      "Не удалось прочитать Apps Script",
    );
  });
});

it("posts create and update without computed columns, and refuses snapshot-only write responses", async () => {
  vi.stubEnv("PERSONAL_OS_API_URL", "https://script.google.com/test");
  vi.stubEnv("PERSONAL_OS_API_SECRET", "test-secret");
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true, apiVersion: 2, id: "PRJ-001" })),
    );
  vi.stubGlobal("fetch", fetch);
  await expect(
    appsScriptRepository.mutate!({
      action: "create",
      entity: "project",
      data: { name: "X" },
    }),
  ).resolves.toEqual({ id: "PRJ-001" });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    action: "create",
    entity: "project",
    data: { name: "X" },
    secret: "test-secret",
  });
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ ok: true, apiVersion: 2, id: "PRJ-001" })),
  );
  await expect(
    appsScriptRepository.mutate!({
      action: "update",
      entity: "project",
      id: "PRJ-001",
      data: { name: "Changed" },
    }),
  ).resolves.toEqual({ id: "PRJ-001" });
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
    action: "update",
    id: "PRJ-001",
    data: { name: "Changed" },
  });
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ ok: true, data: {} })),
  );
  await expect(
    appsScriptRepository.mutate!({
      action: "create",
      entity: "project",
      data: { name: "X" },
    }),
  ).rejects.toThrow("Обновите deployment");
});
