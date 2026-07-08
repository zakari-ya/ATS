import * as React from "react";

import { cn } from "@/lib/utils";

export const marketingSerifStyle = {
  fontFamily: "var(--font-display)",
} satisfies React.CSSProperties;

export const marketingFadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" },
} as const;

export const marketingPanelClassName =
  "rounded-[30px] border border-[rgba(31,77,71,0.08)] bg-white/74 shadow-[0_28px_80px_-54px_rgba(31,77,71,0.24)] backdrop-blur-xl";

export const marketingSoftPanelClassName =
  "rounded-[36px] border border-[rgba(31,77,71,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(230,240,238,0.78))] shadow-[0_32px_90px_-58px_rgba(31,77,71,0.28)] backdrop-blur-xl";

export const marketingEyebrowClassName =
  "text-xs uppercase tracking-[0.28em] text-[#58716b]";

export const marketingBodyClassName =
  "text-base leading-7 text-[#66736f]";

export const marketingDividerClassName =
  "border-[rgba(31,77,71,0.09)]";

export const marketingPillClassName =
  "inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs tracking-[0.12em] text-[#47655f] shadow-[0_14px_26px_-22px_rgba(31,77,71,0.28)] backdrop-blur-lg";

type SectionShellProps = {
  as?: "section" | "div" | "header" | "footer";
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
};

export function SectionShell({
  as: Component = "section",
  id,
  className,
  innerClassName,
  children,
}: SectionShellProps) {
  return (
    <Component
      id={id}
      className={cn("px-[15px] sm:px-5 lg:px-6 xl:px-7", className)}
    >
      <div className={cn("mx-auto w-full max-w-[1440px]", innerClassName)}>
        {children}
      </div>
    </Component>
  );
}
