import { z } from "zod";
import type { Snapshot } from "@/types/domain";
import { parseDate, parseTime } from "@/lib/dates";
import { classify } from "@/lib/sheet-utils";
const s = (v: unknown) => String(v ?? "").trim();
const n = (v: unknown) => {
  if (v === undefined || v === "") return 0;
  const parsed = Number(String(v).replace(",", ".").replace("%", ""));
  return z.number().finite().parse(parsed);
};
export const ranges = [
  "'Проекты'!A2:R",
  "'Этапы'!A2:L",
  "'Задачи'!A2:V",
  "'Процессы'!A2:P",
  "'План'!A2:S",
  "'Факт'!A2:S",
];
export function parseSheets(sheets: unknown[][][]): Snapshot {
  return {
    projects: (sheets[0] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        name: s(r[1]),
        direction: s(r[2]),
        status: s(r[3]),
        priority: s(r[4]),
        progress: n(r[5]),
        current: s(r[6]),
        next: s(r[7]),
        start: parseDate(r[8]),
        deadline: parseDate(r[9]),
        lastActivity: parseDate(r[10]),
        idleDays: n(r[11]),
        health: s(r[12]),
        blocker: s(r[13]),
        nextStep: s(r[14]),
        notes: s(r[15]),
        createdAt: s(r[16]),
        updatedAt: s(r[17]),
      })),
    milestones: (sheets[1] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        projectId: s(r[1]),
        project: s(r[2]),
        order: n(r[3]),
        name: s(r[4]),
        checkpoint: n(r[5]),
        status: s(r[6]),
        plannedDate: parseDate(r[7]),
        completedDate: parseDate(r[8]),
        criteria: s(r[9]),
        result: s(r[10]),
        notes: s(r[11]),
      })),
    tasks: (sheets[2] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        name: s(r[1]),
        type: s(r[2]),
        projectId: s(r[3]),
        project: s(r[4]),
        processId: s(r[5]),
        process: s(r[6]),
        milestoneId: s(r[7]),
        milestone: s(r[8]),
        status: s(r[9]),
        priority: s(r[10]),
        plannedDate: parseDate(r[11]),
        plannedMinutes: n(r[12]),
        deadline: parseDate(r[13]),
        completedDate: parseDate(r[14]),
        source: s(r[15]),
        owner: s(r[16]),
        result: s(r[17]),
        blocker: s(r[18]),
        notes: s(r[19]),
        createdAt: s(r[20]),
        updatedAt: s(r[21]),
      })),
    processes: (sheets[3] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        name: s(r[1]),
        category: s(r[2]),
        frequency: s(r[3]),
        rule: s(r[4]),
        time: s(r[5]),
        plannedMinutes: n(r[6]),
        active: ["true", "да", "1", "истина"].includes(s(r[7]).toLowerCase()),
        projectId: s(r[8]),
        project: s(r[9]),
        nextDate: parseDate(r[10]),
        lastDate: parseDate(r[11]),
        source: s(r[12]),
        notes: s(r[13]),
        createdAt: s(r[14]),
        updatedAt: s(r[15]),
      })),
    plans: (sheets[4] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        date: parseDate(r[1]),
        start: parseTime(r[2]),
        end: parseTime(r[3]),
        minutes: n(r[4]),
        type: s(r[5]),
        sourceId: s(r[6]),
        name: s(r[7]),
        projectId: s(r[8]),
        project: s(r[9]),
        status: s(r[10]),
        actualMinutes: n(r[11]),
        deviation: n(r[12]),
        source: s(r[13]),
        calendarId: s(r[14]),
        calendarEventId: s(r[15]),
        notes: s(r[16]),
        createdAt: s(r[17]),
        updatedAt: s(r[18]),
      })),
    activities: (sheets[5] || [])
      .filter((r) => s(r[0]))
      .map((r) => ({
        id: s(r[0]),
        date: parseDate(r[1]),
        start: parseTime(r[2]),
        end: parseTime(r[3]),
        minutes: n(r[4]),
        type: s(r[5]),
        name: s(r[6]),
        projectId: s(r[7]),
        project: s(r[8]),
        taskId: s(r[9]),
        processId: s(r[10]),
        planId: s(r[11]),
        classification: classify(s(r[11])),
        result: s(r[13]),
        nextStep: s(r[14]),
        blocker: s(r[15]),
        source: s(r[16]),
        notes: s(r[17]),
        createdAt: s(r[18]),
      })),
  };
}
