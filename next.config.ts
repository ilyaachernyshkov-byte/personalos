import type { NextConfig } from "next";
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.APP_PASSWORD || !process.env.SESSION_SECRET)
)
  console.warn(
    "PERSONAL OS: production требует APP_PASSWORD и SESSION_SECRET (минимум 32 символа). Доступ будет закрыт.",
  );
const config: NextConfig = { poweredByHeader: false };
export default config;
