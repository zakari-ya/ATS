"use client";

import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const promises = [
  "Private uploads",
  "Validated analysis",
  "Backend scoring",
  "Delete scans anytime",
];

export function TrustStrip() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative -mt-px overflow-hidden bg-[linear-gradient(180deg,#dcebea_0%,#f3f5f1_42%,#fbfaf7_100%)] pt-16 sm:pt-20 lg:pt-24">
      <SectionShell className="relative pb-16 lg:pb-24" innerClassName="relative">
        <StoryNode />
        <motion.div {...marketingFadeUp} className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-[#58716b]">Before you apply</p>
          <h2
            className="mt-4 text-balance text-[2.6rem] leading-[0.98] tracking-[-0.03em] text-[#183f3a] sm:text-[3.8rem] lg:text-[4.6rem]"
            style={marketingSerifStyle}
          >
            Know where your CV matches. See where it falls short.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#58716b] sm:text-lg">
            CVMatch compares your CV with one specific job description and turns
            the result into structured, practical evidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#47655f]"
        >
          {promises.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-3">
              {index > 0 ? <span className="hidden size-1 rounded-full bg-[#a9c7c1] sm:block" aria-hidden="true" /> : null}
              {item}
            </span>
          ))}
        </motion.div>

        <motion.div
          className="mx-auto mt-10 flex size-10 items-center justify-center rounded-full bg-white/70 text-[#1f4d47]"
          animate={shouldReduceMotion ? undefined : { y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: 1, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ArrowDown className="size-4" />
        </motion.div>
      </SectionShell>
    </section>
  );
}
