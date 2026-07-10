"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const controls = [
  "Private CV upload",
  "Authenticated user access",
  "User-owned scan history",
  "Validated structured analysis",
  "Backend-calculated score",
  "Delete scans and their stored CV file",
  "No public CV profile",
];

export function PrivacySection() {
  return (
    <SectionShell id="privacy" className="relative bg-[#1f4d47] py-20 text-white lg:py-28" innerClassName="relative">
      <StoryNode tone="dark" />
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-20 top-0 size-96 rounded-full bg-[#a9c7c1]/8 blur-3xl" />
        <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="absolute bottom-0 right-[18%] top-0 w-px origin-top bg-[linear-gradient(180deg,transparent,rgba(220,235,232,0.22),transparent)]" />
      </div>

      <div className="relative grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <motion.div {...marketingFadeUp}>
          <p className="text-sm font-medium text-[#b9d4ce]">Privacy and control</p>
          <h2 className="mt-4 max-w-xl text-balance text-[2.65rem] leading-[1] tracking-[-0.03em] text-white sm:text-[3.8rem]" style={marketingSerifStyle}>
            Your CV stays connected to your account
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
            Uploads are private, scan history belongs to the signed-in user,
            and scans can be deleted from the application.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/74">
            <span className="rounded-full bg-white/8 px-3 py-1.5">No hiring decision</span>
            <span className="rounded-full bg-white/8 px-3 py-1.5">No fake guarantees</span>
          </div>
        </motion.div>

        <ol className="relative divide-y divide-white/10 border-y border-white/10">
          {controls.map((item, index) => (
            <motion.li key={item} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.55 }} transition={{ duration: 0.42, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-4 py-4 sm:py-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10"><Check className="size-3.5 text-[#dcebea]" aria-hidden="true" /></span>
              <span className="text-sm text-white/78 sm:text-base">{item}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}
