import { CalendarSettings } from "@/features/calendar";
import { calendarConfig, calendarLastSuccess } from "@/repositories/calendar";
import { PageHead } from "@/components/page-head";
import { configured, bypass } from "@/lib/auth";
import { requireAuth } from "@/lib/auth";
import { repository } from "@/repositories";
export default async function Settings() {
  await requireAuth();
  const apiConfigured = Boolean(
    process.env.PERSONAL_OS_API_URL && process.env.PERSONAL_OS_API_SECRET,
  );
  const serviceAccount = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.PERSONAL_OS_SPREADSHEET_ID,
  );
  let connected = false,
    demo = false;
  try {
    const repo = repository();
    demo = repo.mode === "demo";
    await repo.read();
    connected = apiConfigured;
  } catch {
    /* Render connection error even when snapshot fails. */
  }
  let calendar = { configured: false, count: 0, lastSuccess: null as string | null, error: null as string | null };
  try {
    const config = calendarConfig();
    calendar = { ...calendar, configured: config.configured, count: config.calendarIds.length };
    if (config.configured) calendar.lastSuccess = await calendarLastSuccess();
  } catch (error) {
    calendar.error = error instanceof Error ? error.message : "Calendar недоступен";
  }
  return (
    <>
      <PageHead
        title="Настройки"
        subtitle="Подключение и защита личного пространства"
      />
      <section className="panel">
        <h2>Подключение и доступ</h2>
        <dl className="detail-fields">
          <div>
            <dt>Основное подключение</dt>
            <dd>Google Apps Script — {connected ? "подключено" : "ошибка"}</dd>
          </div>
          <div>
            <dt>Google Sheets</dt>
            <dd>Personal OS</dd>
          </div>
          <div>
            <dt>Demo mode</dt>
            <dd>{demo ? "включён" : "выключен"}</dd>
          </div>
          <div>
            <dt>Service Account</dt>
            <dd>{serviceAccount ? "резервный adapter" : "не настроен"}</dd>
          </div>
          <div>
            <dt>Авторизация</dt>
            <dd>
              {bypass()
                ? "Доступ без пароля"
                : configured()
                  ? "Защита паролем включена"
                  : "Проверьте настройки авторизации"}
            </dd>
          </div>
          <div>
            <dt>Часовой пояс</dt>
            <dd>{process.env.APP_TIMEZONE || "UTC"}</dd>
          </div>
        </dl>
      </section>
      <CalendarSettings {...calendar} />
    </>
  );
}
