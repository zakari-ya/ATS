"use client";

import { motion } from "motion/react";

import { ScorePreviewCard } from "./score-preview-card";
import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";

const proofPoints = [
  ["01", "Matched requirements", "Evidence already visible in your CV."],
  ["02", "Missing requirements", "Important gaps found in the job post."],
  ["03", "Backend score", "A final score calculated by deterministic code."],
] as const;

export function FeaturesSection() {
  return (
    <SectionShell
      id="features"
      className="relative min-h-[100svh] bg-white py-16 sm:py-20 lg:flex lg:min-h-dvh lg:items-center lg:py-24"
    >
      <div className="grid w-full gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10">
        <motion.div {...marketingFadeUp} className="lg:pl-[4vw]">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]">
            The product story
          </p>
          <h2
            className="mt-4 max-w-2xl text-balance text-[3rem] leading-[0.98] text-[#183f3a] sm:text-[4.3rem] xl:text-[5.4rem]"
            style={marketingSerifStyle}
          >
            See the gaps before you apply.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#66736f] sm:text-lg">
            CVMatch turns a job post and your CV into structured evidence: what
            matches, what is missing, and why the score was limited.
          </p>

          <ol className="mt-10 max-w-xl space-y-6">
            {proofPoints.map(([number, title, copy], index) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.42, delay: index * 0.07 }}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3"
              >
                <span className="pt-0.5 text-xs font-semibold text-[#7b9c95]">
                  {number}
                </span>
                <div>
                  <h3 className="font-semibold text-[#183f3a]">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#66736f]">{copy}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        <ScorePreviewCard />
      </div>
    </SectionShell>
  );
}
