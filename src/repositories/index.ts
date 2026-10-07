import "server-only";
import { cache } from "react";
import { requireAuth } from "@/lib/auth";
import { demoRepository } from "./demo";
import { googleRepository } from "./google";
export function repository() {
  const values = [
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    process.env.GOOGLE_PRIVATE_KEY,
    process.env.PERSONAL_OS_SPREADSHEET_ID,
  ];
  if (values.every(Boolean)) return googleRepository;
  if (values.some(Boolean))
    throw new Error(
      "Google Sheets настроен частично. Заполните все три ENV подключения.",
    );
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview"
  )
    return demoRepository;
  throw new Error(
    "Google Sheets не подключён. Production требует настройки ENV.",
  );
}
export const getSnapshot = cache(async () => {
  await requireAuth();
  const repo = repository();
  return { data: await repo.read(), mode: repo.mode };
});
