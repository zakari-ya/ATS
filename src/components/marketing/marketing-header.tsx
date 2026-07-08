"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLink } from "@/components/shared/brand-link";
import { cn } from "@/lib/utils";

import { SectionShell } from "./section-shell";

const navItems = [
  { href: "/", label: "Home" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
];

type MarketingHeaderProps = {
  userEmail?: string | null;
  userName?: string | null;
};

export function MarketingHeader({ userEmail, userName }: MarketingHeaderProps) {
  const [hideMobileAction, setHideMobileAction] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const isAuthenticated = Boolean(userEmail);

  useEffect(() => {
    function updateHeaderState() {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollYRef.current;

      if (Math.abs(scrollDelta) > 8) {
        setHideMobileAction(nextScrollY > 72 && scrollDelta > 0);
        lastScrollYRef.current = nextScrollY;
      }

      tickingRef.current = false;
    }

    function handleScroll() {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateHeaderState);
        tickingRef.current = true;
      }
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const displayLabel = userName || userEmail?.split("@")[0] || "Account";

  return (
    <SectionShell
      as="header"
      className="relative z-30 py-5"
    >
      <div className="flex items-center justify-between gap-4">
        <BrandLink
          href="/"
          markSrc="/logo_cvmatch_bgNO.png"
          withContainer={false}
          className="text-[1.35rem] sm:text-xl"
          markClassName="size-9 sm:size-12"
        />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-10 text-sm text-[#365a54] lg:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#1f4d47]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex h-11 max-w-64 items-center gap-2 rounded-full border border-[#1f4d47]/12 bg-white/70 px-3 text-sm text-[#365a54] transition-colors hover:bg-white hover:text-[#1f4d47]"
              title={displayLabel}
            >
              <UserRound className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{displayLabel}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-[#365a54] transition-colors hover:text-[#1f4d47]"
            >
              Login
            </Link>
          )}
          <Button
            asChild
            className="h-11 rounded-full bg-[#1f4d47] px-5 text-sm font-medium text-white shadow-[0_16px_32px_-18px_rgba(31,77,71,0.55)] hover:bg-[#183f3a]"
          >
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Dashboard" : "Start free scan"}
            </Link>
          </Button>
        </div>

        <div
          className={cn(
            "sm:hidden",
            "origin-right transition-[opacity,transform,max-width] duration-200 ease-out motion-reduce:transition-none",
            hideMobileAction
              ? "pointer-events-none max-w-0 translate-y-1 scale-95 overflow-hidden opacity-0"
              : "max-w-44 translate-y-0 scale-100 opacity-100"
          )}
          aria-hidden={hideMobileAction}
        >
          <Button
            asChild
            className="h-11 rounded-full bg-[#1f4d47] px-4 text-sm text-white shadow-[0_16px_32px_-18px_rgba(31,77,71,0.55)] hover:bg-[#183f3a]"
          >
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              tabIndex={hideMobileAction ? -1 : undefined}
              aria-label={
                isAuthenticated
                  ? `Open dashboard for ${displayLabel}`
                  : "Start free scan"
              }
            >
              {isAuthenticated ? (
                <>
                  <UserRound className="size-4" aria-hidden="true" />
                  Dashboard
                </>
              ) : (
                "Start scan"
              )}
            </Link>
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}
