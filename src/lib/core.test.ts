import { describe, it, expect } from "vitest";
import {
  serialToDate,
  dateToSerial,
  fractionToTime,
  timeToFraction,
  parseDate,
  isIsoDate,
  shiftDate,
} from "./dates";
import { nextId, firstEmptyIdRow, classify } from "./sheet-utils";
import { aggregate } from "./analytics";
import { parseSheets } from "@/schemas/sheet-parsers";
import { demoRepository } from "@/repositories/demo";
describe("Google Sheets utilities", () => {
  it("converts serial dates, ignoring time fraction", () => {
    expect(serialToDate(25569.5)).toBe("1970-01-01");
    expect(dateToSerial("1970-01-01")).toBe(25569);
    expect(parseDate("08.10.2026")).toBe("2026-10-08");
    expect(dateToSerial(serialToDate(46302))).toBe(46302);
  });
  it("rejects invalid dates and handles leap days", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29");
    expect(() => parseDate("wrong")).toThrow();
  });
  it("converts numeric time", () => {
    expect(fractionToTime(0.5)).toBe("12:00");
    expect(timeToFraction("06:00")).toBe(0.25);
    expect(fractionToTime(0)).toBe("00:00");
    expect(() => timeToFraction("25:00")).toThrow();
  });
  it("uses maximum suffix and preserves minimum padding", () => {
    expect(nextId(["PRJ-002", "PRJ-009", "TSK-999"], "PRJ")).toBe("PRJ-010");
    expect(nextId([], "ACT")).toBe("ACT-001");
    expect(nextId(["ACT-999"], "ACT")).toBe("ACT-1000");
  });
  it("allocates rows by ID, ignoring formulas", () => {
    expect(
      firstEmptyIdRow([["PRJ-001"], ["", "=SUM(F2:F9)"], ["PRJ-003"]]),
    ).toBe(3);
    expect(firstEmptyIdRow([["PRJ-001"]])).toBe(3);
    expect(firstEmptyIdRow([])).toBe(2);
  });
  it("classifies solely by plan_id", () => {
    expect(classify("PLAN-001")).toBe("План");
    expect(classify(" ")).toBe("Внеплан");
    const d = parseSheets([
      [],
      [],
      [],
      [],
      [],
      [
        [
          "ACT-001",
          "2026-10-07",
          "",
          "",
          30,
          "Встречи",
          "Встреча",
          "",
          "",
          "",
          "",
          "",
          "План",
        ],
      ],
    ]);
    expect(d.activities[0].classification).toBe("Внеплан");
  });
});
describe("analytics", () => {
  it("uses Fact independently of tasks and formula totals", async () => {
    const data = await demoRepository.read();
    const date = data.plans[0].date;
    expect(data.tasks[0].createdAt).toBe(date);
    expect(data.tasks[0].updatedAt).toBe(date);
    data.plans[0].actualMinutes = 999;
    const a = aggregate(data.plans, data.activities, date, date);
    expect(a.plan).toBe(60);
    expect(a.fact).toBe(75);
    expect(a.unplanned).toBe(30);
    expect(a.completion).toBe(75);
    expect(a.unplannedPercent).toBe(40);
    expect(a.days[0].deviation).toBe(15);
  });
  it("provides zero filled empty days", () => {
    const a = aggregate([], [], "2026-10-01", "2026-10-03");
    expect(a.days).toHaveLength(3);
    expect(a.fact).toBe(0);
    expect(a.completion).toBe(0);
  });
  it("does not retroactively link unplanned work", async () => {
    const d = await demoRepository.read();
    const date = d.activities[1].date;
    d.plans.push({ ...d.plans[0], id: "PLAN-999", name: d.activities[1].name });
    expect(aggregate(d.plans, d.activities, date, date).unplanned).toBe(30);
  });
});

it("excludes Phase 2 completed and cancelled projects from active totals", async () => {
  const { activeProject } = await import("./analytics");
  const { demoRepository } = await import("@/repositories/demo");
  const project = (await demoRepository.read()).projects[0];
  expect(activeProject({...project,status:"Завершено"})).toBe(false);
  expect(activeProject({...project,status:"Отменено"})).toBe(false);
  expect(activeProject({...project,status:"В работе"})).toBe(true);
});
