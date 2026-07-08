"use client";

import { motion } from "motion/react";

import {
  SectionShell,
  marketingFadeUp,
  marketingPillClassName,
} from "./section-shell";

const items = [
  "Private uploads",
  "Backend scoring",
  "Validated AI output",
  "Daily limits",
  "Delete scans anytime",
];

export function TrustStrip() {
  return (
    <SectionShell className="pb-12 pt-10 lg:pb-16 lg:pt-12">
      <motion.div {...marketingFadeUp}>
        <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0.18))] px-4 py-4 shadow-[0_26px_60px_-46px_rgba(31,77,71,0.22)] backdrop-blur-xl sm:px-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-16 top-0 h-16 rounded-full bg-[#dcebea]/50 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
            <p className="text-center text-[11px] uppercase tracking-[0.28em] text-[#66736f] lg:text-left">
              Built for structured CV review
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 lg:justify-end">
              {items.map((label, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className={marketingPillClassName}
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
