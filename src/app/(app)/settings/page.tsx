import { PageHead } from "@/components/page-head";
import { configured, bypass } from "@/lib/auth";
export default function Settings() {
  const connected = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.PERSONAL_OS_SPREADSHEET_ID,
  );
  return (
    <>
      <PageHead
        title="Настройки"
        subtitle="Подключение и защита личного пространства"
      />
      <section className="panel">
        <h2>Google Sheets</h2>
        <p>
          {connected
            ? "ENV подключения заполнены. Доступ проверяется при чтении данных."
            : "Google Sheets не подключён. Настройте три переменные подключения."}
        </p>
        <p>
          GOOGLE_SERVICE_ACCOUNT_EMAIL · GOOGLE_PRIVATE_KEY ·
          PERSONAL_OS_SPREADSHEET_ID
        </p>
        <h2>Авторизация</h2>
        <p>
          {bypass()
            ? "Демо-доступ без пароля"
            : configured()
              ? "Защита паролем включена"
              : "Требуется APP_PASSWORD и SESSION_SECRET (32+ символа)"}
        </p>
        <h2>Часовой пояс</h2>
        <p>{process.env.APP_TIMEZONE || "UTC"} · APP_TIMEZONE</p>
        <p className="muted">
          Секреты задаются в environment variables. Инструкция:
          docs/GOOGLE_SETUP.md в репозитории.
        </p>
      </section>
    </>
  );
}
