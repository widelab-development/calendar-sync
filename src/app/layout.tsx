import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji",
  ],
});

export const metadata: Metadata = {
  title: "Calendar Sync",
  description:
    "Aplikacja do synchronizacji kalendarza Pirxey i Widelab z autentykacją Google",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${firaSans.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
