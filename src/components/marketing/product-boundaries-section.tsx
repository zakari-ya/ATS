"use client";

import { Check, Minus } from "lucide-react";
import { motion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const helps = [
  "Compare one CV with one job description",
  "Find matched requirements",
  "Identify missing required and preferred skills",
  "Understand evidence behind the result",
  "Prioritize truthful improvements",
  "Review previous scans",
];

const doesNot = [
  "Make hiring decisions",
  "Guarantee interviews or employment",
  "Know a company’s private ATS rules",
  "Replace recruiter judgment",
  "Create experience you do not have",
];

export function ProductBoundariesSection() {
  return (
    <SectionShell className="relative bg-[#fbfaf7] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <motion.div {...marketingFadeUp} className="max-w-3xl">
        <p className="text-sm font-medium text-[#58716b]">Honest boundaries</p>
        <h2 className="mt-4 text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
          What CVMatch does, and what it does not do
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-0">
        <BoundaryColumn title="CVMatch helps you" items={helps} icon="check" />
        <BoundaryColumn title="CVMatch does not" items={doesNot} icon="minus" muted />
      </div>
    </SectionShell>
  );
}

function BoundaryColumn({ title, items, icon, muted = false }: { title: string; items: string[]; icon: "check" | "minus"; muted?: boolean }) {
  const Icon = icon === "check" ? Check : Minus;
  return (
    <motion.section {...marketingFadeUp} className={[
      "lg:px-10 lg:first:pl-0 lg:last:border-l lg:last:border-[rgba(31,77,71,0.12)] lg:last:pr-0",
      muted ? "text-[#66736f]" : "text-[#183f3a]",
    ].join(" ")}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-6 divide-y divide-[rgba(31,77,71,0.1)]">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 py-4 text-sm sm:text-base"><Icon className="size-4 shrink-0 text-[#58716b]" aria-hidden="true" /><span>{item}</span></li>
        ))}
      </ul>
    </motion.section>
  );
}
