"use client";

import { useState } from "react";
import { Check, FileText, ScanText, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SectionShell, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const stages = [
  { title: "CV uploaded", description: "A text-based PDF enters the private scan flow." },
  { title: "Job description added", description: "The role requirements provide the comparison context." },
  { title: "Requirements identified", description: "Required and preferred items are separated into structured fields." },
  { title: "CV evidence connected", description: "Relevant CV evidence is linked to each requirement." },
  { title: "Analysis validated", description: "The structured AI response is checked before it can be used." },
  { title: "Backend score calculated", description: "Application scoring rules calculate the trusted score and label." },
];

export function MatchingJourneySection() {
  const [activeStage, setActiveStage] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionShell className="relative bg-[#e6f0ee] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-medium text-[#58716b]">The matching journey</p>
          <h2 className="mt-4 max-w-xl text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
            From two documents to one clear answer
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-[#66736f] sm:text-lg">
            Upload your CV, add the job description, and let CVMatch organize
            the comparison into requirements, evidence, gaps, and priorities.
          </p>

          <div className="mt-10 hidden h-80 lg:block">
            <JourneyVisual stage={activeStage} reducedMotion={Boolean(shouldReduceMotion)} />
          </div>
        </div>

        <ol className="relative space-y-5 before:absolute before:bottom-10 before:left-[1.18rem] before:top-10 before:w-px before:bg-[#a9c7c1]/70">
          {stages.map((stage, index) => (
            <motion.li
              key={stage.title}
              onViewportEnter={() => setActiveStage(index)}
              viewport={{ amount: 0.62 }}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative grid min-h-32 grid-cols-[2.4rem_1fr] gap-5 py-4 sm:min-h-36"
            >
              <span className={[
                "relative z-10 flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                activeStage >= index ? "bg-[#183f3a] text-white" : "bg-white text-[#66736f]",
              ].join(" ")}>{activeStage > index ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span>
              <div>
                <p className="text-xs font-medium text-[#58716b]">Stage {index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-[#183f3a]">{stage.title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-[#66736f]">{stage.description}</p>
                <div className="mt-5 lg:hidden"><JourneyVisual stage={index} reducedMotion={Boolean(shouldReduceMotion)} compact /></div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <p className="mt-12 text-center text-sm leading-7 text-[#47655f]">
        AI structures the comparison. Backend code validates the analysis and calculates the final score.
      </p>
    </SectionShell>
  );
}

function JourneyVisual({ stage, reducedMotion, compact = false }: { stage: number; reducedMotion: boolean; compact?: boolean }) {
  const labels = ["Private PDF", "Job post", "Requirements", "CV evidence", "Validated", "Final score"];
  return (
    <div className={[
      "relative overflow-hidden rounded-2xl bg-[#183f3a] text-white",
      compact ? "h-44 p-4" : "h-full p-6",
    ].join(" ")}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(169,199,193,0.16),transparent_38%)]" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage}
          initial={reducedMotion ? false : { opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: reducedMotion ? 0 : 0.24 }}
          className="relative flex h-full flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-white/58"><span>CVMatch flow</span><span>{stage + 1} / 6</span></div>
          <div className="flex items-center justify-center gap-3">
            <VisualIcon stage={stage} />
            <div><p className="text-xs text-white/52">Current step</p><p className="mt-1 font-medium">{labels[stage]}</p></div>
          </div>
          <div className="flex gap-1.5">{labels.map((label, index) => <span key={label} className={[
            "h-1 flex-1 rounded-full",
            index <= stage ? "bg-[#a9c7c1]" : "bg-white/12",
          ].join(" ")} />)}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VisualIcon({ stage }: { stage: number }) {
  const Icon = stage < 2 ? FileText : stage < 4 ? ScanText : ShieldCheck;
  return <span className="flex size-12 items-center justify-center rounded-xl bg-white/10"><Icon className="size-5 text-[#dcebea]" aria-hidden="true" /></span>;
}
