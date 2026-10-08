"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Snapshot } from "@/types/domain";
import { aggregate } from "@/lib/analytics";
import { shiftDate, dateToSerial, displayDate, minutes } from "@/lib/dates";
import { Kpis, Empty } from "@/components/shared";
const COLORS = ["#7563cf", "#53a99c", "#e7b862", "#90a3b5", "#cf7c8b"];
export function Analytics({ data, today }: { data: Snapshot; today: string }) {
  const [period, setPeriod] = useState("7 дней");
  const weekday = new Date(
    dateToSerial(today) * 86400000 + Date.UTC(1899, 11, 30),
  ).getUTCDay();
  const from =
    period === "Сегодня"
      ? today
      : period === "Эта неделя"
        ? shiftDate(today, -((weekday + 6) % 7))
        : period === "Этот месяц"
          ? today.slice(0, 8) + "01"
          : shiftDate(today, period === "30 дней" ? -29 : -6);
  const a = aggregate(data.plans, data.activities, from, today);
  const type = (...names: string[]) =>
    minutes(
      a.types
        .filter((t) => names.includes(t.name))
        .reduce((sum, t) => sum + t.value, 0),
    );
  const split = [
    { name: "Плановая", value: a.fact - a.unplanned },
    { name: "Внеплановая", value: a.unplanned },
  ].filter((x) => x.value > 0);
  function breakdown(
    title: string,
    rows: { name: string; value: number }[],
    pie = false,
  ) {
    return (
      <section className="panel chart-panel">
        <h2>{title}</h2>
        {!rows.length ? (
          <Empty text="За этот период записей Факта нет" />
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              {pie ? (
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={rows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {rows.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} мин`} />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart
                  data={rows}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(v) => `${v} мин`} />
                  <Bar
                    isAnimationActive={false}
                    dataKey="value"
                    name="Факт, мин"
                    fill="#7563cf"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </section>
    );
  }
  return (
    <>
      <div className="quick-filters">
        {["Сегодня", "7 дней", "Эта неделя", "30 дней", "Этот месяц"].map(
          (p) => (
            <button
              key={p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <p className="period-label">
        {displayDate(from)} — {displayDate(today)}
      </p>
      <Kpis
        items={[
          ["Плановое время", minutes(a.plan)],
          ["Фактическое время", minutes(a.fact)],
          ["Выполнение плана", `${Math.round(a.completion)}%`],
          ["Внеплановое время", `${Math.round(a.unplannedPercent)}%`],
          ["Проектная работа", type("Проектная работа")],
          ["Встречи", type("Встреча", "Встречи")],
          ["Операционка", type("Операционка")],
          ["Процессы", type("Процесс", "Процессы")],
        ]}
      />
      <div className="charts-grid">
        <section className="panel chart-panel">
          <h2>План vs Факт по дням</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => displayDate(v).slice(0, 5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(v) => displayDate(String(v))}
                  formatter={(v) => `${v} мин`}
                />
                <Legend />
                <Bar
                  isAnimationActive={false}
                  dataKey="plan"
                  name="План"
                  fill="#d7d0f0"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="fact"
                  name="Факт"
                  fill="#7563cf"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!a.fact && !a.plan && (
            <p className="muted">За этот период данных нет</p>
          )}
        </section>
        {breakdown("Плановая vs внеплановая работа", split, true)}
        {breakdown("Время по проектам", a.projects)}
        {breakdown("Время по типам активности", a.types, true)}
      </div>
      <h2>Дневная сводка</h2>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {["Дата", "План", "Факт", "Внеплан", "Отклонение"].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {a.days.map((d) => (
              <tr key={d.date}>
                <td>{displayDate(d.date)}</td>
                <td>{minutes(d.plan)}</td>
                <td>{minutes(d.fact)}</td>
                <td>{minutes(d.unplanned)}</td>
                <td>
                  {d.deviation > 0 ? "+" : ""}
                  {d.deviation} мин
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Выполнение плана = плановый Факт / План. Реальное время учитывается
        только по таймлогу.
      </p>
    </>
  );
}
