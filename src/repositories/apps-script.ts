import "server-only";
import type { PersonalOsRepository } from "@/types/domain";
import { parseAppsScriptSnapshot } from "@/schemas/apps-script-parser";

export const appsScriptRepository: PersonalOsRepository = {
  mode: "google",
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
