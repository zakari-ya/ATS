"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

import {
  SectionShell,
  marketingBodyClassName,
  marketingFadeUp,
  marketingSoftPanelClassName,
  marketingSerifStyle,
} from "./section-shell";

export function FinalCTASection() {
  return (
    <SectionShell className="pb-16 lg:pb-20">
      <motion.div
        className={`${marketingSoftPanelClassName} relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10 lg:py-10`}
        {...marketingFadeUp}
      >
        <div className="absolute left-10 top-0 h-20 w-56 rounded-full bg-white/45 blur-3xl" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              className="text-balance text-[2.45rem] leading-[1.02] tracking-tight text-[#183f3a] sm:text-[3.1rem]"
              style={marketingSerifStyle}
            >
              Check your CV before your next application.
            </h2>
            <p className={`mt-4 max-w-xl ${marketingBodyClassName}`}>
              Run a job-specific match analysis and understand what your CV is
              missing before you send it.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 rounded-full bg-[#183f3a] px-6 text-sm font-medium text-white shadow-[0_18px_42px_-25px_rgba(31,77,71,0.72)] hover:bg-[#1f4d47]"
            >
              <Link href="/scan">
                Start free scan
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-[rgba(31,77,71,0.12)] bg-white/70 px-6 text-sm text-[#1f4d47] hover:bg-white"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
