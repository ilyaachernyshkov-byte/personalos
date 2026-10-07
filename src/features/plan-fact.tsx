"use client";
import { CreateButton, EditButton, PlanActions } from "@/features/mutations";
import { useState } from "react";
import type { Snapshot } from "@/types/domain";
import { shiftDate, isIsoDate, minutes } from "@/lib/dates";
import { aggregate } from "@/lib/analytics";
import { Kpis, Badge, Empty } from "@/components/shared";
import { Button } from "@/components/ui/button";
export function PlanFact({ data, today }: { data: Snapshot; today: string }) {
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState("");
  const plans = data.plans
    .filter((p) => p.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
  const activities = data.activities
    .filter((a) => a.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
  const a = aggregate(plans, activities, date, date);
  return (
    <>
      <div className="date-toolbar">
        <Button
          variant="outline"
          aria-label="Предыдущий день"
          onClick={() => setDate(shiftDate(date, -1))}
        >
          ←
        </Button>
        <input
          aria-label="Дата"
          type="date"
          value={date}
          onChange={(e) => {
            if (isIsoDate(e.target.value)) setDate(e.target.value);
          }}
        />
        <Button variant="outline" onClick={() => setDate(today)}>
          Сегодня
        </Button>
        <Button
          variant="outline"
          aria-label="Следующий день"
          onClick={() => setDate(shiftDate(date, 1))}
        >
          →
        </Button>
      </div>
      <div className="mutation-toolbar">
        <CreateButton
          entity="plan"
          initial={{ date }}
          label="+ Добавить в план"
        />
        <CreateButton
          entity="activity"
          initial={{ date }}
          label="+ Записать факт"
        />
      </div>
      <Kpis
        items={[
          ["План", minutes(a.plan)],
          ["Факт", minutes(a.fact)],
          [
            "Отклонение",
            `${a.fact - a.plan > 0 ? "+" : ""}${a.fact - a.plan} мин`,
          ],
          ["Внеплан", minutes(a.unplanned)],
        ]}
      />
      <div className="plan-columns">
        <section>
          <div className="section-head">
            <h2>План</h2>
            <Badge>{plans.length} записей</Badge>
          </div>
          <div className="panel schedule">
            {plans.map((p) => (
              <article
                key={p.id}
                className={`schedule-item ${selected === p.id ? "linked" : ""}`}
              >
                <div className="schedule-time">
                  {p.start || "—"}
                  <small>{p.end}</small>
                </div>
                <div>
                  <h3>
                    <button
                      className="text-button"
                      onClick={() => setSelected(selected === p.id ? "" : p.id)}
                    >
                      {p.name}
                    </button>
                  </h3>
                  <p>{p.project || "Без проекта"}</p>
                  <div className="chips">
                    <Badge>{p.type}</Badge>
                    <Badge>{p.status}</Badge>
                    <span>{p.minutes} мин</span>
                  </div>
                  <small>
                    Связанных записей Факта:{" "}
                    {activities.filter((a) => a.planId === p.id).length}
                  </small>
                  <PlanActions plan={p} />
                </div>
              </article>
            ))}
            {!plans.length && (
              <Empty text="На этот день ничего не запланировано" />
            )}
          </div>
        </section>
        <section>
          <div className="section-head">
            <h2>Факт</h2>
            <Badge>{activities.length} записей</Badge>
          </div>
          <div className="panel schedule">
            {activities.map((x) => (
              <article
                key={x.id}
                className={`schedule-item ${selected && x.planId === selected ? "linked" : ""}`}
              >
                <div className="schedule-time">
                  {x.start || "—"}
                  <small>{x.end}</small>
                </div>
                <div>
                  <h3>{x.name}</h3>
                  <p>{x.project || "Без проекта"}</p>
                  <div className="chips">
                    <Badge>{x.type}</Badge>
                    <Badge tone={x.planId ? "green" : "amber"}>
                      {x.classification}
                    </Badge>
                    <span>{x.minutes} мин</span>
                  </div>
                  {x.planId && (
                    <button
                      className="text-button"
                      onClick={() => setSelected(x.planId)}
                    >
                      ↳{" "}
                      {data.plans.find((p) => p.id === x.planId)?.name ||
                        x.planId}
                    </button>
                  )}
                  <p className="result">{x.result || "Результат не указан"}</p>
                  <EditButton entity="activity" row={x} />
                </div>
              </article>
            ))}
            {!activities.length && (
              <Empty text="Записей Факта на этот день нет" />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
