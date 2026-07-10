"use client";

import { motion, useReducedMotion } from "motion/react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const roles = [
  {
    title: "Frontend Developer",
    requirements: [
      ["React", "Matched"],
      ["TypeScript", "Matched"],
      ["REST APIs", "Evidence found"],
    ],
  },
  {
    title: "Full-stack Developer",
    requirements: [
      ["React", "Matched"],
      ["Node.js", "Missing"],
      ["PostgreSQL", "Missing"],
    ],
  },
  {
    title: "Backend Developer",
    requirements: [
      ["REST APIs", "Evidence found"],
      ["PostgreSQL", "Missing"],
      ["TypeScript", "Matched"],
    ],
  },
];

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionShell id="how-it-works" className="relative bg-[#fbfaf7] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <motion.div {...marketingFadeUp} className="max-w-xl">
          <p className="text-sm font-medium text-[#58716b]">The job changes the question</p>
          <h2
            className="mt-4 text-balance text-[2.65rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.8rem]"
            style={marketingSerifStyle}
          >
            One CV. Different jobs. Different gaps.
          </h2>
          <p className="mt-6 text-base leading-8 text-[#66736f] sm:text-lg">
            A CV may fit one role and miss the core requirements of another.
            CVMatch reviews each application against the job description you
            provide.
          </p>
        </motion.div>

        <div className="relative min-h-[34rem] overflow-hidden rounded-2xl bg-[#e6f0ee] p-5 sm:p-8 lg:p-10">
          <div className="absolute left-1/2 top-14 h-[72%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(31,77,71,0.22),transparent)]" aria-hidden="true" />
          <div className="relative mx-auto flex h-28 w-36 flex-col justify-center rounded-xl bg-[#183f3a] px-5 text-white shadow-[0_8px_20px_-14px_rgba(31,77,71,0.45)]">
            <span className="text-xs text-white/58">Source</span>
            <span className="mt-1 font-medium">One CV</span>
            <span className="mt-2 h-1 w-16 rounded-full bg-[#a9c7c1]" />
          </div>

          <p className="relative mt-8 text-center text-xs font-medium text-[#58716b]">Example analysis</p>
          <div className="relative mt-4 grid gap-3 lg:grid-cols-3">
            {roles.map((role, index) => (
              <motion.article
                key={role.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl bg-white/78 p-4 backdrop-blur-sm"
              >
                <span className="absolute -top-5 left-1/2 h-5 w-px -translate-x-1/2 bg-[#a9c7c1]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[#183f3a]">{role.title}</h3>
                <ul className="mt-4 space-y-3">
                  {role.requirements.map(([name, status]) => (
                    <li key={name} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#365a54]">{name}</span>
                      <span className={status === "Missing" ? "text-[#9a5b43]" : "text-[#276948]"}>{status}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
