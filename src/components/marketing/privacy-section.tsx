"use client";

import Image from "next/image";
import { useRef } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { SectionShell, marketingSerifStyle } from "./section-shell";

const controls = [
  "Private CV uploads",
  "User-owned scan history",
  "Validated AI JSON",
  "Backend-calculated score",
  "Delete scans anytime",
];

export function PrivacySection() {
  const artworkRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: artworkRef,
    offset: ["start end", "end start"],
  });
  const artworkY = useTransform(scrollYProgress, [0, 1], [28, -28]);

  return (
    <SectionShell
      id="privacy"
      className="relative min-h-[100svh] bg-white py-16 sm:py-20 lg:flex lg:min-h-dvh lg:items-center lg:py-24"
    >
      <div className="grid w-full gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          className="lg:pl-[4vw]"
        >
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#66736f]">
            Privacy and control
          </p>
          <h2
            className="mt-4 max-w-2xl text-balance text-[3rem] leading-[0.98] text-[#183f3a] sm:text-[4.3rem] xl:text-[5.4rem]"
            style={marketingSerifStyle}
          >
            Private by design. Clear by default.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#66736f] sm:text-lg">
            Your CV is handled as private user data. AI output is validated
            before use, and final scores are calculated by backend code.
          </p>

          <ul className="mt-9 max-w-xl space-y-4">
            {controls.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-center gap-3 text-sm text-[#365a54] sm:text-base"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e6f0ee]">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-[#70817d]">
            <span>No hiring decision</span>
            <span>No fake guarantees</span>
          </div>
        </motion.div>

        <div
          ref={artworkRef}
          className="relative mx-auto flex min-h-[28rem] w-full max-w-[52rem] items-center justify-center sm:min-h-[36rem] lg:min-h-[76svh]"
        >
          <div className="absolute inset-x-[5%] top-1/2 h-px bg-[#e4ece9]" aria-hidden="true" />
          <motion.div
            style={shouldReduceMotion ? undefined : { y: artworkY }}
            className="relative h-[22rem] w-full sm:h-[30rem] lg:h-[58svh] lg:max-h-[37rem]"
          >
            <Image
              src="/marketing/cvmatch-privacy-art.png"
              alt="Abstract CVMatch artwork representing private, controlled information"
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 760px, 820px"
              className="object-contain drop-shadow-[0_30px_38px_rgba(24,63,58,0.16)]"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.42, delay: 0.3 }}
            className="absolute bottom-[7%] right-[3%] max-w-[13rem] text-right text-xs leading-5 text-[#66736f] sm:right-[8%]"
          >
            AI analyzes structured evidence. Backend code remains in control of
            the final result.
          </motion.p>
        </div>
      </div>
    </SectionShell>
  );
}
