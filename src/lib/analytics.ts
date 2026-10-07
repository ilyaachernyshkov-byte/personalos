import type { Activity, PlanItem, Project } from "@/types/domain";
import { shiftDate } from "./dates";
export function aggregate(
  plans: PlanItem[],
  activities: Activity[],
  from: string,
  to: string,
) {
  const days = [];
  for (let date = from; date <= to; date = shiftDate(date, 1)) {
    const p = plans.filter((x) => x.date === date),
      a = activities.filter((x) => x.date === date);
    const plan = p.reduce((s, x) => s + x.minutes, 0),
      fact = a.reduce((s, x) => s + x.minutes, 0),
      unplanned = a.filter((x) => !x.planId).reduce((s, x) => s + x.minutes, 0);
    days.push({ date, plan, fact, unplanned, deviation: fact - plan });
  }
  const totals = days.reduce(
    (s, d) => ({
      plan: s.plan + d.plan,
      fact: s.fact + d.fact,
      unplanned: s.unplanned + d.unplanned,
    }),
    { plan: 0, fact: 0, unplanned: 0 },
  );
  const selected = activities.filter((a) => a.date >= from && a.date <= to);
  const group = (key: "project" | "type") =>
    Object.entries(
      selected.reduce<Record<string, number>>((s, a) => {
        const k = a[key] || "Без проекта";
        s[k] = (s[k] || 0) + a.minutes;
        return s;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
  return {
    days,
    ...totals,
    completion: totals.plan
      ? ((totals.fact - totals.unplanned) / totals.plan) * 100
      : 0,
    unplannedPercent: totals.fact ? (totals.unplanned / totals.fact) * 100 : 0,
    projects: group("project"),
    types: group("type"),
  };
}
export function activeProject(p: Project) {
  return !["Готово", "Завершён", "Завершен", "Отменён", "Архив"].includes(
    p.status,
  );
}
export function sortProjects(projects: Project[]) {
  return [...projects].sort(
    (a, b) =>
      Number(b.health === "Красный") - Number(a.health === "Красный") ||
      Number(b.priority === "P1") - Number(a.priority === "P1") ||
      (a.deadline || "9999").localeCompare(b.deadline || "9999"),
  );
}
