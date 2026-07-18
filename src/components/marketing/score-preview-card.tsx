"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { CircleAlert } from "lucide-react";

const matched = ["React", "TypeScript", "REST APIs"];

export function ScorePreviewCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[54rem] sm:min-h-[43rem] lg:min-h-[78svh] lg:max-h-[50rem]"
      aria-label="Illustrative CVMatch result showing a score of 78"
    >
      <div className="absolute inset-x-[6%] top-1/2 hidden h-px bg-[#dfe8e5] sm:block" aria-hidden="true" />
      <div className="absolute bottom-[8%] top-[8%] left-1/2 hidden w-px bg-[#e8eeec] sm:block" aria-hidden="true" />

      <div className="relative z-10 space-y-3 pt-4 sm:contents">
      <div className="relative py-8 text-center sm:absolute sm:left-1/2 sm:top-[46%] sm:py-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#66736f]">
          Backend-calculated
        </p>
        <div className="mt-2 flex items-end justify-center gap-3">
          <AnimatedExampleScore reducedMotion={Boolean(shouldReduceMotion)} />
          <span className="pb-4 text-sm font-medium text-[#46665f]">Good match</span>
        </div>
        <div className="mx-auto mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-[#e1ebe8]">
          <motion.div
            initial={{ width: shouldReduceMotion ? "78%" : 0 }}
            whileInView={{ width: "78%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-[#183f3a]"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -18, y: 8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="relative w-full rounded-xl bg-white/94 p-4 shadow-[0_24px_50px_-34px_rgba(24,63,58,0.45)] sm:absolute sm:left-[8%] sm:top-[10%] sm:w-auto sm:max-w-[17rem]"
      >
        <p className="text-xs font-medium text-[#66736f]">Matched requirements</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {matched.map((item) => (
            <span key={item} className="rounded-full bg-[#e5f1ed] px-3 py-1.5 text-xs font-medium text-[#276948]">
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 18, y: 8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="relative w-full rounded-xl bg-[#f5f1e9] p-4 shadow-[0_24px_50px_-34px_rgba(24,63,58,0.38)] sm:absolute sm:right-[6%] sm:top-[15%] sm:w-[15rem]"
      >
        <p className="text-xs font-medium text-[#77684f]">Missing required</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#654936]">
          <CircleAlert className="size-4" aria-hidden="true" />
          PostgreSQL
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -14, y: -8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.34 }}
        className="relative w-full rounded-xl bg-[#183f3a] p-5 text-white shadow-[0_26px_54px_-30px_rgba(24,63,58,0.55)] sm:absolute sm:bottom-[10%] sm:left-[10%] sm:w-auto sm:max-w-[19rem]"
      >
        <p className="text-xs font-medium text-white/58">Score cap</p>
        <p className="mt-2 text-sm leading-6 text-white/78">
          Limited by one missing required skill.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 14, y: -8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.44 }}
        className="relative w-full rounded-xl bg-[#dcebea] p-5 shadow-[0_24px_50px_-34px_rgba(24,63,58,0.42)] sm:absolute sm:right-[8%] sm:bottom-[10%] sm:w-auto sm:max-w-[18rem]"
      >
        <p className="text-xs font-medium text-[#526c66]">Practical next step</p>
        <p className="mt-2 text-sm leading-6 text-[#365a54]">
          Make backend project evidence clearer.
        </p>
      </motion.div>

      <p className="relative pt-3 text-center text-[0.68rem] text-[#86938f] sm:absolute sm:bottom-0 sm:left-1/2 sm:pt-0 sm:-translate-x-1/2">
        Illustrative data, not a real user result
      </p>
      </div>
    </motion.div>
  );
}

function AnimatedExampleScore({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const [value, setValue] = useState(reducedMotion ? 78 : 0);

  useEffect(() => {
    if (!isInView || reducedMotion) {
      return;
    }

    const controls = animate(0, 78, {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [isInView, reducedMotion]);

  return (
    <span ref={ref} className="font-display text-[7rem] leading-none text-[#183f3a] sm:text-[10rem]">
      {reducedMotion ? 78 : value}
    </span>
  );
}
