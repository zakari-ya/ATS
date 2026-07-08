import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLink } from "@/components/shared/brand-link";

import { SectionShell, marketingSerifStyle } from "./section-shell";

type MarketingFooterProps = {
  userEmail?: string | null;
  userName?: string | null;
};

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#privacy", label: "Privacy" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "App",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/scan", label: "New scan" },
      { href: "/history", label: "History" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#privacy", label: "Privacy" },
      { href: "#privacy", label: "Terms" },
      { href: "#privacy", label: "Security" },
    ],
  },
];

export function MarketingFooter({ userEmail, userName }: MarketingFooterProps) {
  const isAuthenticated = Boolean(userEmail);
  const userLabel = userName || userEmail?.split("@")[0] || "Account";

  return (
    <SectionShell
      as="footer"
      className="bg-[#1f4d47] pb-8 pt-14 text-white sm:pt-16"
    >
      <div className="border-b border-white/12 pb-10 lg:pb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              className="text-balance text-[2.4rem] leading-[1.02] tracking-tight sm:text-[3rem]"
              style={marketingSerifStyle}
            >
              Check your CV before your next application.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              Run a job-specific match analysis and understand what your CV is
              missing before you send it.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <>
                <div className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm text-white/86">
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/16 text-[11px] font-medium text-white">
                    {userLabel
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="max-w-40 truncate">{userLabel}</span>
                </div>
                <Button
                  asChild
                  className="h-11 rounded-full bg-white px-6 text-sm font-medium text-[#1f4d47] hover:bg-white/92"
                >
                  <Link href="/dashboard">
                    Dashboard
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  className="h-11 rounded-full bg-white px-6 text-sm font-medium text-[#1f4d47] hover:bg-white/92"
                >
                  <Link href="/scan">
                    Start free scan
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-white/14 bg-white/8 px-6 text-sm text-white hover:bg-white/12"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-10 pt-10 lg:grid-cols-[1.15fr_1.85fr]">
        <div className="max-w-sm">
          <BrandLink href="/" variant="dark" className="text-[1.95rem]" />
          <p className="mt-4 text-sm leading-7 text-white/72">
            CVMatch provides ATS-style CV feedback. It does not make hiring
            decisions or guarantee job outcomes.
          </p>
          {isAuthenticated ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm text-white/86">
              <span className="size-2 rounded-full bg-[#a9c7c1]" aria-hidden="true" />
              Signed in as {userLabel}
            </p>
          ) : null}
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm uppercase tracking-[0.18em] text-white/52">
                {group.title}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/74">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    {/* TODO: Replace hash placeholders with legal pages in Step 25. */}
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!isAuthenticated ? (
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/52">
                Account
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/74">
                <li>
                  <Link
                    href="/login"
                    className="transition-colors hover:text-white"
                  >
                    Login
                  </Link>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}
