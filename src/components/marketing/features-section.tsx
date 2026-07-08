"use client";

import { motion } from "motion/react";

import {
  SectionShell,
  marketingBodyClassName,
  marketingDividerClassName,
  marketingFadeUp,
  marketingPillClassName,
  marketingSerifStyle,
} from "./section-shell";
import { ScorePreviewCard } from "./score-preview-card";

const proofPoints = [
  {
    title: "Matched requirements",
    description:
      "See the stack, responsibilities, and evidence already visible in your CV.",
  },
  {
    title: "Missing required skills",
    description:
      "Spot the gaps that limit the score before you send another application.",
  },
  {
    title: "Backend-calculated score",
    description:
      "The final label comes from validated structured data and backend scoring rules.",
  },
];

export function FeaturesSection() {
  return (
    <SectionShell id="features" className="pb-16 lg:pb-20">
      <motion.div
        className="grid gap-10 xl:grid-cols-[0.38fr_0.62fr] xl:items-center"
        {...marketingFadeUp}
      >
        <div className="space-y-8">
          <div className="space-y-5">
            <span className={marketingPillClassName}>Product story</span>
            <h2
              className="max-w-lg text-balance text-[2.45rem] leading-[1.02] tracking-tight text-[#183f3a] sm:text-[3.2rem]"
              style={marketingSerifStyle}
            >
              See the gaps before you apply
            </h2>
            <p className={`${marketingBodyClassName} max-w-lg`}>
              CVMatch turns a job post and your CV into structured evidence:
              what matches, what is missing, and why the score was limited.
            </p>
          </div>

          <div className="space-y-5">
            {proofPoints.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className={`border-t ${marketingDividerClassName} pt-5 first:border-t-0 first:pt-0`}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-[11px] tracking-[0.18em] text-[#58716b]">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg leading-tight text-[#1f4d47]">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-7 text-[#66736f]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <ScorePreviewCard />
      </motion.div>
    </SectionShell>
  );
}
