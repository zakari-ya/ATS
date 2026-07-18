"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { SectionShell, marketingFadeUp, marketingSerifStyle } from "./section-shell";

const faqs = [
  [
    "Does this guarantee I will get hired?",
    "No. It gives structured feedback on how your CV matches a job description. It is not a hiring decision.",
  ],
  [
    "Why do scanned PDFs fail?",
    "Scanned PDFs often contain images instead of selectable text. Upload a text-based PDF where the text can be copied.",
  ],
  [
    "Does AI decide my final score?",
    "No. AI extracts structured matching information. The backend validates the output and calculates the final score.",
  ],
  [
    "Can I delete my scans?",
    "Yes. Deleting a scan removes the analysis and uploaded CV file from storage.",
  ],
  [
    "Why are there daily limits?",
    "Limits protect the service from abuse and keep the free version available.",
  ],
] as const;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionShell id="faq" className="bg-white py-20 sm:py-24 lg:py-32">
      <motion.div {...marketingFadeUp} className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div className="lg:pl-[4vw]">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]">
            Before your first scan
          </p>
          <h2
            className="mt-4 max-w-xl text-balance text-[3rem] leading-[0.98] text-[#183f3a] sm:text-[4.3rem]"
            style={marketingSerifStyle}
          >
            Questions, answered clearly.
          </h2>
        </div>

        <div>
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-[rgba(31,77,71,0.11)] first:border-t">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex min-h-20 w-full items-center justify-between gap-6 py-5 text-left text-base font-medium text-[#183f3a] outline-none focus-visible:ring-2 focus-visible:ring-[#a9c7c1] sm:text-lg"
                  >
                    <span>{question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-[#66736f] transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-3xl pb-6 text-sm leading-7 text-[#66736f] sm:text-base">
                        {answer}
                      </p>
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
