"use client";

import { motion } from "motion/react";

import {
  SectionShell,
  marketingBodyClassName,
  marketingFadeUp,
  marketingPillClassName,
  marketingSerifStyle,
  marketingSoftPanelClassName,
} from "./section-shell";

const privacyItems = [
  "Private CV uploads",
  "User-owned scan history",
  "Validated AI JSON",
  "Backend scoring",
  "Delete scans anytime",
];

export function PrivacySection() {
  return (
    <SectionShell id="privacy" className="pb-16 lg:pb-20">
      <motion.div
        className={`${marketingSoftPanelClassName} relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10 lg:py-10`}
        {...marketingFadeUp}
      >
        <div className="absolute right-14 top-0 h-20 w-48 rounded-full bg-white/40 blur-3xl" />
        <div className="relative grid gap-10 xl:grid-cols-[0.52fr_0.48fr] xl:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2.5">
              <span className={marketingPillClassName}>No hiring decision</span>
              <span className={marketingPillClassName}>No fake guarantees</span>
            </div>
            <h2
              className="max-w-xl text-balance text-[2.45rem] leading-[1.02] tracking-tight text-[#183f3a] sm:text-[3.15rem]"
              style={marketingSerifStyle}
            >
              Private by design, clear by default
            </h2>
            <p className={`${marketingBodyClassName} max-w-lg`}>
              Your CV is handled as private user data. AI output is validated
              before use, and the final score is calculated by backend code.
            </p>
          </div>

          <div className="rounded-[30px] bg-[#1f4d47] px-5 py-5 text-white shadow-[0_30px_70px_-48px_rgba(31,77,71,0.6)] sm:px-6">
            <div className="space-y-4">
              {privacyItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-white/78">0{index + 1}</span>
                  <p className="flex-1 text-base leading-7 text-white/92">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
