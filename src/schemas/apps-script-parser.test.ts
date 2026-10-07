import { describe, expect, it } from "vitest";
import { parseAppsScriptSnapshot } from "./apps-script-parser";

const emptySheets = () => Object.fromEntries(
  ["Проекты", "Этапы", "Задачи", "Процессы", "План", "Факт"].map((name) => [name, []]),
);

describe("Apps Script snapshot", () => {
  it("maps by headers and preserves formula progress and Fact classification", () => {
    const data = {
      ...emptySheets(),
      Проекты: [{ "Прогресс_%": 35, "Название проекта": "Real project", project_id: "PRJ-001" }],
      Процессы: [{ process_id: "PROC-001", Время: "1899-12-30T10:00:00.000Z", Активен: true }],
      План: [{ plan_id: "PLAN-001", Дата: "2026-10-08T00:00:00.000Z", Начало: "1899-12-30T13:00:00.000Z" }],
      Факт: [{ activity_id: "ACT-001", "Факт_мин": 30, "План/внеплан": "План", plan_id: "" }],
    };
    const result = parseAppsScriptSnapshot({ ok: true, data });
    expect(result.projects[0].progress).toBe(35);
    expect(result.projects[0].name).toBe("Real project");
    expect(result.processes[0].time).toBe("10:00");
    expect(result.processes[0].active).toBe(true);
    expect(result.plans[0].date).toBe("2026-10-08");
    expect(result.plans[0].start).toBe("13:00");
    expect(result.activities[0].minutes).toBe(30);
    expect(result.activities[0].classification).toBe("Внеплан");
  });
  it("rejects API errors and missing or malformed sheets", () => {
    expect(() => parseAppsScriptSnapshot({ ok: false, data: emptySheets() })).toThrow();
    expect(() => parseAppsScriptSnapshot({ ok: true, data: {} })).toThrow();
    expect(() => parseAppsScriptSnapshot({ ok: true, data: { ...emptySheets(), Факт: "bad" } })).toThrow();
  });
});
