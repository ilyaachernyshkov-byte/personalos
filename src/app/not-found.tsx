import Link from "next/link";
export default function NotFound() {
  return (
    <main className="panel">
      <h1>Страница не найдена</h1>
      <Link href="/">На дашборд →</Link>
    </main>
  );
}
