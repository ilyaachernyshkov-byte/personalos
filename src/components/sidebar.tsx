"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, ListTodo, Repeat2,
  CalendarDays, ChartNoAxesCombined, Settings, LogOut,
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
  const settingsActive = path === "/settings";
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active) {
      nav.scrollLeft = Math.max(0, active.offsetLeft - nav.offsetLeft - (nav.clientWidth - active.clientWidth) / 2);
    }
  }, [path]);
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="Personal OS — Дашборд">
        <span className="brand-mark" aria-hidden="true">P</span>
      </Link>
      <nav ref={navRef} aria-label="Основная навигация">
        {links.map(([href, label, Icon]) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`} aria-label={label} aria-current={active ? "page" : undefined}>
            <Icon size={18} aria-hidden="true" />
            <span className="nav-tooltip" aria-hidden="true">{label}</span>
          </Link>;
        })}
        <Link className={`nav-link mobile-only ${settingsActive ? "active" : ""}`} href="/settings" aria-label="Настройки" aria-current={settingsActive ? "page" : undefined}>
          <Settings size={18} aria-hidden="true" /><span className="nav-tooltip" aria-hidden="true">Настройки</span>
        </Link>
        <form className="mobile-only" action={logout}>
          <button className="logout" aria-label="Выйти"><LogOut size={18} aria-hidden="true" /><span className="nav-tooltip" aria-hidden="true">Выйти</span></button>
        </form>
      </nav>
      <div className="sidebar-bottom">
        <Link href="/settings" className={`nav-link ${settingsActive ? "active" : ""}`} aria-label="Настройки" aria-current={settingsActive ? "page" : undefined}>
          <Settings size={18} aria-hidden="true" /><span className="nav-tooltip" aria-hidden="true">Настройки</span>
        </Link>
        <form action={logout}>
          <button className="logout" aria-label="Выйти"><LogOut size={18} aria-hidden="true" /><span className="nav-tooltip" aria-hidden="true">Выйти</span></button>
        </form>
        <div className="profile" title="Личное пространство">Я</div>
      </div>
    </aside>
  );
}
