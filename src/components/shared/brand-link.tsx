import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLinkProps = {
  href?: string;
  variant?: "light" | "dark";
  className?: string;
  markSrc?: string;
  markClassName?: string;
  markContainerClassName?: string;
  withContainer?: boolean;
};

export function BrandLink({
  href = "/",
  variant = "light",
  className,
  markSrc = "/logo_cvmatch2-bgNo.png",
  markClassName,
  markContainerClassName,
  withContainer = false,
}: BrandLinkProps) {
  const isDark = variant === "dark";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center  text-xl font-semibold leading-none tracking-tight transition-opacity hover:opacity-90",
        isDark ? "text-white" : "text-[#1f4d47]",
        className,
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {withContainer ? (
        <span
          className={cn(
            "relative flex size-8 gap-2items-center justify-center overflow-hidden rounded-[10px] border",
            isDark
              ? "border-white/12 bg-white shadow-[0_10px_24px_-20px_rgba(0,0,0,0.35)]"
              : "border-[rgba(31,77,71,0.12)] bg-white/84 shadow-[0_12px_24px_-20px_rgba(31,77,71,0.28)]",
            markContainerClassName,
          )}
          aria-hidden="true"
        >
          <Image
            src={markSrc}
            alt=""
            width={64}
            height={64}
            className={cn("size-10 object-contain", markClassName)}
          />
        </span>
      ) : (
        <Image
          src={markSrc}
          alt=""
          width={64}
          height={64}
          className={cn("object-contain size-25", markClassName)}
          aria-hidden="true"
        />
      )}
      CVMatch
    </Link>
  );
}
