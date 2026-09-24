import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} – Free ATS CV Checker`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Check how your CV matches a job description with an ATS-style score, skill gaps, and practical suggestions.",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
