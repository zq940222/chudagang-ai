/**
 * Minimal root layout — the real layout lives in [locale]/layout.tsx.
 * This file exists only to satisfy Next.js's requirement for a root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
