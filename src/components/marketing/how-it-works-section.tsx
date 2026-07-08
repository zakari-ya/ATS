"use client";

import { motion } from "motion/react";

import {
  SectionShell,
  marketingBodyClassName,
  marketingFadeUp,
  marketingPillClassName,
  marketingSerifStyle,
} from "./section-shell";

const steps = [
  {
    number: "01",
    title: "Upload a text-based PDF",
    description: "Use a clean CV PDF where the text can be selected.",
    note: "PDF only",
  },
  {
    number: "02",
    title: "Paste the job description",
    description: "Add the role you want to compare against.",
    note: "Structured input",
  },
  {
    number: "03",
    title: "Review matched and missing requirements",
    description:
      "See what already aligns, what is missing, and what needs stronger evidence.",
    note: "Evidence first",
  },
  {
    number: "04",
    title: "Improve your CV with real evidence",
    description:
      "Update project and experience details with truthful proof, not stuffed keywords.",
    note: "Practical next step",
  },
];

export function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works" className="pb-16 pt-10 lg:pb-20 lg:pt-14">
      <motion.div
        className="grid gap-12 xl:grid-cols-[0.42fr_0.58fr] xl:items-start"
        {...marketingFadeUp}
      >
        <div className="space-y-6 xl:sticky xl:top-12">
          <h2
            className="max-w-xl text-balance text-[2.55rem] leading-[1.02] tracking-tight text-[#183f3a] sm:text-[3.4rem]"
            style={marketingSerifStyle}
          >
            How CVMatch works
          </h2>
          <p className={`${marketingBodyClassName} max-w-lg`}>
            Upload your CV, paste the job post, and review a structured match
            analysis in a few minutes.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(180deg,rgba(230,240,238,0.62),rgba(255,255,255,0.34))] px-6 py-8 shadow-[0_34px_90px_-60px_rgba(31,77,71,0.24)] sm:px-8 lg:px-10">
          <div
            aria-hidden="true"
            className="absolute -left-10 top-10 h-64 w-32 rounded-full bg-[#dcebea]/78 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-12 left-12 top-12 w-px bg-[linear-gradient(180deg,rgba(31,77,71,0.08),rgba(31,77,71,0.22),rgba(31,77,71,0.08))]"
          />

          <div className="relative space-y-10">
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                className="grid gap-3 pl-14 sm:grid-cols-[auto_1fr] sm:gap-6 sm:pl-20"
              >
                <div className="relative">
                  <span className="absolute -left-[3.55rem] top-1 flex size-9 items-center justify-center rounded-full bg-white/82 text-[11px] tracking-[0.18em] text-[#1f4d47] shadow-[0_14px_26px_-20px_rgba(31,77,71,0.28)] backdrop-blur-xl sm:-left-[4.65rem]">
                    {step.number}
                  </span>
                  <span className={marketingPillClassName}>{step.note}</span>
                </div>

                <div className="max-w-xl">
                  <h3
                    className="text-[1.55rem] leading-tight tracking-tight text-[#1f4d47] sm:text-[1.85rem]"
                    style={marketingSerifStyle}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-[#66736f] sm:text-[15px]">
                    {step.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
