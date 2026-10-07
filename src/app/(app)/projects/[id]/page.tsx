import { getSnapshot } from "@/repositories";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { Badge, Health, Empty, Kpis } from "@/components/shared";
import { TasksList } from "@/features/filtered-lists";
import { displayDate, today, minutes } from "@/lib/dates";
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: d, mode } = await getSnapshot();
  const p = d.projects.find((p) => p.id === id);
  if (!p) notFound();
  const milestones = d.milestones
    .filter((m) => m.projectId === id)
    .sort((a, b) => a.order - b.order);
  const activities = d.activities
    .filter((a) => a.projectId === id)
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start),
    )
    .slice(0, 10);
  return (
    <>
      <Link href="/projects" className="back-link">
        ← Все проекты
      </Link>
      <PageHead title={p.name} subtitle={p.direction} mode={mode} />
      <div className="detail-status">
        <Badge>{p.status}</Badge>
        <Badge tone="purple">{p.priority}</Badge>
        <Health value={p.health} />
      </div>
      <Kpis
        items={[
          ["Прогресс", `${p.progress}%`],
          ["Дедлайн", displayDate(p.deadline)],
          ["Дней без движения", p.idleDays],
          ["Последняя активность", displayDate(p.lastActivity)],
        ]}
      />
      <div className="panel">
        <div className="progress">
          <span
            style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
          />
        </div>
        <dl className="detail-fields">
          {[
            ["Текущая точка", p.current],
            ["Следующая точка", p.next],
            ["Следующий шаг", p.nextStep],
            ["Блокер", p.blocker],
            ["Заметки", p.notes],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <h2>Контрольные точки</h2>
      <div className="panel timeline">
        {milestones.map((m) => (
          <article key={m.id}>
            <div
              className={`timeline-dot ${m.status === "Готово" ? "done" : ""}`}
            />
            <div>
              <div className="section-head">
                <h3>{m.name}</h3>
                <Badge>
                  {m.checkpoint}% · {m.status}
                </Badge>
              </div>
              <p>{m.criteria}</p>
              <small>
                План: {displayDate(m.plannedDate)} · Завершение:{" "}
                {displayDate(m.completedDate)}
              </small>
              {m.result && <p>Результат: {m.result}</p>}
              {m.notes && <p>{m.notes}</p>}
            </div>
          </article>
        ))}
        {!milestones.length && <Empty text="Контрольных точек пока нет" />}
      </div>
      <h2>Связанные задачи</h2>
      <TasksList
        tasks={d.tasks.filter((t) => t.projectId === id)}
        date={today()}
      />
      <h2>Последние записи Факта</h2>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Работа</th>
              <th>Время</th>
              <th>Тип</th>
              <th>Результат</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>{displayDate(a.date)}</td>
                <td>{a.name}</td>
                <td>{minutes(a.minutes)}</td>
                <td>
                  <Badge tone={a.planId ? "green" : "amber"}>
                    {a.classification}
                  </Badge>
                </td>
                <td>{a.result || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!activities.length && <Empty text="Таймлог проекта пуст" />}
      </div>
    </>
  );
}
