const DAY = 86400000;
const EPOCH = Date.UTC(1899, 11, 30);
export function serialToDate(serial: number): string {
  if (!Number.isFinite(serial)) throw new Error("Некорректная дата");
  return new Date(EPOCH + Math.floor(serial) * DAY).toISOString().slice(0, 10);
}
export function dateToSerial(date: string): number {
  if (!isIsoDate(date)) throw new Error("Некорректная дата");
  return (Date.parse(date + "T00:00:00Z") - EPOCH) / DAY;
}
export function isIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function parseDate(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return serialToDate(value);
  const s = String(value).trim();
  if (isIsoDate(s.slice(0, 10))) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    if (isIsoDate(d)) return d;
  }
  throw new Error("Некорректная дата в Google Sheets");
}
export function fractionToTime(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error("Некорректное время");
  const min = Math.round(value * 1440) % 1440;
  return `${Math.floor(min / 60)
    .toString()
    .padStart(2, "0")}:${(min % 60).toString().padStart(2, "0")}`;
}
export function timeToFraction(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new Error("Некорректное время");
  const [h, m] = value.split(":").map(Number);
  return (h * 60 + m) / 1440;
}
export function parseTime(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return fractionToTime(value);
  const s = String(value);
  timeToFraction(s);
  return s;
}
export function displayDate(value: string): string {
  return value ? value.split("-").reverse().join(".") : "—";
}
export function today(timezone = process.env.APP_TIMEZONE || "UTC"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function shiftDate(value: string, days: number): string {
  return serialToDate(dateToSerial(value) + days);
}
export function minutes(value: number): string {
  return `${Math.floor(value / 60)} ч ${Math.round(value % 60)} мин`;
}
