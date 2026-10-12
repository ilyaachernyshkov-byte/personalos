import Link from "next/link";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import type { Project } from "@/types/domain";
import { displayDate } from "@/lib/dates";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Health({ value }: { value: string }) {
  return (
    <Badge
      tone={
        (
          {
            Зелёный: "green",
            Жёлтый: "amber",
            Красный: "red",
            Серый: "neutral",
          } as Record<string, string>
        )[value] || "neutral"
      }
    >
      <span className="dot" />
      {value || "Не задано"}
    </Badge>
  );
}
export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
export function Kpis({ items }: { items: [string, string | number][] }) {
  return (
    <div className={items.length > 6 ? "kpis kpis-many" : "kpis"}>
      {items.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
    </div>
  );
}
export function ProgressBar({ value, label = "Прогресс проекта" }: { value: number; label?: string }) {
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
export function Empty({ text = "Данных пока нет" }: { text?: string }) {
  return (
    <div className="empty">
      <AlertCircle size={24} />
      <p>{text}</p>
    </div>
  );
}
export function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link href={`/projects/${p.id}`} className="project-card">
      <div className="card-top">
        <Badge tone={p.priority === "P1" ? "purple" : "neutral"}>
          {p.priority}
        </Badge>
        <span>{p.direction}</span>
        <ArrowUpRight size={17} />
      </div>
      <h3>{p.name}</h3>
      <div className="progress-label">
        <span>{p.status}</span>
        <strong>{p.progress}%</strong>
      </div>
      <ProgressBar value={p.progress} />
      <dl>
        <div>
          <dt>Текущая точка</dt>
          <dd>{p.current || "—"}</dd>
        </div>
        <div>
          <dt>Следующий шаг</dt>
          <dd>{p.nextStep || p.next || "—"}</dd>
        </div>
      </dl>
      {p.blocker && (
        <p className="blocker">
          <AlertCircle size={14} />
          {p.blocker}
        </p>
      )}
      <footer>
        <span>До {displayDate(p.deadline)}</span>
        <Health value={p.health} />
      </footer>
    </Link>
  );
}
