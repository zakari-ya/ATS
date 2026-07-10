"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const concepts = ["Requirements", "CV evidence", "Match status", "Scoring rules"];

export function ScoreEvidenceSection() {
  return (
    <SectionShell className="relative bg-[#fbfaf7] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <motion.div {...marketingFadeUp}>
          <p className="text-sm font-medium text-[#58716b]">Scoring architecture</p>
          <h2 className="mt-4 max-w-lg text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
            A score you can understand
          </h2>
          <div className="mt-8 space-y-4 text-base text-[#365a54]">
            <p>AI organizes the evidence.</p>
            <p>The backend validates the output.</p>
            <p>Scoring rules calculate the result.</p>
            <p>Missing required skills can limit the score.</p>
          </div>
          <p className="mt-8 max-w-lg text-sm leading-7 text-[#66736f]">
            CVMatch does not allow the AI response to directly set the final score.
          </p>
        </motion.div>

        <motion.div {...marketingFadeUp} className="relative overflow-hidden rounded-2xl bg-[#e6f0ee] p-5 sm:p-8 lg:p-10">
          <div className="space-y-3">
            {concepts.map((concept, index) => (
              <motion.div
                key={concept}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#183f3a]">{index + 1}</span>
                <span className="flex-1 rounded-xl bg-white/72 px-4 py-4 text-sm font-medium text-[#365a54]">{concept}</span>
              </motion.div>
            ))}
          </div>
          <div className="my-5 flex justify-center text-[#1f4d47]"><ArrowRight className="size-5 rotate-90" aria-hidden="true" /></div>
          <div className="rounded-xl bg-[#183f3a] p-5 text-white">
            <p className="text-xs text-white/54">Trusted result</p>
            <div className="mt-2 flex items-end justify-between gap-4"><p className="text-xl font-semibold">Backend-calculated score</p><span className="text-3xl font-semibold">78</span></div>
            <p className="mt-2 text-xs text-white/60">Example value · not user data</p>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}
