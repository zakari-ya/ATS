import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS CV Checker",
  description: "Private ATS-style CV match analysis for job applications.",
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
