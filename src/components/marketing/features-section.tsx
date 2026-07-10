"use client";

import { motion } from "motion/react";

import { ScorePreviewCard } from "./score-preview-card";
import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

export function FeaturesSection() {
  return (
    <SectionShell id="features" className="relative bg-[#fbfaf7] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <motion.div {...marketingFadeUp} className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div>
          <p className="text-sm font-medium text-[#58716b]">Product result</p>
          <h2 className="mt-4 max-w-xl text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
            See more than a percentage
          </h2>
        </div>
        <p className="max-w-2xl text-base leading-8 text-[#66736f] sm:text-lg lg:justify-self-end">
          A score alone does not explain what to change. CVMatch shows the
          evidence behind the result, the requirements that are missing, and
          why the score was limited.
        </p>
      </motion.div>
      <div className="mt-12"><ScorePreviewCard /></div>
    </SectionShell>
  );
}
