"use client";

import { motion, useReducedMotion } from "motion/react";

import { formatResultLabel } from "@/features/feedback/feedback-copy";
import type { ScanLabel } from "@/types/scan";

export function AnimatedScoreRing({
  score,
  label,
}: {
  score: number | null;
  label: ScanLabel | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const normalized = score === null ? 0 : Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - normalized / 100);

  return (
    <div className="relative size-44 shrink-0" role="img" aria-label={`Final score ${score === null ? "not available" : Math.round(score)} out of 100, ${formatResultLabel(label)}`}>
      <svg className="size-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <motion.circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke="#b9d4ce"
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={shouldReduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-semibold tabular-nums text-white">
          {score === null ? "—" : Math.round(score)}
        </span>
        <span className="mt-1 max-w-28 text-xs leading-4 text-white/66">
          {formatResultLabel(label)}
        </span>
      </div>
    </div>
  );
}
