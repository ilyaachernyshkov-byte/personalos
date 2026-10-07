import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { TasksList } from "@/features/filtered-lists";
import { today } from "@/lib/dates";
export default async function Tasks() {
  const { data, mode } = await getSnapshot();
  return (
    <>
      <PageHead
        title="Задачи"
        subtitle="Конкретные действия, которые двигают работу вперёд"
        mode={mode}
      />
      <TasksList tasks={data.tasks} date={today()} />
    </>
  );
}
