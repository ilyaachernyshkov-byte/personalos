/* Recharts accepts CSS variables; keep the palette in globals.css. */
export const chartTheme = {
  primary: "var(--chart-primary)",
  secondary: "var(--chart-secondary)",
  palette: ["var(--chart-primary)", "var(--chart-secondary)", "var(--chart-dark)", "var(--chart-neutral)", "var(--info)"],
  grid: "var(--chart-grid)",
  tick: { fill: "var(--text-secondary)", fontSize: 11 },
  tooltip: {
    background: "var(--surface)", border: "var(--card-border)", borderRadius: 12,
    boxShadow: "var(--shadow-overlay)", color: "var(--text-primary)", fontSize: 12,
  },
};
