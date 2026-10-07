import {
  MutationProvider,
  CreateButton,
  ProcessActions,
} from "@/features/mutations";
import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { Badge, Empty } from "@/components/shared";
import { displayDate, today } from "@/lib/dates";
export default async function Processes() {
  const { data, mode } = await getSnapshot();
  return (
    <MutationProvider data={data} date={today()}>
      <PageHead
        title="Процессы"
        subtitle="Шаблоны регулярной работы — без бесконечного списка задач"
        mode={mode}
      />
      <div className="mutation-toolbar">
        <CreateButton entity="process" label="+ Новый процесс" />
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Процесс",
                "Категория",
                "Периодичность",
                "Правило",
                "Время",
                "План, мин",
                "Следующее",
                "Последнее",
                "Активен",
                "Действия",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.processes.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>{p.notes}</small>
                </td>
                <td>{p.category}</td>
                <td>{p.frequency}</td>
                <td>{p.rule}</td>
                <td>{p.time || "—"}</td>
                <td>{p.plannedMinutes}</td>
                <td>{displayDate(p.nextDate)}</td>
                <td>{displayDate(p.lastDate)}</td>
                <td>
                  <Badge tone={p.active ? "green" : "neutral"}>
                    {p.active ? "Да" : "Нет"}
                  </Badge>
                </td>
                <td>
                  <ProcessActions process={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.processes.length && (
          <Empty text="Регулярных процессов пока нет" />
        )}
      </div>
    </MutationProvider>
  );
}
