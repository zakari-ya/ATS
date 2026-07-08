"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { History, LayoutDashboard, ScanLine, Settings } from "lucide-react";

import { appFocusRing } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/scan",
    label: "New Scan",
    icon: ScanLine,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const HIDE_SCROLL_THRESHOLD = 72;
const SCROLL_DELTA_THRESHOLD = 8;

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollTopRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastScrollTopRef.current = 0;
    const frameId = window.requestAnimationFrame(() => {
      setIsHidden(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  useEffect(() => {
    const scrollElement = document.querySelector<HTMLElement>(
      "[data-app-scroll-container]"
    );
    const scrollTarget = scrollElement ?? window;

    function readScrollTop() {
      return scrollElement ? scrollElement.scrollTop : window.scrollY;
    }

    function updateNavVisibility() {
      const nextScrollTop = readScrollTop();
      const scrollDelta = nextScrollTop - lastScrollTopRef.current;

      if (nextScrollTop < 16) {
        setIsHidden(false);
        lastScrollTopRef.current = nextScrollTop;
        tickingRef.current = false;
        return;
      }

      if (Math.abs(scrollDelta) > SCROLL_DELTA_THRESHOLD) {
        setIsHidden(
          nextScrollTop > HIDE_SCROLL_THRESHOLD && scrollDelta > 0
        );
        lastScrollTopRef.current = nextScrollTop;
      }

      tickingRef.current = false;
    }

    function handleScroll() {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateNavVisibility);
        tickingRef.current = true;
      }
    }

    lastScrollTopRef.current = readScrollTop();
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      aria-hidden={isHidden}
      className={cn(
        "fixed inset-x-3 bottom-2 z-50 rounded-2xl border border-[rgba(31,77,71,0.14)] bg-white/92 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-lg shadow-[#183f3a]/10 backdrop-blur-xl transition-[transform,opacity] duration-200 ease-out will-change-transform motion-reduce:transition-none lg:hidden",
        isHidden
          ? "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0"
          : "translate-y-0 opacity-100"
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              tabIndex={isHidden ? -1 : undefined}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-medium transition-colors",
                appFocusRing,
                isActive
                  ? "bg-[#183f3a] text-white"
                  : "text-[#66736f] hover:bg-[#eef4f2] hover:text-[#183f3a]"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
