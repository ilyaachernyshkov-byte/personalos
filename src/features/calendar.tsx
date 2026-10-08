"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncCalendarAction } from "@/app/actions/calendar";
import { Button } from "@/components/ui/button";
export function CalendarSettings({ configured, count, lastSuccess, error }: { configured: boolean; count: number; lastSuccess: string | null; error: string | null }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  return <section className="panel">
    <h2>Google Calendar</h2>
    <p>{configured ? "Настроен" : "Не настроен"} · Выбрано календарей: {count}</p>
    <p>Последняя успешная синхронизация: {lastSuccess || "ещё не выполнялась"} (UTC)</p>
    <p>События импортируются в План. Факт записывается вручную.</p>
    {error && <p role="alert">{error}</p>}
    <Button disabled={!configured || pending} onClick={() => startTransition(async () => {
      setMessage("");
      const result = await syncCalendarAction();
      setFailed(!result.ok);
      if (result.ok) {
        const counts = result.data.result;
        setMessage(`Создано: ${counts.created} · Обновлено: ${counts.updated} · Отменено: ${counts.canceled} · Пропущено: ${counts.skipped}`);
      } else setMessage(result.error);
      router.refresh();
    })}>{pending ? "Синхронизация…" : "Синхронизировать календарь"}</Button>
    {message && <p role={failed ? "alert" : "status"}>{message}</p>}
  </section>;
}
