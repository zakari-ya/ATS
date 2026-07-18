"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { SectionShell, marketingSerifStyle } from "./section-shell";

const steps = [
  {
    number: "01",
    title: "Upload your CV",
    copy: "Use a text-based PDF where the words can be selected.",
  },
  {
    number: "02",
    title: "Paste the job post",
    copy: "Add the role you want this CV to be compared against.",
  },
  {
    number: "03",
    title: "Review the evidence",
    copy: "See what matches, what is missing, and what limited the score.",
  },
  {
    number: "04",
    title: "Improve truthfully",
    copy: "Clarify real experience instead of adding unsupported keywords.",
  },
] as const;

export function HowItWorksSection() {
  const visualRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: visualRef,
    offset: ["start end", "end start"],
  });
  const artworkY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const artworkRotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <SectionShell
      id="how-it-works"
      className="relative min-h-[100svh] bg-white py-16 sm:py-20 lg:min-h-[135svh] lg:py-0"
      innerClassName="lg:sticky lg:top-0 lg:flex lg:min-h-dvh lg:items-center"
    >
      <div className="grid w-full gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-8">
        <div className="lg:pl-[4vw]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]"
          >
            Four clear moments
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-4 max-w-2xl text-balance text-[3rem] leading-[0.98] text-[#183f3a] sm:text-[4.3rem] xl:text-[5.4rem]"
            style={marketingSerifStyle}
          >
            From upload to useful evidence.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-8 text-[#66736f] sm:text-lg"
          >
            One focused flow turns a CV and a job post into practical,
            job-specific feedback without pretending to make a hiring decision.
          </motion.p>

          <ol className="mt-10 grid gap-7 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-1 xl:grid-cols-2">
            {steps.map((step, index) => (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3"
              >
                <span className="pt-0.5 text-xs font-semibold text-[#7b9c95]">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#183f3a]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#66736f]">
                    {step.copy}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <div
          ref={visualRef}
          className="relative mx-auto flex min-h-[34rem] w-full max-w-[48rem] items-center justify-center sm:min-h-[42rem] lg:min-h-[80svh]"
        >
          <div className="absolute inset-x-[8%] top-1/2 h-px bg-[#dce7e4]" aria-hidden="true" />
          <div className="absolute bottom-[12%] top-[12%] left-1/2 w-px bg-[#e4ece9]" aria-hidden="true" />
          <motion.div
            style={
              shouldReduceMotion
                ? undefined
                : { y: artworkY, rotate: artworkRotate }
            }
            className="relative z-10 h-[31rem] w-[21rem] sm:h-[39rem] sm:w-[27rem] lg:h-[72svh] lg:max-h-[45rem] lg:w-[31rem]"
          >
            <Image
              src="/marketing/cvmatch-process-art.png"
              alt="Abstract CVMatch sculpture showing information moving through a structured review"
              fill
              sizes="(max-width: 640px) 336px, (max-width: 1024px) 432px, 496px"
              className="object-contain drop-shadow-[0_28px_32px_rgba(24,63,58,0.16)]"
            />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="absolute left-[2%] top-[18%] z-20 text-xs font-medium uppercase tracking-[0.18em] text-[#59716c] sm:left-[8%]"
          >
            CV evidence
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="absolute right-[2%] bottom-[18%] z-20 text-right text-xs font-medium uppercase tracking-[0.18em] text-[#59716c] sm:right-[8%]"
          >
            Structured result
          </motion.span>
        </div>
      </div>
    </SectionShell>
  );
}
