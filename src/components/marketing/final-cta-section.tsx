"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";

export function FinalCTASection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <SectionShell className="flex min-h-[78svh] items-center bg-white py-20 sm:py-24 lg:min-h-[86svh]">
      <motion.div {...marketingFadeUp} className="mx-auto w-full max-w-6xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]">
          Your next application
        </p>
        <h2
          className="mx-auto mt-5 max-w-5xl text-balance text-[3.4rem] leading-[0.94] text-[#183f3a] sm:text-[5.2rem] lg:text-[7rem]"
          style={marketingSerifStyle}
        >
          Check your CV before you send it.
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#66736f] sm:text-lg">
          Run a job-specific match analysis and understand what your CV is
          missing before your next application.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 rounded-full bg-[#183f3a] px-7 text-sm font-medium text-white hover:bg-[#1f4d47]">
            <Link href="/scan">
              Start free scan
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-[#c8d9d5] bg-white px-7 text-sm text-[#183f3a] hover:bg-[#eef4f2]">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Open dashboard" : "Log in"}
            </Link>
          </Button>
        </div>
      </motion.div>
    </SectionShell>
  );
}
