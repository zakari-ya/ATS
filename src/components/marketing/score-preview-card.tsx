"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { Check, CircleAlert, Minus } from "lucide-react";

const matched = ["React", "TypeScript", "REST APIs"];

export function ScorePreviewCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl bg-[#e6f0ee] p-4 sm:p-7 lg:p-10"
    >
      <div className="absolute -right-16 -top-24 size-72 rounded-full bg-white/40 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-4">
        <p className="text-xs font-medium text-[#58716b]">Example result · illustrative data</p>
        <span className="rounded-full bg-white/72 px-3 py-1 text-xs text-[#47655f]">Backend scored</span>
      </div>

      <div className="relative mt-6 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="flex min-h-72 flex-col justify-between rounded-2xl bg-[#183f3a] p-6 text-white sm:p-8">
          <div>
            <p className="text-sm text-white/58">Final score</p>
            <div className="mt-3 flex items-end gap-3">
              <AnimatedExampleScore reducedMotion={Boolean(shouldReduceMotion)} />
              <span className="pb-2 text-sm text-[#b9d4ce]">Good match</span>
            </div>
          </div>
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-white/12">
              <motion.div initial={{ width: shouldReduceMotion ? "78%" : 0 }} whileInView={{ width: "78%" }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-[#a9c7c1]" />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/68">Score limited by one missing required skill.</p>
          </div>
        </div>

        <div className="relative min-h-72 rounded-2xl bg-white/80 p-5 sm:p-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#58716b]">Matched requirements</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {matched.map((item, index) => (
                  <motion.span key={item} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.18 + index * 0.07 }} className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f0e7] px-3 py-1.5 text-xs text-[#276948]"><Check className="size-3" aria-hidden="true" />{item}</motion.span>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[#f3f5f1] p-4">
                <p className="text-xs font-medium text-[#365a54]">Evidence excerpt</p>
                <p className="mt-2 text-sm leading-6 text-[#66736f]">“Built typed frontend features and connected REST APIs.”</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#58716b]">Missing requirements</p>
              <motion.div initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.4 }} className="mt-4 space-y-2">
                <RequirementRow name="PostgreSQL" label="Required" icon="alert" />
                <RequirementRow name="Testing" label="Preferred" icon="neutral" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.52 }} className="mt-5 rounded-xl bg-[#dcebea] p-4">
                <p className="text-xs font-medium text-[#365a54]">Improvement priority</p>
                <p className="mt-2 text-sm leading-6 text-[#365a54]">Make backend project evidence clearer.</p>
              </motion.div>
            </div>
          </div>
        </div>
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
    const controls = animate(0, 78, { duration: 0.65, ease: [0.16, 1, 0.3, 1], onUpdate: (latest) => setValue(Math.round(latest)) });
    return () => controls.stop();
  }, [isInView, reducedMotion]);

  return <span ref={ref} className="text-6xl font-semibold tabular-nums">{reducedMotion ? 78 : value}</span>;
}

function RequirementRow({ name, label, icon }: { name: string; label: string; icon: "alert" | "neutral" }) {
  const Icon = icon === "alert" ? CircleAlert : Minus;
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f7f3] px-3 py-3 text-sm"><span className="flex items-center gap-2 text-[#183f3a]"><Icon className={icon === "alert" ? "size-4 text-[#9a5b43]" : "size-4 text-[#8a6f42]"} aria-hidden="true" />{name}</span><span className="text-xs text-[#66736f]">{label}</span></div>;
}
