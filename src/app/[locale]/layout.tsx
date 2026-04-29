import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChuDaGang AI — AI-Powered Developer Marketplace",
    template: "%s | ChuDaGang AI",
  },
  description:
    "Tell our AI what you need. We'll match you with vetted developers, handle contracts, and manage payments.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--color-surface-container-lowest)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                },
              }}
            />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
