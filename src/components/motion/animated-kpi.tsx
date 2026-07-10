"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type AnimatedKpiProps = {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function AnimatedKpi({
  value,
  suffix = "",
  decimals = 0,
  className,
}: AnimatedKpiProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(
    shouldReduceMotion ? value : 0
  );
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    hasAnimated.current = true;
    const startedAt = performance.now();
    const duration = 420;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [shouldReduceMotion, value]);

  return (
    <span className={className} aria-label={`${value}${suffix}`}>
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
