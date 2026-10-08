import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";
import {
  entityConfig,
  sheetOptions,
  processToFact,
  editableData,
  validateMutation,
  taskToFact,
  planToFact,
  elapsedMinutes,
} from "@/schemas/mutations";
import { parseAppsScriptSnapshot } from "@/schemas/apps-script-parser";
import { aggregate } from "@/lib/analytics";
import { demoRepository } from "@/repositories/demo";
import { dateToSerial, timeToFraction } from "@/lib/dates";

type Config = {
  sheet: string;
  prefix: string;
  fields: (string | null)[];
  headers: string[];
};
class Sheet {
  cells: unknown[][];
  formulas = new Map<string, string>();
  writes: [number, number, unknown][] = [];
  validations = new Map<string, string[]>();
  constructor(config: Config) {
    this.cells = [
      config.headers,
      ...Array.from({ length: 5 }, () => Array(config.fields.length).fill("")),
    ];
    const entity = Object.keys(entityConfig).find(
      (key) =>
        entityConfig[key as keyof typeof entityConfig].sheet === config.sheet,
    )! as keyof typeof entityConfig;
    config.fields.forEach((field, col) => {
      const allowed =
        field === "source"
          ? ["Ручной ввод", "ChatGPT", "Импорт"]
          : field === "active"
            ? ["Да", "Нет"]
            : field
              ? sheetOptions[entity]?.[field]
              : undefined;
      if (allowed)
        for (let row = 2; row <= 6; row++)
          this.validations.set(`${row}:${col + 1}`, allowed);
      if (!field)
        for (let row = 2; row <= 6; row++) {
          this.formulas.set(`${row}:${col + 1}`, "=FORMULA()");
          this.cells[row - 1][col] = 0;
        }
    });
  }
  getMaxRows() {
    return this.cells.length;
  }
  getRange(row: number, col: number, rows = 1, cols = 1) {
    return {
      getValues: () =>
        this.cells
          .slice(row - 1, row - 1 + rows)
          .map((r) => r.slice(col - 1, col - 1 + cols)),
      getDisplayValues: () =>
        this.cells
          .slice(row - 1, row - 1 + rows)
          .map((r) => r.slice(col - 1, col - 1 + cols).map((v) => String(v))),
      getDataValidation: () => {
        const allowed = this.validations.get(`${row}:${col}`);
        return allowed
          ? {
              getAllowInvalid: () => false,
              getCriteriaType: () => "VALUE_IN_LIST",
              getCriteriaValues: () => [allowed],
            }
          : null;
      },
      getFormula: () => this.formulas.get(`${row}:${col}`) || "",
      setValue: (value: unknown) => {
        this.cells[row - 1][col - 1] = value;
        this.writes.push([row, col, value]);
      },
      setNumberFormat() {},
    };
  }
}
function backend() {
  let locked = false;
  const properties: Record<string, string> = { API_SECRET: "test-secret", SPREADSHEET_ID: "book" };
  const scope = vm.createContext({
    console: { error: vi.fn() },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties[key],
        setProperty: (key: string, value: string) => { properties[key] = value; },
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text: string) => ({
        setMimeType: () => JSON.parse(text),
      }),
    },
    Utilities: {
      formatDate: (date: Date, _zone: string, format: string) =>
        format === "HH:mm"
          ? date.toISOString().slice(11, 16)
          : date.toISOString().slice(0, 10),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          expect(locked).toBe(false);
          locked = true;
          return true;
        },
        releaseLock: () => {
          locked = false;
        },
      }),
    },
  });
  vm.runInContext(readFileSync("apps-script/Code.gs", "utf8"), scope);
  const config = scope.CONFIG as Record<string, Config>;
  const sheets = Object.fromEntries(
    Object.entries(config).map(([entity, c]) => [entity, new Sheet(c)]),
  );
  const book = {
    getSheetByName: (name: string) =>
      sheets[Object.keys(config).find((key) => config[key].sheet === name)!],
    getSpreadsheetTimeZone: () => "Europe/Saratov",
  };
  scope.SpreadsheetApp = { openById: () => book, flush: () => {} };
  const post = (body: object) =>
    scope.doPost({
      postData: {
        contents: JSON.stringify({ secret: "test-secret", ...body }),
      },
    });
  return { scope, config, sheets, post };
}

describe("full Apps Script backend", () => {
  it("matches frontend column contracts and ignores formula fields", () => {
    const { config, sheets, post } = backend();
    for (const [entity, c] of Object.entries(entityConfig))
      expect(config[entity].fields).toEqual(c.fields);
    const before = [...sheets.project.formulas];
    expect(
      post({
        action: "create",
        entity: "project",
        data: { name: "First", progress: 99, health: "Красный" },
      }),
    ).toMatchObject({ ok: true, id: "PRJ-001" });
    expect(
      post({
        action: "update",
        entity: "project",
        id: "PRJ-001",
        data: { name: "Changed", progress: 100 },
      }),
    ).toMatchObject({ ok: true });
    expect([...sheets.project.formulas]).toEqual(before);
    expect(
      sheets.project.writes.some(([, col]) => [6, 11, 12, 13].includes(col)),
    ).toBe(false);
    expect(
      post({
        action: "create",
        entity: "plan",
        data: {
          name: "Plan",
          date: "2026-10-07",
          actualMinutes: 999,
          deviation: 999,
        },
      }),
    ).toMatchObject({ ok: true });
    expect(
      post({
        action: "create",
        entity: "activity",
        data: { name: "Fact", date: "2026-10-07", classification: "План" },
      }),
    ).toMatchObject({ ok: true });
    expect(sheets.plan.writes.some(([, col]) => [12, 13].includes(col))).toBe(
      false,
    );
    expect(sheets.activity.writes.some(([, col]) => col === 13)).toBe(false);
  });
  it("allocates max suffix + 1 into first empty ID rather than formula-filled extent", () => {
    const { sheets, post, scope } = backend();
    sheets.project.cells[1][0] = "PRJ-009";
    sheets.project.cells[3][0] = "PRJ-101";
    expect(
      post({ action: "create", entity: "project", data: { name: "New" } }),
    ).toMatchObject({ ok: true, id: "PRJ-102" });
    expect(sheets.project.cells[2][0]).toBe("PRJ-102");
    expect(scope.nextId(["PRJ-999"], "PRJ")).toBe("PRJ-1000");
    expect(scope.firstEmptyIdRow(["A", " ", "B"])).toBe(3);
  });
  it("validates secret, action, entity, IDs, dates, time, numbers, allowed fields and links without writes", () => {
    const { post, sheets } = backend();
    for (const body of [
      { secret: "bad", action: "snapshot" },
      { action: "delete" },
      { action: "create", entity: "unknown", data: {} },
      { action: "create", entity: "project", data: { name: "" } },
      {
        action: "create",
        entity: "project",
        data: { name: "X", start: "2026-02-30" },
      },
      {
        action: "create",
        entity: "project",
        data: { name: "X", unknown: "x" },
      },
      {
        action: "create",
        entity: "project",
        data: { name: "X", id: "PRJ-003" },
      },
      {
        action: "create",
        entity: "milestone",
        data: { name: "X", checkpoint: 101 },
      },
      {
        action: "create",
        entity: "activity",
        data: { name: "X", date: "2026-10-07", start: "25:00" },
      },
      {
        action: "create",
        entity: "activity",
        data: { name: "X", date: "2026-10-07", minutes: -1 },
      },
      {
        action: "create",
        entity: "task",
        data: { name: "X", projectId: "PRJ-999" },
      },
      {
        action: "update",
        entity: "task",
        id: "PRJ-001",
        data: { status: "Готово" },
      },
    ])
      expect(post(body)).toMatchObject({ ok: false });
    for (const sheet of Object.values(sheets))
      expect(sheet.writes).toHaveLength(0);
  });
  it("preflights unexpected formulas, deadlines and duplicate IDs before mutation", () => {
    const { post, sheets } = backend();
    sheets.project.formulas.set("2:2", "=X");
    expect(
      post({ action: "create", entity: "project", data: { name: "X" } }),
    ).toMatchObject({ ok: false, error: { code: "FORMULA_PROTECTED" } });
    expect(sheets.project.writes).toHaveLength(0);
    sheets.project.formulas.delete("2:2");
    expect(
      post({
        action: "create",
        entity: "project",
        data: { name: "X", start: "2026-10-09", deadline: "2026-10-07" },
      }),
    ).toMatchObject({ ok: false });
    sheets.project.cells[1][0] = sheets.project.cells[2][0] = "PRJ-001";
    expect(
      post({
        action: "update",
        entity: "project",
        id: "PRJ-001",
        data: { name: "X" },
      }),
    ).toMatchObject({ ok: false });
  });
  it("writes date/time serials, canonical relation names and supports multiple facts per plan/task", () => {
    const { post, sheets } = backend();
    post({
      action: "create",
      entity: "project",
      data: { name: "Проект", start: "2026-10-07" },
    });
    post({
      action: "create",
      entity: "task",
      data: { name: "Task", projectId: "PRJ-001", project: "Forged" },
    });
    post({
      action: "create",
      entity: "plan",
      data: {
        name: "Plan",
        date: "2026-10-07",
        start: "09:00",
        end: "10:00",
        projectId: "PRJ-001",
      },
    });
    for (let i = 0; i < 2; i++)
      expect(
        post({
          action: "create",
          entity: "activity",
          data: {
            name: "Fact",
            date: "2026-10-07",
            start: "09:00",
            end: "09:30",
            minutes: 30,
            projectId: "PRJ-001",
            taskId: "TSK-001",
            planId: "PLAN-001",
          },
        }),
      ).toMatchObject({ ok: true });
    expect(sheets.project.cells[1][8]).toBe(dateToSerial("2026-10-07"));
    expect(sheets.plan.cells[1][2]).toBe(timeToFraction("09:00"));
    expect(sheets.task.cells[1][4]).toBe("Проект");
    const snapshot = parseAppsScriptSnapshot(post({ action: "snapshot" }));
    expect(snapshot.activities[0]).toMatchObject({
      date: "2026-10-07",
      start: "09:00",
      classification: "План",
    });
    const edit = editableData("activity", snapshot.activities[0]);
    edit.minutes = 45;
    expect(
      post({ action: "update", entity: "activity", id: "ACT-001", data: edit }),
    ).toMatchObject({ ok: true });
    post({
      action: "create",
      entity: "activity",
      data: { name: "Unplanned", date: "2026-10-07", minutes: 15 },
    });
    const after = parseAppsScriptSnapshot(post({ action: "snapshot" }));
    expect(
      aggregate(after.plans, after.activities, "2026-10-07", "2026-10-07"),
    ).toMatchObject({ fact: 90, unplanned: 15 });
    expect(after.activities[0].date).toBe("2026-10-07");
    expect(after.activities[2].classification).toBe("Внеплан");
    expect(after.tasks[0].status).not.toBe("Готово");
  });
});
describe("mutation helpers", () => {
  it("validates create/update fields and relations; task and plan prefill preserve explicit planning", async () => {
    const snapshot = await demoRepository.read();
    const task = snapshot.tasks[0],
      plan = snapshot.plans[0];
    expect(taskToFact(task, "2026-10-07")).toMatchObject({
      taskId: task.id,
      projectId: task.projectId,
      date: "2026-10-07",
    });
    expect(taskToFact(task, "2026-10-07")).not.toHaveProperty("planId");
    expect(planToFact(plan)).toMatchObject({
      planId: plan.id,
      date: plan.date,
      start: plan.start,
      minutes: plan.minutes,
    });
    expect(
      validateMutation(
        "task",
        {
          name: "X",
          projectId: task.projectId,
          project: "Wrong",
          milestoneId: task.milestoneId,
        },
        snapshot,
        true,
      ),
    ).toMatchObject({ project: task.project, milestone: task.milestone });
    expect(() =>
      validateMutation(
        "task",
        { name: "X", projectId: "PRJ-999" },
        snapshot,
        true,
      ),
    ).toThrow();
    expect(() =>
      validateMutation(
        "milestone",
        { name: "X", projectId: task.projectId, checkpoint: 101 },
        snapshot,
        true,
      ),
    ).toThrow();
    expect(() =>
      validateMutation("project", { name: "X", progress: 100 }, snapshot, true),
    ).toThrow();
    expect(elapsedMinutes("23:30", "00:15")).toBe(45);
    expect(elapsedMinutes("09:00", "10:30")).toBe(90);
  });
});

it("adapts process booleans and source to real dropdowns; invalid dropdowns never cause partial writes", () => {
  const { post, sheets } = backend();
  expect(
    post({
      action: "create",
      entity: "project",
      data: { name: "X", status: "В работе" },
    }),
  ).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  expect(sheets.project.writes).toHaveLength(0);
  expect(
    post({
      action: "create",
      entity: "process",
      data: { name: "Process", active: true, frequency: "Еженедельно" },
    }),
  ).toMatchObject({ ok: true });
  expect(sheets.process.cells[1][7]).toBe("Да");
  expect(sheets.process.cells[1][12]).toBe("Ручной ввод");
  expect(
    post({
      action: "update",
      entity: "process",
      id: "PROC-001",
      data: { active: false },
    }),
  ).toMatchObject({ ok: true });
  expect(sheets.process.cells[1][7]).toBe("Нет");
});
it("reports API version and safe failure stage, logging internal exceptions only server-side", () => {
  const { scope, post } = backend();
  scope.SpreadsheetApp = {
    openById: () => ({
      getSheetByName: () => ({
        getRange: () => ({
          getValues: () => {
            throw new Error("Internal failure");
          },
        }),
      }),
      getSpreadsheetTimeZone: () => {
        throw new Error("Internal failure");
      },
    }),
  };
  const result = post({ action: "snapshot" });
  expect(result).toMatchObject({
    ok: false,
    apiVersion: 2,
    error: { code: "BACKEND_ERROR", stage: "snapshot:project:sheet" },
  });
  expect(JSON.stringify(result)).not.toContain("Internal failure");
  expect(JSON.stringify(result)).not.toContain("test-secret");
  expect(scope.console.error).toHaveBeenCalledOnce();
});
it("prefills supported native activity types for task, plan and process", async () => {
  const snapshot = await demoRepository.read();
  const allowed = sheetOptions.activity!.type;
  expect(allowed).toContain(taskToFact(snapshot.tasks[0], "2026-10-07").type);
  expect(allowed).toContain(planToFact(snapshot.plans[0]).type);
  expect(processToFact(snapshot.processes[0], "2026-10-07").type).toBe(
    "Процесс",
  );
});

it("always passes a nonempty string timezone to Apps Script date formatting", () => {
  const { scope } = backend();
  expect(
    scope.getSafeTimeZone({ getSpreadsheetTimeZone: () => " Etc/GMT " }),
  ).toBe("Etc/GMT");
  scope.Session = { getScriptTimeZone: () => "Europe/Saratov" };
  for (const value of [undefined, null, 0, {}, ""])
    expect(scope.getSafeTimeZone({ getSpreadsheetTimeZone: () => value })).toBe(
      "Europe/Saratov",
    );
  scope.Session = { getScriptTimeZone: () => null };
  expect(scope.getSafeTimeZone({ getSpreadsheetTimeZone: () => null })).toBe(
    "UTC",
  );
  expect(
    scope.getSafeTimeZone({
      getSpreadsheetTimeZone: () => {
        throw new Error("Unavailable");
      },
    }),
  ).toBe("UTC");
});

it("uses displayed Sheet time instead of 1899 Date timezone offsets and preserves gap row indexing", () => {
  const { scope, sheets, post } = backend();
  // Model the exact live mismatch: value Date would format as 12:34, displayed cell is 09:30.
  scope.shiftedTime = vm.runInContext(
    "new Date('1899-12-30T12:34:00Z')",
    scope,
  );
  const cell = scope.shiftedTime;
  expect(scope.serializeCell(cell, "09:30", "UTC", true)).toBe("09:30");
  expect(scope.serializeCell(cell, "9:30:00", "Europe/Saratov", true)).toBe(
    "09:30",
  );
  const range = sheets.plan.getRange.bind(sheets.plan);
  sheets.plan.cells[3][0] = "PLAN-001";
  sheets.plan.cells[3][1] = vm.runInContext(
    "new Date('2026-10-07T20:00:00Z')",
    scope,
  );
  sheets.plan.cells[3][2] = sheets.plan.cells[3][3] = cell;
  sheets.plan.getRange = (...args: Parameters<Sheet["getRange"]>) => {
    const result = range(...args);
    return {
      ...result,
      getDisplayValues: () =>
        result
          .getDisplayValues()
          .map((row, i) =>
            row.map((value, j) =>
              args[0] + i === 4 && args[1] + j === 2
                ? "08.10.2026"
                : args[0] + i === 4 && [3, 4].includes(args[1] + j)
                  ? "09:30"
                  : value,
            ),
          ),
    };
  };
  const snapshot = parseAppsScriptSnapshot(post({ action: "snapshot" }));
  expect(snapshot.plans[0]).toMatchObject({
    id: "PLAN-001",
    date: "2026-10-08",
    start: "09:30",
    end: "09:30",
  });
});

type TestCalendarEvent = { id: string; status?: string; summary?: string; start?: {dateTime?: string; date?: string}; end?: {dateTime?: string; date?: string} };
function calendarBackend() {
  const b = backend();
  b.scope.Utilities = { formatDate(date: Date, timeZone: string, format: string) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)!.value;
    if (format === "HH:mm") return `${get("hour")}:${get("minute")}`;
    const day = `${get("year")}-${get("month")}-${get("day")}`;
    return format === "yyyy-MM-dd" ? day : `${day} ${get("hour")}:${get("minute")}:${get("second")}`;
  } };
  b.scope.ScriptApp = { getOAuthToken: () => "test-owner-token" };
  const calendars: Record<string, TestCalendarEvent[]> = { a: [] };
  const gets = new Map<string, TestCalendarEvent | number>();
  let pagination = false;
  const fetch = vi.fn((url: string, options: {method: string}) => {
    expect(options.method).toBe("get");
    const u = new URL(url);
    const path = u.pathname.split("/").map(decodeURIComponent);
    const id = path[4], eventId = path[6];
    let status = 200, data: unknown;
    if (eventId) {
      const found = gets.get(`${id}:${eventId}`) ?? calendars[id]?.find(e => e.id === eventId);
      if (typeof found === "number") status = found;
      else if (found) data = found;
      else status = 404;
    } else if (!(id in calendars)) status = 403;
    else {
      expect(u.searchParams.get("singleEvents")).toBe("true");
      expect(u.searchParams.get("showDeleted")).toBe("true");
      expect(u.searchParams.get("timeZone")).toBe("Europe/Saratov");
      expect(u.searchParams.get("timeMin")).toMatch(/Z$/);
      data = pagination && !u.searchParams.has("pageToken") ? {items: calendars[id].slice(0, 1), nextPageToken: "page2"} : {items: pagination ? calendars[id].slice(1) : calendars[id]};
    }
    return { getResponseCode: () => status, getContentText: () => JSON.stringify(data || {}) };
  });
  b.scope.UrlFetchApp = { fetch };
  return {...b, calendars, gets, fetch, paginate: () => {pagination = true;}, sync: (ids = ["a"]) => b.post({action: "calendarSync", calendarIds: ids, pastDays: 7, futureDays: 30})};
}
const timed = (id = "event-1"): TestCalendarEvent => ({id, summary: "Meeting", start: {dateTime: "2026-10-08T10:30:00+04:00"}, end: {dateTime: "2026-10-08T11:45:00+04:00"}});
describe("Calendar read-only integration", () => {
  it("maps timed event through Sheet and snapshot without HH:mm shift; no Fact or formula writes", () => {
    const b = calendarBackend(); b.calendars.a = [timed()];
    const formulas = [...b.sheets.plan.formulas];
    expect(b.sync()).toMatchObject({ok: true, result: {created: 1, updated: 0, canceled: 0, skipped: 0}});
    const snapshot = parseAppsScriptSnapshot(b.post({action: "snapshot"}));
    expect(snapshot.plans[0]).toMatchObject({id: "PLAN-001", date: "2026-10-08", start: "10:30", end: "11:45", minutes: 75, source: "Импорт", calendarId: "a", calendarEventId: "event-1"});
    expect(snapshot.activities).toEqual([]);
    expect(b.sheets.activity.writes).toEqual([]);
    expect([...b.sheets.plan.formulas]).toEqual(formulas);
    expect(b.sheets.plan.writes.some(([,col]) => col === 12 || col === 13)).toBe(false);
    expect(b.post({action: "calendarStatus"})).toMatchObject({ok: true, lastSuccess: expect.stringMatching(/Z$/)});
  });
  it("dedups repeat sync and preserves PLAN ID, manual project/sourceId/notes/type on updates", () => {
    const b = calendarBackend(); b.calendars.a = [timed()]; b.sync();
    const row = b.sheets.plan.cells[1]; row[6] = "TSK-999"; row[8] = "PRJ-999"; row[9] = "Manual project"; row[16] = "Manual notes"; row[5] = "Фокус-блок";
    expect(b.sync()).toMatchObject({result: {created: 0, skipped: 1}});
    b.calendars.a = [{...timed(), summary: "Renamed", start: {dateTime: "2026-10-09T12:00:00+04:00"}, end: {dateTime: "2026-10-09T13:00:00+04:00"}}];
    expect(b.sync()).toMatchObject({result: {created: 0, updated: 1}});
    expect(row[0]).toBe("PLAN-001"); expect(row[7]).toBe("Renamed");
    expect([row[6], row[8], row[9], row[16], row[5]]).toEqual(["TSK-999", "PRJ-999", "Manual project", "Manual notes", "Фокус-блок"]);
    expect(b.sheets.plan.cells.filter(r => String(r[0]).startsWith("PLAN-")).length).toBe(1);
  });
  it("cancels tombstones without deleting row, IDs, event detail or creating Fact", () => {
    const b = calendarBackend(); b.calendars.a = [timed()]; b.sync();
    b.calendars.a = [{id: "event-1", status: "cancelled"}, {id: "never-imported", status: "cancelled"}];
    expect(b.sync()).toMatchObject({result: {canceled: 1, skipped: 1}});
    expect(b.sheets.plan.cells[1]).toMatchObject({0: "PLAN-001", 7: "Meeting", 10: "Отменено", 14: "a", 15: "event-1"});
    expect(b.sync()).toMatchObject({result: {canceled: 0, skipped: 2}});
    expect(b.sheets.activity.writes).toEqual([]);
  });
  it("verifies missing event: 410 cancels, a moved event updates instead of cancellation", () => {
    const b = calendarBackend(); b.calendars.a = [timed()]; b.sync(); b.calendars.a = [];
    b.gets.set("a:event-1", {...timed(), start: {dateTime: "2027-01-01T10:00:00+04:00"}, end: {dateTime: "2027-01-01T11:00:00+04:00"}});
    expect(b.sync()).toMatchObject({result: {updated: 1, canceled: 0}});
    b.gets.set("a:event-1", 410);
    expect(b.sync()).toMatchObject({result: {canceled: 1}});
  });
  it("maps all-day multi-day to one zero-minute Plan", () => {
    const b = calendarBackend(); b.calendars.a = [{id: "all-day", start: {date: "2026-10-08"}, end: {date: "2026-10-12"}}];
    expect(b.sync()).toMatchObject({result: {created: 1}});
    expect(b.sheets.plan.cells[1].slice(2, 5)).toEqual(["", "", 0]);
  });
  it("paginates recurring instance IDs and dedups by calendar+instance", () => {
    const b = calendarBackend(); b.calendars.a = [timed("series_20261008T063000Z"), timed("series_20261009T063000Z")]; b.calendars.b = [timed("series_20261008T063000Z")]; b.paginate();
    expect(b.sync(["a", "b"])).toMatchObject({result: {created: 3}});
    expect(b.sync(["a", "b"])).toMatchObject({result: {created: 0, skipped: 3}});
    expect(b.fetch).toHaveBeenCalledTimes(8);
  });
  it("converts RFC3339 offsets into spreadsheet date/time across midnight and DST", () => {
    const b = calendarBackend(); b.calendars.a = [{...timed(), start: {dateTime: "2026-03-29T23:30:00-04:00"}, end: {dateTime: "2026-03-30T00:30:00-04:00"}}]; b.sync();
    const plan = parseAppsScriptSnapshot(b.post({action: "snapshot"})).plans[0];
    expect(plan).toMatchObject({date: "2026-03-30", start: "07:30", end: "08:30", minutes: 60});
  });
  it("reads actual dropdown rules and refuses cancellation status without changing the row", () => {
    const b = calendarBackend(); b.calendars.a = [timed()]; b.sheets.plan.validations.set("2:6", ["Другое"]); b.sync();
    expect(b.sheets.plan.cells[1][5]).toBe("Другое");
    b.sheets.plan.validations.set("2:11", ["Запланировано"]); b.calendars.a = [{id: "event-1", status: "cancelled"}];
    const before = b.sheets.plan.writes.length;
    expect(b.sync()).toMatchObject({ok: false, error: {code: "VALIDATION"}});
    expect(b.sheets.plan.writes.length).toBe(before);
  });
  it("access failure on a selected calendar makes no writes or false cancellations", () => {
    const b = calendarBackend(); b.calendars.a = [timed()];
    expect(b.sync(["a", "forbidden"])).toMatchObject({ok: false, error: {code: "CALENDAR_ACCESS"}});
    expect(b.sheets.plan.writes).toEqual([]);
    expect(b.sheets.activity.writes).toEqual([]);
  });
  it("Calendar Plan still supports existing Plan → Fact mutation", () => {
    const b = calendarBackend(); b.calendars.a = [timed()]; b.sync();
    const plan = parseAppsScriptSnapshot(b.post({action: "snapshot"})).plans[0];
    expect(b.post({action: "create", entity: "activity", data: planToFact(plan)})).toMatchObject({ok: true, id: "ACT-001"});
    const snapshot = parseAppsScriptSnapshot(b.post({action: "snapshot"}));
    expect(snapshot.activities[0]).toMatchObject({planId: "PLAN-001", start: "10:30", end: "11:45"});
  });
});

it("manifest grants Calendar readonly only and mapping rejects offset-free times", () => {
  const manifest = JSON.parse(readFileSync("apps-script/appsscript.json", "utf8"));
  expect(manifest.oauthScopes.filter((scope: string) => scope.includes("/calendar"))).toEqual(["https://www.googleapis.com/auth/calendar.readonly"]);
  const b = calendarBackend();
  b.calendars.a = [{...timed(), start: {dateTime: "2026-10-08T10:30:00"}}];
  expect(b.sync()).toMatchObject({ok: false, error: {code: "CALENDAR_DATA"}});
  expect(b.sheets.plan.writes).toEqual([]);
});
