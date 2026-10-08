"use client";
import { TaskActions } from "@/features/mutations";
import { useState } from "react";
import type { Project, Task } from "@/types/domain";
import { ProjectCard, Empty, Badge } from "@/components/shared";
import { displayDate, shiftDate } from "@/lib/dates";
import { sortProjects } from "@/lib/analytics";
function Filter({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="filter-label">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Все</option>
        {[...new Set(values.filter(Boolean))].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function ProjectsList({ projects }: { projects: Project[] }) {
  const [filters, set] = useState<Record<string, string>>({});
  const fields = [
    ["status", "Статус"],
    ["priority", "Приоритет"],
    ["health", "Здоровье"],
    ["direction", "Направление"],
  ] as const;
  const filtered = sortProjects(
    projects.filter((p) =>
      fields.every(([key]) => !filters[key] || p[key] === filters[key]),
    ),
  );
  return (
    <>
      <div className="filters">
        {fields.map(([key, label]) => (
          <Filter
            key={key}
            label={label}
            values={projects.map((p) => p[key])}
            value={filters[key] || ""}
            onChange={(v) => set({ ...filters, [key]: v })}
          />
        ))}
      </div>
      <div className="project-grid">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      {!filtered.length && <Empty text="По выбранным фильтрам проектов нет" />}
    </>
  );
}
export function TasksList({ tasks, date }: { tasks: Task[]; date: string }) {
  const [quick, setQuick] = useState("Все");
  const [filters, set] = useState<Record<string, string>>({});
  const fields = [
    ["project", "Проект"],
    ["type", "Тип"],
    ["status", "Статус"],
    ["priority", "Приоритет"],
    ["owner", "Ответственный"],
  ] as const;
  const filtered = tasks.filter(
    (t) =>
      fields.every(([key]) => !filters[key] || t[key] === filters[key]) &&
      (quick === "Все" ||
        (quick === "Сегодня" && t.plannedDate === date) ||
        (quick === "Завтра" && t.plannedDate === shiftDate(date, 1)) ||
        (quick === "Просрочено" &&
          !!t.deadline &&
          t.deadline < date &&
          !["Готово", "Отменено", "Отменён"].includes(t.status)) ||
        (quick === "P1" && t.priority === "P1") ||
        t.status === quick),
  );
  return (
    <>
      <div className="quick-filters">
        {[
          "Все",
          "Сегодня",
          "Завтра",
          "Просрочено",
          "P1",
          "В работе",
          "Ожидание",
          "Готово",
        ].map((q) => (
          <button
            key={q}
            className={q === quick ? "selected" : ""}
            onClick={() => setQuick(q)}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="filters">
        {fields.map(([key, label]) => (
          <Filter
            key={key}
            label={label}
            values={tasks.map((t) => t[key])}
            value={filters[key] || ""}
            onChange={(v) => set({ ...filters, [key]: v })}
          />
        ))}
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Задача",
                "Проект",
                "Этап",
                "Статус",
                "Приоритет",
                "Плановая дата",
                "Дедлайн",
                "Ответственный",
                "Действия",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                  <small>{t.id}</small>
                </td>
                <td>{t.project || "—"}</td>
                <td>{t.milestone || "—"}</td>
                <td>
                  <Badge tone={t.status === "Готово" ? "green" : "neutral"}>
                    {t.status}
                  </Badge>
                </td>
                <td>
                  <Badge tone={t.priority === "P1" ? "purple" : "neutral"}>
                    {t.priority}
                  </Badge>
                </td>
                <td>{displayDate(t.plannedDate)}</td>
                <td
                  className={
                    t.deadline < date && t.status !== "Готово"
                      ? "error-text"
                      : ""
                  }
                >
                  {displayDate(t.deadline)}
                </td>
                <td>{t.owner || "—"}</td>
                <td>
                  <TaskActions task={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <Empty text="Задач по выбранным фильтрам нет" />}
      </div>
    </>
  );
}
