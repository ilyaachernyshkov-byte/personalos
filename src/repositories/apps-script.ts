import "server-only";
import { z } from "zod";
import { entityConfig } from "@/schemas/mutations";
import type { PersonalOsRepository } from "@/types/domain";
import { parseAppsScriptSnapshot } from "@/schemas/apps-script-parser";

export const appsScriptRepository: PersonalOsRepository = {
  mode: "google",
  async mutate(request) {
    let response: Response;
    try {
      response = await fetch(process.env.PERSONAL_OS_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          secret: process.env.PERSONAL_OS_API_SECRET,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
      });
    } catch {
      throw new Error(
        "Ответ записи не получен. Проверьте таблицу перед повтором — запись могла сохраниться.",
      );
    }
    if (!response.ok)
      throw new Error(
        "Apps Script недоступен. Проверьте таблицу перед повторной записью.",
      );
    const body: unknown = await response.json();
    const result = z
      .object({
        ok: z.literal(true),
        apiVersion: z.literal(2),
        id: z
          .string()
          .regex(
            new RegExp(`^${entityConfig[request.entity].prefix}-\\d{3,}$`),
          ),
      })
      .safeParse(body);
    if (!result.success) {
      const error = z
        .object({
          ok: z.literal(false),
          error: z.object({ code: z.string(), message: z.string() }),
        })
        .safeParse(body);
      const known = [
        "VALIDATION",
        "INVALID_LINK",
        "NOT_FOUND",
        "BUSY",
        "NO_FREE_ROW",
        "FORMULA_PROTECTED",
        "INVALID_HEADERS",
      ];
      if (error.success && known.includes(error.data.error.code))
        throw new Error(error.data.error.message);
      throw new Error(
        "Запись не подтверждена. Обновите deployment файлом apps-script/Code.gs и проверьте таблицу перед повтором.",
      );
    }
    return { id: result.data.id };
  },
  async read() {
    try {
      const response = await fetch(process.env.PERSONAL_OS_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snapshot",
          secret: process.env.PERSONAL_OS_API_SECRET,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error("HTTP error");
      return parseAppsScriptSnapshot(await response.json());
    } catch {
      throw new Error(
        "Не удалось прочитать Apps Script snapshot. Проверьте ENV, доступ API и структуру шести листов.",
      );
    }
  },
};
