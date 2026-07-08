"use client";

import { motion } from "motion/react";
import { ArrowUpRight, CircleAlert, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  marketingPanelClassName,
  marketingSerifStyle,
  marketingSoftPanelClassName,
} from "./section-shell";

const matched = ["React", "TypeScript", "REST APIs"];
const missing = ["PostgreSQL", "Docker"];

type ScorePreviewCardProps = {
  className?: string;
};

export function ScorePreviewCard({ className }: ScorePreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        marketingSoftPanelClassName,
        "relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8",
        className,
      )}
    >
      <div className="absolute -left-12 top-16 h-52 w-52 rounded-full bg-white/46 blur-3xl" />
      <div className="absolute bottom-10 right-8 h-32 w-32 rounded-full bg-[#dcebea]/55 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#66736f]">Latest CV Match</p>
            <div className="mt-3 flex items-end gap-3">
              <span
                className="text-[4.2rem] leading-none tracking-tight text-[#183f3a]"
                style={marketingSerifStyle}
              >
                78
              </span>
              <span className="mb-2 rounded-full bg-white/78 px-3 py-1 text-sm text-[#1f4d47] shadow-[0_14px_28px_-22px_rgba(31,77,71,0.26)]">
                Good match
              </span>
            </div>
          </div>
          <div className="rounded-full bg-white/72 px-3 py-1 text-[11px] tracking-[0.16em] text-[#58716b] shadow-[0_14px_24px_-22px_rgba(31,77,71,0.26)]">
            Structured evidence
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] bg-white/76 p-5 shadow-[0_22px_60px_-42px_rgba(31,77,71,0.24)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm text-[#66736f]">Score line</p>
              <div className="h-2.5 w-full max-w-[18rem] overflow-hidden rounded-full bg-[#e6f0ee]">
                <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#183f3a,#5b8f80,#a9c7c1)]" />
              </div>
            </div>
            <ArrowUpRight className="size-4 text-[#58716b]" aria-hidden="true" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {matched.map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#eef4f2] px-3 py-1.5 text-sm text-[#365a54]"
              >
                {item}
              </span>
            ))}
            {missing.map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#f8f7f3] px-3 py-1.5 text-sm text-[#8a5a1f]"
              >
                {item} missing
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className={`${marketingPanelClassName} rounded-[24px] p-4`}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#66736f]">
                Score cap
              </p>
              <p className="mt-2 text-sm leading-6 text-[#1f4d47]">
                Score capped by one missing required skill.
              </p>
            </div>
            <div className={`${marketingPanelClassName} rounded-[24px] p-4`}>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#1f4d47]" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#66736f]">
                    Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#1f4d47]">
                    Make backend project evidence clearer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-[#66736f]">
            <CircleAlert
              className="mr-2 inline size-4 text-[#8a5a1f]"
              aria-hidden="true"
            />
            Add PostgreSQL only if you have real experience with it.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
