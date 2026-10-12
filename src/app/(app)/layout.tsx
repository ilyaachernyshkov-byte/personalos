import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Перейти к содержимому</a>
      <Sidebar />
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-brand">Personal OS<small>Личная система управления</small></span>
          <span className="topbar-user">
            <span className="dot" />
            Ваш рабочий день
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
