import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { bypass, configured } from "./auth";
afterEach(() => vi.unstubAllEnvs());
it("allows passwordless access in production or preview when either auth variable is absent", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "production");
  for (const [password, secret] of [
    ["", ""],
    ["password", ""],
    ["", "long-session-secret-for-future-use"],
  ]) {
    vi.stubEnv("APP_PASSWORD", password);
    vi.stubEnv("SESSION_SECRET", secret);
    expect(bypass()).toBe(true);
  }
  vi.stubEnv("APP_PASSWORD", "password");
  vi.stubEnv("SESSION_SECRET", "long-session-secret-for-future-use");
  expect(bypass()).toBe(false);
  expect(configured()).toBe(true);
});
