import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const cookieName = "personalos_session";
export function bypass() {
  return !process.env.APP_PASSWORD || !process.env.SESSION_SECRET;
}
export function configured() {
  return Boolean(
    process.env.APP_PASSWORD &&
    process.env.SESSION_SECRET &&
    process.env.SESSION_SECRET.length >= 32,
  );
}
const sign = (value: string) =>
  createHmac("sha256", process.env.SESSION_SECRET!)
    .update(value)
    .digest("base64url");
export function verify(token: string) {
  if (!configured()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = parts.slice(0, 2).join(".");
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(parts[2]);
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received) &&
    Number(parts[0]) > Date.now() &&
    Number(parts[0]) <= Date.now() + 7 * 86400000
  );
}
export async function requireAuth() {
  if (bypass()) return;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !verify(token)) redirect("/login");
}
export async function createSession() {
  const payload = `${Date.now() + 7 * 86400000}.${randomBytes(16).toString("hex")}`;
  (await cookies()).set(cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function clearSession() {
  (await cookies()).delete(cookieName);
}
export function passwordMatches(value: string) {
  const expected = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(process.env.APP_PASSWORD!)
    .digest();
  const received = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(value)
    .digest();
  return timingSafeEqual(expected, received);
}
