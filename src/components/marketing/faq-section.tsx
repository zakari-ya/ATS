"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

import {
  SectionShell,
  marketingBodyClassName,
  marketingFadeUp,
  marketingSerifStyle,
  marketingSoftPanelClassName,
} from "./section-shell";

const faqs = [
  {
    question: "Does this guarantee I will get hired?",
    answer:
      "No. It gives structured feedback on how your CV matches a job description. It is not a hiring decision.",
  },
  {
    question: "Why do scanned PDFs fail?",
    answer:
      "Scanned PDFs often contain images instead of selectable text. Upload a text-based PDF where the text can be copied.",
  },
  {
    question: "Does AI decide my final score?",
    answer:
      "No. AI extracts structured matching information. The backend validates the output and calculates the final score.",
  },
  {
    question: "Can I delete my scans?",
    answer:
      "Yes. Deleting a scan removes the analysis and uploaded CV file from storage.",
  },
  {
    question: "Why are there daily limits?",
    answer:
      "Limits protect the service from abuse and keep the free version available.",
  },
];

export function FAQSection() {
  return (
    <SectionShell id="faq" className="pb-16 lg:pb-20">
      <motion.div {...marketingFadeUp}>
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="text-balance text-[2.4rem] leading-[1.02] tracking-tight text-[#183f3a] sm:text-[3rem]"
            style={marketingSerifStyle}
          >
            Questions before you scan?
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl ${marketingBodyClassName}`}>
            The product should stay clear about what it does, what it does not
            do, and how the result is controlled.
          </p>
        </div>

        <div
          className={`${marketingSoftPanelClassName} mx-auto mt-8 max-w-4xl p-4 sm:p-5`}
        >
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.details
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.04,
                  ease: "easeOut",
                }}
                className="group rounded-[24px] bg-white/68 px-5 py-4 shadow-[0_18px_40px_-34px_rgba(31,77,71,0.24)]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base leading-6 text-[#1f4d47] [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown
                    className="mt-0.5 size-4 shrink-0 text-[#66736f] transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pt-4 text-sm leading-7 text-[#66736f]">
                  {faq.answer}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
