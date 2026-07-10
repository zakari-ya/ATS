"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardScorePoint } from "@/types/dashboard";

type ScoreTrendChartProps = {
  data: DashboardScorePoint[];
};

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const shouldReduceMotion = useReducedMotion();
  if (data.length < 2) {
    return (
      <section className="flex min-h-72 flex-col justify-between rounded-xl bg-white p-5">
        <div>
          <p className="text-sm font-medium text-[#66736f]">Score trend</p>
          <h2 className="mt-1 text-xl font-semibold text-[#183f3a]">
            Your scores over time
          </h2>
        </div>
        <div className="py-7">
          <p className="max-w-md text-sm leading-6 text-[#66736f]">
            Complete at least two scans to see how your match scores change over
            time.
          </p>
          <Button asChild className="mt-4 bg-[#183f3a] text-white hover:bg-[#1f4d47]">
            <Link href="/scan">Start another scan</Link>
          </Button>
        </div>
      </section>
    );
  }

  const chartData = data.map((point, index) => ({
    ...point,
    index: index + 1,
    shortDate: formatChartDate(point.date),
  }));
  const firstScore = data[0]?.score ?? 0;
  const latestScore = data.at(-1)?.score ?? 0;
  const direction = latestScore - firstScore;
  const summary =
    direction === 0
      ? `Your latest score is unchanged from the first score in this ${data.length}-scan view.`
      : `Your latest score is ${Math.abs(Math.round(direction))} points ${direction > 0 ? "higher" : "lower"} than the first score in this ${data.length}-scan view.`;

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5" aria-labelledby="score-trend-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#66736f]">Score trend</p>
          <h2 id="score-trend-title" className="mt-1 text-xl font-semibold text-[#183f3a]">
            Recent completed scans
          </h2>
        </div>
        <p className="text-sm text-[#66736f]">Latest {data.length} · score 0–100</p>
      </div>

      <div className="mt-5 h-64 w-full" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f4d47" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#1f4d47" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(31,77,71,0.09)" />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#66736f", fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#66736f", fontSize: 11 }}
            />
            <Tooltip content={<ScoreTooltip />} cursor={{ stroke: "rgba(31,77,71,0.18)" }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#183f3a"
              strokeWidth={2.5}
              fill="url(#scoreTrendFill)"
              dot={{ r: 3, fill: "#f8f7f3", stroke: "#183f3a", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#183f3a", stroke: "#f8f7f3", strokeWidth: 2 }}
              animationDuration={420}
              isAnimationActive={!shouldReduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#66736f]">{summary}</p>
    </section>
  );
}

function ScoreTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DashboardScorePoint & { shortDate: string } }> }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="max-w-56 rounded-lg bg-[#183f3a] p-3 text-xs text-white shadow-md">
      <p className="font-medium">{point.jobTitle}</p>
      <p className="mt-1 text-white/68">{point.shortDate}</p>
      <p className="mt-2 text-sm font-semibold">{Math.round(point.score)} · {point.finalLabel ? formatScoreLabel(point.finalLabel) : "Completed"}</p>
    </div>
  );
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
