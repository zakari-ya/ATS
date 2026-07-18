import * as React from "react";

import { cn } from "@/lib/utils";

export const marketingSerifStyle = {
  fontFamily: "var(--font-display)",
} satisfies React.CSSProperties;

export const marketingFadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
} as const;

export const marketingPanelClassName =
  "rounded-2xl bg-white/82 shadow-[0_8px_24px_-20px_rgba(31,77,71,0.24)] backdrop-blur-xl";

export const marketingSoftPanelClassName =
  "rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(230,240,238,0.82))] shadow-[0_8px_24px_-20px_rgba(31,77,71,0.26)] backdrop-blur-xl";

export const marketingEyebrowClassName =
  "text-xs uppercase tracking-[0.28em] text-[#58716b]";

export const marketingBodyClassName =
  "text-base leading-7 text-[#66736f]";

export const marketingDividerClassName =
  "border-[rgba(31,77,71,0.09)]";

export const marketingPillClassName =
  "inline-flex items-center rounded-full bg-white/76 px-3 py-1 text-xs text-[#47655f] backdrop-blur-lg";

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
      <div className={cn("mx-auto w-full max-w-[1680px]", innerClassName)}>
        {children}
      </div>
    </Component>
  );
}
