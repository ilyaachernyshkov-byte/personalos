import { login } from "./actions";
import { bypass } from "@/lib/auth";
import Link from "next/link";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand-mark">P</div>
        <h1>PERSONAL OS</h1>
        <p>Ваши проекты. Ваше время. Ваш фокус.</p>
        <form action={login}>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={1024}
          />
          <button type="submit">Войти</button>
        </form>
        {error && (
          <p role="alert" className="error-text">
            {error === "setup"
              ? "Настройте APP_PASSWORD и SESSION_SECRET (32+ символа)."
              : error === "limit"
                ? "Слишком много попыток. Повторите через минуту."
                : "Неверный пароль"}
          </p>
        )}
        {bypass() && <Link href="/">Открыть демо без пароля →</Link>}
      </div>
    </main>
  );
}
