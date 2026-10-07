import { MutationProvider } from "@/features/mutations";
import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { PlanFact } from "@/features/plan-fact";
import { today } from "@/lib/dates";
export default async function Page() {
  const { data, mode } = await getSnapshot();
  return (
    <MutationProvider data={data} date={today()}>
      <PageHead
        title="План / Факт"
        subtitle="Что планировалось и что произошло на самом деле"
        mode={mode}
      />
      <PlanFact data={data} today={today()} />
    </MutationProvider>
  );
}
