import { z } from "zod";
import { isIsoDate, timeToFraction } from "@/lib/dates";
import type { Snapshot, Task, PlanItem, Process } from "@/types/domain";

// Column order is the existing workbook contract; null entries are formulas.
export const entityConfig = {
  project: {
    sheet: "Проекты",
    prefix: "PRJ",
    fields: [
      "id",
      "name",
      "direction",
      "status",
      "priority",
      null,
      "current",
      "next",
      "start",
      "deadline",
      null,
      null,
      null,
      "blocker",
      "nextStep",
      "notes",
      "createdAt",
      "updatedAt",
    ],
  },
  milestone: {
    sheet: "Этапы",
    prefix: "MS",
    fields: [
      "id",
      "projectId",
      "project",
      "order",
      "name",
      "checkpoint",
      "status",
      "plannedDate",
      "completedDate",
      "criteria",
      "result",
      "notes",
    ],
  },
  task: {
    sheet: "Задачи",
    prefix: "TSK",
    fields: [
      "id",
      "name",
      "type",
      "projectId",
      "project",
      "processId",
      "process",
      "milestoneId",
      "milestone",
      "status",
      "priority",
      "plannedDate",
      "plannedMinutes",
      "deadline",
      "completedDate",
      "source",
      "owner",
      "result",
      "blocker",
      "notes",
      "createdAt",
      "updatedAt",
    ],
  },
  process: {
    sheet: "Процессы",
    prefix: "PROC",
    fields: [
      "id",
      "name",
      "category",
      "frequency",
      "rule",
      "time",
      "plannedMinutes",
      "active",
      "projectId",
      "project",
      "nextDate",
      "lastDate",
      "source",
      "notes",
      "createdAt",
      "updatedAt",
    ],
  },
  plan: {
    sheet: "План",
    prefix: "PLAN",
    fields: [
      "id",
      "date",
      "start",
      "end",
      "minutes",
      "type",
      "sourceId",
      "name",
      "projectId",
      "project",
      "status",
      null,
      null,
      "source",
      "calendarId",
      "calendarEventId",
      "notes",
      "createdAt",
      "updatedAt",
    ],
  },
  activity: {
    sheet: "Факт",
    prefix: "ACT",
    fields: [
      "id",
      "date",
      "start",
      "end",
      "minutes",
      "type",
      "name",
      "projectId",
      "project",
      "taskId",
      "processId",
      "planId",
      null,
      "result",
      "nextStep",
      "blocker",
      "source",
      "notes",
      "createdAt",
    ],
  },
} as const;
export type Entity = keyof typeof entityConfig;
export type WriteData = Record<string, string | number | boolean>;
export const dateFields = [
  "date",
  "start",
  "deadline",
  "plannedDate",
  "completedDate",
  "nextDate",
  "lastDate",
];
export const timeFields = ["time"];
const text = z.string().trim().max(10000);
const date = text.refine((v) => !v || isIsoDate(v), "Введите корректную дату");
const time = text.refine(
  (v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
  "Введите время HH:mm",
);
const number = z.number().finite().min(0, "Значение должно быть ≥ 0");
export function mutationSchema(entity: Entity) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of entityConfig[entity].fields) {
    if (
      !field ||
      [
        "id",
        "createdAt",
        "updatedAt",
        "source",
        "calendarId",
        "calendarEventId",
        "lastDate",
      ].includes(field)
    )
      continue;
    let schema: z.ZodType = text;
    if (dateFields.includes(field)) schema = date;
    if (
      field === "time" ||
      ((entity === "plan" || entity === "activity") &&
        ["start", "end"].includes(field))
    )
      schema = time;
    if (["minutes", "plannedMinutes", "order"].includes(field)) schema = number;
    if (field === "checkpoint")
      schema = number.max(100, "Checkpoint должен быть ≤ 100");
    if (field === "active") schema = z.boolean();
    if (field === "name") schema = text.min(1, "Укажите название");
    if ((entity === "activity" || entity === "plan") && field === "date")
      schema = date.refine(Boolean, "Укажите дату");
    if (entity === "milestone" && field === "projectId")
      schema = text.min(1, "Выберите проект");
    shape[field] = schema.optional();
  }
  return z.object(shape).strict();
}
export function validateMutation(
  entity: Entity,
  input: unknown,
  snapshot: Snapshot,
  create: boolean,
): WriteData {
  const data = mutationSchema(entity).parse(input) as WriteData;
  if (create && !data.name) throw new Error("Укажите название");
  if (create && ["activity", "plan"].includes(entity) && !data.date)
    throw new Error("Укажите дату");
  if (entity === "milestone" && !data.projectId)
    throw new Error("Выберите проект");
  const links = {
    projectId: snapshot.projects,
    processId: snapshot.processes,
    milestoneId: snapshot.milestones,
    taskId: snapshot.tasks,
    planId: snapshot.plans,
  };
  for (const [key, rows] of Object.entries(links)) {
    if (!data[key]) continue;
    const linked = rows.find((r) => r.id === data[key]);
    if (!linked) throw new Error(`Связь ${key} больше не существует`);
    const nameField = {
      projectId: "project",
      processId: "process",
      milestoneId: "milestone",
    }[key];
    if (nameField && entityConfig[entity].fields.some((f) => f === nameField))
      data[nameField] = linked.name;
    if (
      "projectId" in linked &&
      linked.projectId &&
      linked.projectId !== data.projectId
    )
      throw new Error("Связанная запись относится к другому проекту");
  }
  if ("projectId" in data && !data.projectId) data.project = "";
  if ("processId" in data && !data.processId && entity === "task")
    data.process = "";
  if ("milestoneId" in data && !data.milestoneId && entity === "task")
    data.milestone = "";
  if (
    entity === "project" &&
    data.start &&
    data.deadline &&
    data.deadline < data.start
  )
    throw new Error("Дедлайн раньше даты старта");
  if (
    entity === "task" &&
    data.plannedDate &&
    data.deadline &&
    data.deadline < data.plannedDate
  )
    throw new Error("Дедлайн раньше плановой даты");
  if (
    data.sourceId &&
    ![
      ...snapshot.tasks,
      ...snapshot.processes,
      ...snapshot.projects,
      ...snapshot.milestones,
    ].some((r) => r.id === data.sourceId)
  )
    throw new Error("source_id не существует");
  return data;
}
export function editableData(entity: Entity, row: object): WriteData {
  const allowed = Object.keys(mutationSchema(entity).shape);
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => allowed.includes(key)),
  ) as WriteData;
}
export function taskToFact(task: Task, date: string): WriteData {
  return {
    taskId: task.id,
    projectId: task.projectId,
    processId: task.processId,
    name: task.name,
    date,
    type: task.type,
    minutes: 0,
  };
}
export function planToFact(plan: PlanItem): WriteData {
  return {
    planId: plan.id,
    projectId: plan.projectId,
    name: plan.name,
    date: plan.date,
    type: plan.type,
    start: plan.start,
    end: plan.end,
    minutes: plan.minutes,
  };
}
export function processToFact(process: Process, date: string): WriteData {
  return {
    processId: process.id,
    projectId: process.projectId,
    name: process.name,
    date,
    type: "Процессы",
    start: process.time,
    minutes: process.plannedMinutes,
  };
}
export function elapsedMinutes(start: string, end: string): number | undefined {
  if (!start || !end) return;
  // An earlier end means work crossed midnight.
  return Math.round(
    ((timeToFraction(end) - timeToFraction(start) + 1) % 1) * 1440,
  );
}
