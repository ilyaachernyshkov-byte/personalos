"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="panel">
      <h1>Не удалось загрузить данные</h1>
      <p>
        Проверьте подключение Google Sheets, ENV и доступ Service Account. Если
        Google временно недоступен, повторите попытку.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </section>
  );
}
