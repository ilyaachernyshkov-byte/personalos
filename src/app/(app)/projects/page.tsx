import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { ProjectsList } from "@/features/filtered-lists";
export default async function Projects() {
  const { data, mode } = await getSnapshot();
  return (
    <>
      <PageHead
        title="Проекты"
        subtitle="Цели, контрольные точки и следующие шаги"
        mode={mode}
      />
      <ProjectsList projects={data.projects} />
    </>
  );
}
