"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

export function FinalCTASection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionShell className="relative overflow-hidden bg-[#183f3a] py-20 text-white lg:py-28" innerClassName="relative">
      <StoryNode tone="dark" />
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a9c7c1]/8 blur-3xl" />
        <motion.div initial={{ width: 0 }} whileInView={{ width: "42%" }} viewport={{ once: true }} transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }} className="absolute left-0 top-1/2 h-px bg-[linear-gradient(90deg,transparent,#a9c7c1)]" />
        <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: shouldReduceMotion ? 0 : 0.35, delay: 0.45 }} className="absolute left-[42%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcebea] ring-8 ring-white/5" />
      </div>

      <motion.div {...marketingFadeUp} className="relative mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-[#b9d4ce]">The next application</p>
        <h2 className="mt-4 text-balance text-[2.85rem] leading-[0.98] tracking-[-0.03em] text-white sm:text-[4.2rem] lg:text-[5rem]" style={marketingSerifStyle}>
          Apply with a clearer picture.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
          Compare your CV with the role, understand the gaps, and improve the
          evidence before you send your application.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 rounded-full bg-white px-7 text-sm font-medium text-[#183f3a] hover:bg-[#eef4f2]">
            <Link href="/scan">Start free scan<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-white/18 bg-white/8 px-7 text-sm text-white hover:bg-white/12 hover:text-white">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>{isAuthenticated ? "Dashboard" : "Log in"}</Link>
          </Button>
        </div>
      </motion.div>
    </SectionShell>
  );
}
