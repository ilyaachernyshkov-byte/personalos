import { MutationProvider, CreateButton } from "@/features/mutations";
import { getSnapshot } from "@/repositories";
import { today, displayDate, shiftDate, minutes } from "@/lib/dates";
import { aggregate, activeProject, sortProjects } from "@/lib/analytics";
import { Kpis, ProjectCard, Empty, Badge } from "@/components/shared";
import { PageHead } from "@/components/page-head";
import Link from "next/link";
export default async function Dashboard() {
  const { data: d, mode } = await getSnapshot();
  const date = today(),
    projects = sortProjects(d.projects.filter(activeProject));
  const tasks = d.tasks.filter((t) => t.plannedDate === date),
    open = d.tasks.filter(
      (t) => !["Готово", "Отменено", "Отменён"].includes(t.status),
    );
  const overdue = open.filter((t) => t.deadline && t.deadline < date);
  const a = aggregate(d.plans, d.activities, date, date);
  const attention = [
    ...projects
      .filter((p) => p.health === "Красный" || p.blocker)
      .map((p) => ({
        id: p.id,
        name: p.name,
        detail: p.blocker || "Красный проект",
        href: `/projects/${p.id}`,
      })),
    ...open
      .filter(
        (t) => t.blocker || (t.deadline && t.deadline <= shiftDate(date, 1)),
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        detail:
          t.blocker ||
          (t.deadline < date ? "Просрочено" : "Дедлайн сегодня / завтра"),
        href: "/tasks",
      })),
  ];
  return (
    <MutationProvider data={d} date={today()}>
      <PageHead
        title="Дашборд"
        subtitle={`Обзор проектов и рабочего дня · ${displayDate(date)}`}
        mode={mode}
      />
      <div className="mutation-toolbar">
        <CreateButton entity="activity" label="+ Записать факт" />
      </div>
      <Kpis
        items={[
          ["Активные проекты", projects.length],
          ["P1 проекты", projects.filter((p) => p.priority === "P1").length],
          [
            "Красные проекты",
            projects.filter((p) => p.health === "Красный").length,
          ],
          ["Задачи сегодня", tasks.length],
          ["Просроченные задачи", overdue.length],
          ["Внеплан сегодня", minutes(a.unplanned)],
        ]}
      />
      <section className="today-panel">
        <div>
          <div className="eyebrow">СЕГОДНЯ</div>
          <h2>Ваш день в цифрах</h2>
          <Link href="/plan-fact">Открыть План / Факт →</Link>
        </div>
        <Kpis
          items={[
            ["Плановое время", minutes(a.plan)],
            ["Фактическое время", minutes(a.fact)],
            ["Внеплановое время", minutes(a.unplanned)],
            [
              "Выполнено задач",
              `${tasks.filter((t) => t.status === "Готово").length} / ${tasks.length}`,
            ],
          ]}
        />
      </section>
      <div className="section-head">
        <h2>
          Проекты <span>{projects.length}</span>
        </h2>
        <Link href="/projects">Все проекты →</Link>
      </div>
      <div className="project-grid">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      {!projects.length && <Empty text="Нет активных проектов" />}
      <div className="section-head">
        <h2>Требует внимания</h2>
        <Badge tone="amber">{attention.length}</Badge>
      </div>
      <section className="panel attention">
        {attention.map((x) => (
          <Link href={x.href} key={x.id}>
            <span className="attention-dot" />
            <strong>{x.name}</strong>
            <span>{x.detail}</span>
          </Link>
        ))}
        {!attention.length && <Empty text="Всё под контролем" />}
      </section>
    </MutationProvider>
  );
}
