"use client";

import { motion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

export function ImprovementJourneySection() {
  return (
    <SectionShell className="relative bg-[#f3f5f1] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <motion.div {...marketingFadeUp} className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-[#58716b]">After the analysis</p>
        <h2 className="mt-4 text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
          Turn gaps into a better application
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#66736f] sm:text-lg">
          Focus on the requirements that matter, improve how you present real
          experience, and run a new job-specific scan before applying.
        </p>
      </motion.div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <NarrativeColumn
          label="Before"
          items={["Vague project description", "Missing skill evidence", "Unclear responsibility"]}
          muted
        />
        <div className="flex items-center justify-center py-2 lg:px-5">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="h-14 w-px origin-top bg-[#a9c7c1] lg:h-44"
            aria-hidden="true"
          />
        </div>
        <NarrativeColumn
          label="Clearer evidence"
          items={["Specific project contribution", "Truthful evidence connected", "Relevant responsibility clarified"]}
        />
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-xl bg-[#183f3a] px-5 py-4 text-center text-sm leading-7 text-white/76">
        Improve the presentation of real experience. Do not add skills or experience you do not have.
      </div>
    </SectionShell>
  );
}

function NarrativeColumn({ label, items, muted = false }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <motion.div {...marketingFadeUp} className={[
      "rounded-2xl p-6 sm:p-8",
      muted ? "bg-white/64" : "bg-[#dcebea]",
    ].join(" ")}>
      <p className="text-sm font-medium text-[#58716b]">{label}</p>
      <div className="mt-6 space-y-5">
        {items.map((item, index) => (
          <motion.p key={item} initial={{ opacity: 0, x: muted ? -12 : 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.42, delay: index * 0.08 }} className={[
            "border-b border-[rgba(31,77,71,0.1)] pb-5 text-base last:border-b-0 last:pb-0",
            muted ? "text-[#78827f]" : "font-medium text-[#183f3a]",
          ].join(" ")}>{item}</motion.p>
        ))}
      </div>
    </motion.div>
  );
}
