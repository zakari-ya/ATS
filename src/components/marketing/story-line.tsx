"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function StoryLine() {
  const railRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 75%", "end 35%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={railRef}
      className="pointer-events-none absolute inset-y-24 left-[1.85rem] z-0 hidden w-px lg:block xl:left-[2.1rem]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(31,77,71,0.13)_5%,rgba(31,77,71,0.13)_95%,transparent)]" />
      <motion.div
        className="absolute inset-x-0 top-0 h-full origin-top bg-[linear-gradient(180deg,#a9c7c1,#1f4d47_48%,#a9c7c1)]"
        style={{ scaleY: shouldReduceMotion ? 1 : scaleY }}
      />
    </div>
  );
}

export function StoryNode({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "absolute -left-[0.45rem] top-2 hidden size-3 rounded-full ring-4 lg:block",
        tone === "dark"
          ? "bg-[#dcebea] ring-[#1f4d47]"
          : "bg-[#1f4d47] ring-[#fbfaf7]",
      ].join(" ")}
    />
  );
}
