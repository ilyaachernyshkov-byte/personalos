import { today } from "@/lib/dates";
import { MutationProvider, CreateButton } from "@/features/mutations";
import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { ProjectsList } from "@/features/filtered-lists";
export default async function Projects() {
  const { data, mode } = await getSnapshot();
  return (
    <MutationProvider data={data} date={today()}>
      <PageHead
        title="Проекты"
        subtitle="Цели, контрольные точки и следующие шаги"
        mode={mode}
      />
      <div className="mutation-toolbar">
        <CreateButton entity="project" label="+ Новый проект" />
      </div>
      <ProjectsList projects={data.projects} />
    </MutationProvider>
  );
}
