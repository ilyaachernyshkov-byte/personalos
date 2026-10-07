import { z } from "zod";
import { parseSheets } from "./sheet-parsers";

const columns: Record<string, string[]> = {
  "Проекты": [
    "project_id",
    "Название проекта",
    "Направление",
    "Статус",
    "Приоритет",
    "Прогресс_%",
    "Текущая точка",
    "Следующая точка",
    "Дата старта",
    "Дедлайн",
    "Последняя активность",
    "Дней без движения",
    "Здоровье",
    "Блокер",
    "Следующий шаг",
    "Заметки",
    "created_at",
    "updated_at"
  ],
  "Этапы": [
    "milestone_id",
    "project_id",
    "Проект",
    "Порядок",
    "Этап",
    "checkpoint_%",
    "Статус",
    "Плановая дата",
    "Дата завершения",
    "Критерий готовности",
    "Результат",
    "Заметки"
  ],
  "Задачи": [
    "task_id",
    "Задача",
    "Тип",
    "project_id",
    "Проект",
    "process_id",
    "Процесс",
    "milestone_id",
    "Этап",
    "Статус",
    "Приоритет",
    "Плановая дата",
    "План_мин",
    "Дедлайн",
    "Дата выполнения",
    "Источник",
    "Ответственный",
    "Результат",
    "Блокер",
    "Заметки",
    "created_at",
    "updated_at"
  ],
  "Процессы": [
    "process_id",
    "Процесс",
    "Категория",
    "Периодичность",
    "Правило/дни",
    "Время",
    "План_мин",
    "Активен",
    "project_id",
    "Проект",
    "Следующее выполнение",
    "Последнее выполнение",
    "Источник",
    "Заметки",
    "created_at",
    "updated_at"
  ],
  "План": [
    "plan_id",
    "Дата",
    "Начало",
    "Конец",
    "План_мин",
    "Тип",
    "source_id",
    "Название",
    "project_id",
    "Проект",
    "Статус",
    "Факт_мин",
    "Отклонение_мин",
    "Источник",
    "calendar_id",
    "calendar_event_id",
    "Заметки",
    "created_at",
    "updated_at"
  ],
  "Факт": [
    "activity_id",
    "Дата",
    "Начало",
    "Конец",
    "Факт_мин",
    "Тип активности",
    "Название",
    "project_id",
    "Проект",
    "task_id",
    "process_id",
    "plan_id",
    "План/внеплан",
    "Результат",
    "Следующий шаг",
    "Блокер",
    "Источник",
    "Заметки",
    "created_at"
  ]
};

export function parseAppsScriptSnapshot(value: unknown) {
  const response = z.object({
    ok: z.literal(true),
    data: z.record(z.string(), z.unknown()),
  }).parse(value);
  const sheets = Object.entries(columns).map(([name, headers]) => {
    const rows = z.array(z.record(z.string(), z.unknown()))
      .parse(response.data[name]);
    return rows.map((row) => headers.map((header) => {
        const cell = row[header];
        // Apps Script serializes Sheets time cells as ISO dates in 1899.
        if (
          ["Время", "Начало", "Конец"].includes(header) &&
          typeof cell === "string" &&
          /^1899-12-30T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cell)
        ) return cell.slice(11, 16);
        return cell;
      }));
  });
  return parseSheets(sheets);
}
