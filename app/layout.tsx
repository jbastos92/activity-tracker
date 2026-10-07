import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { TimeZoneCookie } from "@/components/time-zone-cookie";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Activity Tracker", template: "%s - Activity Tracker" },
  description: "Pomodoro work time, habits and exercise tracking",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TimeZoneCookie />
          <PomodoroProvider>
            <SiteHeader />
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
              {children}
            </main>
          </PomodoroProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
