"use server";
import { redirect } from "next/navigation";
import {
  configured,
  createSession,
  passwordMatches,
  clearSession,
} from "@/lib/auth";
// Single-instance best-effort throttle; production review may add a shared rate limiter.
const attempts = new Map<string, { count: number; until: number }>();
export async function login(form: FormData) {
  if (!configured()) redirect("/login?error=setup");
  const key = "single-user";
  const now = Date.now();
  const state = attempts.get(key);
  if (state && state.until > now && state.count >= 5)
    redirect("/login?error=limit");
  const password = String(form.get("password") || "");
  if (password.length > 1024 || !passwordMatches(password)) {
    const current =
      state && state.until > now ? state : { count: 0, until: now + 60000 };
    current.count++;
    attempts.set(key, current);
    redirect("/login?error=password");
  }
  attempts.delete(key);
  await createSession();
  redirect("/");
}
export async function logout() {
  await clearSession();
  redirect("/login");
}
