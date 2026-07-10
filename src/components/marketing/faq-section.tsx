"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";
import { StoryNode } from "./story-line";

const faqs = [
  ["Does CVMatch guarantee that I will get hired?", "No. CVMatch provides structured feedback about how your CV compares with a job description. It does not make hiring decisions or guarantee job outcomes."],
  ["Does AI calculate the final score?", "No. AI returns structured matching information. Backend code validates the output and calculates the final score using the application’s scoring rules."],
  ["Why do scanned PDFs fail?", "Image-only PDFs do not contain selectable text for reliable extraction. Upload a text-based PDF where you can select and copy the words."],
  ["What information do I receive?", "You receive a final score, match label, matched requirements, missing required and preferred skills, supporting CV evidence, explanations, and improvement priorities."],
  ["Can I delete a scan?", "Yes. Deleting a scan removes its analysis and associated uploaded CV file according to the application’s implemented deletion workflow."],
  ["Why are there daily limits?", "Limits help protect the service from abuse and keep access sustainable."],
  ["Is this the same as a company’s real ATS?", "No. CVMatch provides ATS-style job-specific feedback. Companies use different systems, rules, recruiters, and hiring processes."],
  ["Should I add every missing skill to my CV?", "No. Add a skill only when you genuinely have it. Use the analysis to improve how you present real experience and to identify areas you may need to learn."],
] as const;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionShell id="faq" className="relative bg-[#f3f5f1] py-20 lg:py-28" innerClassName="relative">
      <StoryNode />
      <motion.div {...marketingFadeUp} className="grid gap-12 lg:grid-cols-[0.68fr_1.32fr]">
        <div>
          <p className="text-sm font-medium text-[#58716b]">Questions</p>
          <h2 className="mt-4 max-w-lg text-balance text-[2.6rem] leading-[1] tracking-[-0.03em] text-[#183f3a] sm:text-[3.7rem]" style={marketingSerifStyle}>
            Questions before your first scan?
          </h2>
        </div>

        <div className="border-y border-[rgba(31,77,71,0.12)]">
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-[rgba(31,77,71,0.1)] last:border-b-0">
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenIndex(isOpen ? -1 : index)} className="flex min-h-16 w-full items-center justify-between gap-5 py-5 text-left text-base font-medium text-[#183f3a] outline-none focus-visible:ring-2 focus-visible:ring-[#a9c7c1] sm:text-lg">
                    <span>{question}</span><ChevronDown className={[
                      "size-4 shrink-0 text-[#66736f] transition-transform duration-200",
                      isOpen ? "rotate-180" : "",
                    ].join(" ")} aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div id={`faq-answer-${index}`} initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.22 }} className="overflow-hidden">
                      <p className="max-w-3xl pb-6 text-sm leading-7 text-[#66736f] sm:text-base">{answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </SectionShell>
  );
}
