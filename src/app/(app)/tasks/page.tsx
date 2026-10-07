import { MutationProvider, CreateButton } from "@/features/mutations";
import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { TasksList } from "@/features/filtered-lists";
import { today } from "@/lib/dates";
export default async function Tasks() {
  const { data, mode } = await getSnapshot();
  return (
    <MutationProvider data={data} date={today()}>
      <PageHead
        title="Задачи"
        subtitle="Конкретные действия, которые двигают работу вперёд"
        mode={mode}
      />
      <div className="mutation-toolbar">
        <CreateButton entity="task" label="+ Новая задача" />
        <CreateButton entity="activity" label="+ Записать факт" />
      </div>
      <TasksList tasks={data.tasks} date={today()} />
    </MutationProvider>
  );
}
