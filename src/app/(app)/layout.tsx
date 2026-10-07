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
      <Sidebar />
      <div className="workspace">
        <header className="topbar">
          <span>Личная система управления</span>
          <span className="topbar-user">
            <span className="dot" />
            Ваш рабочий день
          </span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
