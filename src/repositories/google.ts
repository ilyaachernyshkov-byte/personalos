import "server-only";
import { google } from "googleapis";
import type { PersonalOsRepository } from "@/types/domain";
import { parseSheets, ranges } from "@/schemas/sheet-parsers";
export const googleRepository: PersonalOsRepository = {
  mode: "google",
  async read() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    try {
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: process.env.PERSONAL_OS_SPREADSHEET_ID,
        ranges,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      });
      return parseSheets(
        (response.data.valueRanges || []).map((r) => r.values || []),
      );
    } catch {
      throw new Error(
        "Не удалось прочитать Google Sheets. Проверьте ENV, доступ Service Account и структуру листов.",
      );
    }
  },
};
