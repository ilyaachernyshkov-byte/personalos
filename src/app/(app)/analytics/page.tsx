import { getSnapshot } from "@/repositories";
import { PageHead } from "@/components/page-head";
import { Analytics } from "@/features/analytics";
import { today } from "@/lib/dates";
export default async function Page() {
  const { data, mode } = await getSnapshot();
  return (
    <>
      <PageHead
        title="Аналитика"
        subtitle="Реальная картина рабочего времени из таймлога"
        mode={mode}
      />
      <Analytics data={data} today={today()} />
    </>
  );
}
