"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Snapshot, Task, PlanItem, Process } from "@/types/domain";
import {
  editableData,
  elapsedMinutes,
  mutationSchema,
  planToFact,
  processToFact,
  taskToFact,
  validateMutation,
  type Entity,
  type WriteData,
} from "@/schemas/mutations";
import { saveMutation } from "@/app/actions/mutations";
import { Button } from "@/components/ui/button";

type Editor = {
  entity: Entity;
  id?: string;
  initial?: WriteData;
  title: string;
  fields?: string[];
  confirmation?: string;
};
const MutationContext = createContext<{
  open: (editor: Editor) => void;
  date: string;
} | null>(null);
function useMutations() {
  const value = useContext(MutationContext);
  if (!value) throw new Error("MutationProvider missing");
  return value;
}
const labels: Record<string, string> = {
  name: "Название",
  direction: "Направление",
  status: "Статус",
  priority: "Приоритет",
  current: "Текущая точка",
  next: "Следующая точка",
  start: "Дата старта",
  deadline: "Дедлайн",
  blocker: "Блокер",
  nextStep: "Следующий шаг",
  notes: "Заметки",
  projectId: "Проект",
  order: "Порядок",
  checkpoint: "checkpoint_%",
  plannedDate: "Плановая дата",
  completedDate: "Дата завершения / выполнения",
  criteria: "Критерий готовности",
  result: "Результат",
  type: "Тип",
  processId: "Процесс",
  milestoneId: "Этап",
  plannedMinutes: "План_мин",
  owner: "Ответственный",
  category: "Категория",
  frequency: "Периодичность",
  rule: "Правило/дни",
  time: "Время",
  active: "Активен",
  nextDate: "Следующее выполнение",
  date: "Дата",
  end: "Конец",
  minutes: "Минуты",
  sourceId: "source_id",
  taskId: "Задача",
  planId: "План",
};
const entityTitles: Record<Entity, string> = {
  project: "проект",
  milestone: "этап",
  task: "задачу",
  process: "процесс",
  plan: "план",
  activity: "факт",
};
const numeric = ["minutes", "plannedMinutes", "order", "checkpoint"];
const dates = [
  "date",
  "start",
  "deadline",
  "plannedDate",
  "completedDate",
  "nextDate",
];
const hidden = ["project", "process", "milestone", "lastDate"];
const defaults: Partial<Record<Entity, WriteData>> = {
  project: { status: "В работе", priority: "P2" },
  milestone: { status: "В работе", order: 1, checkpoint: 0 },
  task: { status: "Новая", priority: "P2", type: "Задача", plannedMinutes: 0 },
  process: { active: true, plannedMinutes: 0, frequency: "Еженедельно" },
  plan: { status: "Запланировано", minutes: 0, type: "Задача" },
  activity: { minutes: 0, type: "Проектная работа" },
};
export function MutationProvider({
  data,
  date,
  children,
}: {
  data: Snapshot;
  date: string;
  children: ReactNode;
}) {
  const [editor, setEditor] = useState<Editor>();
  const [success, setSuccess] = useState("");
  return (
    <MutationContext.Provider
      value={{
        date,
        open: (e) => {
          setSuccess("");
          setEditor(e);
        },
      }}
    >
      {success && (
        <div role="status" className="mutation-success">
          {success}
          <button
            aria-label="Закрыть уведомление"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}
      {children}
      {editor && (
        <MutationDialog
          data={data}
          editor={editor}
          date={date}
          close={() => setEditor(undefined)}
          saved={() => {
            setEditor(undefined);
            setSuccess("Сохранено в Google Sheets");
          }}
        />
      )}
    </MutationContext.Provider>
  );
}
function MutationDialog({
  data,
  editor,
  date,
  close,
  saved,
}: {
  data: Snapshot;
  editor: Editor;
  date: string;
  close: () => void;
  saved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<WriteData>(() => ({
    ...defaults[editor.entity],
    ...(["activity", "plan"].includes(editor.entity) ? { date } : {}),
    ...editor.initial,
  }));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const fields =
    editor.fields ??
    Object.keys(mutationSchema(editor.entity).shape).filter(
      (f) => !hidden.includes(f),
    );
  function change(field: string, value: string | number | boolean) {
    const next = { ...values, [field]: value };
    if (field === "projectId") {
      for (const link of [
        "milestoneId",
        "taskId",
        "processId",
        "planId",
        "sourceId",
      ])
        if (link in next) next[link] = "";
    }
    if (
      ["start", "end"].includes(field) &&
      ["plan", "activity"].includes(editor.entity)
    ) {
      const minutes = elapsedMinutes(
        String(next.start || ""),
        String(next.end || ""),
      );
      if (minutes !== undefined) next.minutes = minutes;
    }
    setValues(next);
  }
  const related: Record<
    string,
    { id: string; name: string; projectId?: string }[]
  > = {
    projectId: data.projects,
    processId: data.processes,
    milestoneId: data.milestones,
    taskId: data.tasks,
    planId: data.plans,
    sourceId: [
      ...data.tasks,
      ...data.processes,
      ...data.projects,
      ...data.milestones,
    ],
  };
  return (
    <dialog
      ref={ref}
      className="mutation-dialog"
      aria-labelledby="mutation-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const submitted = editor.fields
            ? (Object.fromEntries(
                editor.fields.map((f) => [f, values[f] ?? ""]),
              ) as WriteData)
            : values;
          try {
            validateMutation(editor.entity, submitted, data, !editor.id);
          } catch (error) {
            setError(error instanceof Error ? error.message : "Проверьте поля");
            return;
          }
          startTransition(async () => {
            try {
              const result = await saveMutation({
                entity: editor.entity,
                action: editor.id ? "update" : "create",
                ...(editor.id ? { id: editor.id } : {}),
                data: submitted,
              });
              if (!result.ok) setError(result.error);
              else saved();
            } catch {
              setError(
                "Ответ не получен. Проверьте таблицу перед повторной записью.",
              );
            }
          });
        }}
      >
        <div className="section-head">
          <h2 id="mutation-title">{editor.title}</h2>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
            aria-label="Закрыть форму"
          >
            ×
          </Button>
        </div>
        {editor.confirmation && (
          <p className="confirmation-text">{editor.confirmation}</p>
        )}
        <fieldset disabled={pending} className="mutation-fields">
          {fields.map((field) => {
            const isTime =
              field === "time" ||
              (["plan", "activity"].includes(editor.entity) &&
                ["start", "end"].includes(field));
            const type = numeric.includes(field)
              ? "number"
              : isTime
                ? "time"
                : dates.includes(field)
                  ? "date"
                  : "text";
            let options =
              field === "priority"
                ? ["P1", "P2", "P3", "P4"]
                : field === "status"
                  ? editor.entity === "project"
                    ? ["В работе", "Ожидание", "Завершено", "Отменено"]
                    : [
                        "Новая",
                        "Запланировано",
                        "В работе",
                        "Ожидание",
                        "Готово",
                        "Отменено",
                      ]
                  : undefined;
            if (
              options &&
              values[field] &&
              !options.includes(String(values[field]))
            )
              options = [...options, String(values[field])];
            const required =
              field === "name" ||
              (["plan", "activity"].includes(editor.entity) &&
                field === "date") ||
              (editor.entity === "milestone" && field === "projectId");
            const fieldLabel =
              field === "start" && isTime
                ? "Начало"
                : field === "minutes"
                  ? editor.entity === "activity"
                    ? "Факт_мин"
                    : "План_мин"
                  : labels[field] || field;
            return (
              <label
                key={field}
                className={
                  field === "notes" || field === "result" ? "wide" : ""
                }
              >
                {fieldLabel}
                {required ? " *" : ""}
                {field === "active" ? (
                  <select
                    aria-label={fieldLabel}
                    value={values.active === false ? "false" : "true"}
                    onChange={(e) => change(field, e.target.value === "true")}
                  >
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                ) : related[field] ? (
                  <select
                    aria-label={fieldLabel}
                    required={required}
                    value={String(values[field] ?? "")}
                    onChange={(e) => change(field, e.target.value)}
                  >
                    <option value="">Без связи</option>
                    {related[field]
                      .filter(
                        (row) =>
                          field === "projectId" ||
                          !row.projectId ||
                          row.projectId === values.projectId,
                      )
                      .map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name} · {row.id}
                        </option>
                      ))}
                  </select>
                ) : options ? (
                  <select
                    aria-label={fieldLabel}
                    value={String(values[field] || "")}
                    onChange={(e) => change(field, e.target.value)}
                  >
                    <option value="">Выберите</option>
                    {options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : [
                    "notes",
                    "result",
                    "criteria",
                    "blocker",
                    "nextStep",
                  ].includes(field) ? (
                  <textarea
                    aria-label={fieldLabel}
                    rows={2}
                    value={String(values[field] ?? "")}
                    onChange={(e) => change(field, e.target.value)}
                  />
                ) : (
                  <input
                    aria-label={fieldLabel}
                    required={required}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    max={field === "checkpoint" ? 100 : undefined}
                    step={type === "number" ? "any" : undefined}
                    value={String(values[field] ?? "")}
                    onChange={(e) =>
                      change(
                        field,
                        type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </label>
            );
          })}
        </fieldset>
        {["plan", "activity"].includes(editor.entity) && !editor.fields && (
          <p className="muted">
            Начало и конец предлагают минуты автоматически. Их можно
            скорректировать вручную; конец раньше начала означает переход через
            полночь.
          </p>
        )}
        {editor.entity === "activity" && (
          <p className="muted">
            {values.planId ? "Плановая работа" : "Внеплановая работа"} · запись
            Факта не завершает задачу.
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="mutation-footer">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
export function CreateButton({
  entity,
  initial = {},
  label,
}: {
  entity: Entity;
  initial?: WriteData;
  label?: string;
}) {
  const { open } = useMutations();
  const title = label ?? `+ Добавить ${entityTitles[entity]}`;
  return (
    <Button onClick={() => open({ entity, initial, title })}>{title}</Button>
  );
}
export function EditButton({
  entity,
  row,
  label = "Редактировать",
}: {
  entity: Entity;
  row: { id: string };
  label?: string;
}) {
  const { open } = useMutations();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() =>
        open({
          entity,
          id: row.id,
          initial: editableData(entity, row),
          title: `Редактировать ${entityTitles[entity]}`,
        })
      }
    >
      {label}
    </Button>
  );
}
export function TaskActions({ task }: { task: Task }) {
  const { open, date } = useMutations();
  return (
    <div className="row-actions">
      <EditButton entity="task" row={task} />
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          open({
            entity: "activity",
            title: "Записать факт",
            initial: taskToFact(task, date),
          })
        }
      >
        Записать факт
      </Button>
      {!["Готово", "Отменено"].includes(task.status) && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              open({
                entity: "task",
                id: task.id,
                title: "Завершить задачу",
                initial: {
                  status: "Готово",
                  completedDate: date,
                  result: task.result,
                },
                fields: ["status", "completedDate", "result"],
                confirmation: "Завершение задачи не записывает рабочее время.",
              })
            }
          >
            Завершить
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              open({
                entity: "task",
                id: task.id,
                title: "Отменить задачу",
                initial: { status: "Отменено" },
                fields: ["status"],
                confirmation: `Подтвердите отмену задачи «${task.name}».`,
              })
            }
          >
            Отменить
          </Button>
        </>
      )}
    </div>
  );
}
export function PlanActions({ plan }: { plan: PlanItem }) {
  const { open } = useMutations();
  return (
    <div className="row-actions">
      <EditButton entity="plan" row={plan} />
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          open({
            entity: "activity",
            title: "Записать факт по плану",
            initial: planToFact(plan),
          })
        }
      >
        Записать факт
      </Button>
    </div>
  );
}
export function ProcessActions({ process }: { process: Process }) {
  const { open, date } = useMutations();
  return (
    <div className="row-actions">
      <EditButton entity="process" row={process} />
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          open({
            entity: "process",
            id: process.id,
            title: process.active
              ? "Деактивировать процесс"
              : "Активировать процесс",
            initial: { active: !process.active },
            fields: ["active"],
            confirmation: `Подтвердите изменение активности процесса «${process.name}».`,
          })
        }
      >
        {process.active ? "Деактивировать" : "Активировать"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          open({
            entity: "activity",
            title: "Записать выполнение",
            initial: processToFact(process, date),
          })
        }
      >
        Записать выполнение
      </Button>
    </div>
  );
}
