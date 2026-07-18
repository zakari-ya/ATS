"use client";

import { motion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";

const promises = [
  "Private uploads",
  "Validated AI output",
  "Backend scoring",
  "Daily limits",
  "Delete scans anytime",
];

export function TrustStrip() {
  return (
    <SectionShell className="bg-white py-14 sm:py-16 lg:py-20">
      <motion.div {...marketingFadeUp} className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]">
            Built for structured CV review
          </p>
          <h2 className="mt-3 text-[2rem] leading-tight text-[#183f3a] sm:text-[2.5rem]" style={marketingSerifStyle}>
            Clear evidence. No hiring theatre.
          </h2>
        </div>
        <div className="flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm text-[#47655f] lg:justify-end">
          {promises.map((item, index) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: index * 0.05 }}
              className="inline-flex items-center gap-2"
            >
              <span className="size-1 rounded-full bg-[#7fa59d]" aria-hidden="true" />
              {item}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </SectionShell>
  );
}
