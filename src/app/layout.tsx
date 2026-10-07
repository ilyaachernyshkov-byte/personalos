import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "PERSONAL OS",
  description: "Персональная система проектов, задач и времени",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
