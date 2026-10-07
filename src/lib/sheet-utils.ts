export function nextId(ids: string[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = ids.reduce((n, id) => {
    const m = id.match(pattern);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
// rows excludes the header; formulas in other columns do not affect allocation.
export function firstEmptyIdRow(rows: unknown[][]): number {
  const index = rows.findIndex((row) => !String(row[0] ?? "").trim());
  return (index < 0 ? rows.length : index) + 2;
}
export function classify(planId: string): "План" | "Внеплан" {
  return planId.trim() ? "План" : "Внеплан";
}
