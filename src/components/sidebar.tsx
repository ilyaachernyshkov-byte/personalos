"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Repeat2,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/login/actions";
const links = [
  ["/", "Дашборд", LayoutDashboard],
  ["/projects", "Проекты", FolderKanban],
  ["/tasks", "Задачи", ListTodo],
  ["/processes", "Процессы", Repeat2],
  ["/plan-fact", "План / Факт", CalendarDays],
  ["/analytics", "Аналитика", ChartNoAxesCombined],
] as const;
export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">P</span>
        <span>
          PERSONAL OS<small>Рабочее пространство</small>
        </span>
      </Link>
      <div className="nav-label">УПРАВЛЕНИЕ</div>
      <nav>
        {links.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={
              (href === "/" ? path === "/" : path.startsWith(href))
                ? "active"
                : ""
            }
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <Link className="mobile-only" href="/settings">
          <Settings size={16} />
          Настройки
        </Link>
        <form className="mobile-only" action={logout}>
          <button className="logout">
            <LogOut size={16} />
            Выйти
          </button>
        </form>
      </nav>
      <div className="sidebar-bottom">
        <Link href="/settings">
          <Settings size={18} />
          Настройки
        </Link>
        <form action={logout}>
          <button className="logout">
            <LogOut size={17} />
            Выйти
          </button>
        </form>
        <div className="profile">
          <span>Я</span>
          <div>
            Личное пространство<small>Один пользователь</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
