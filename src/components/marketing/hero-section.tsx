"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  History,
  LayoutDashboard,
  Play,
  Search,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const mainItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "New Scan", icon: Upload },
  { label: "History", icon: History },
  { label: "Results", icon: CheckCircle2 },
  { label: "Settings", icon: Settings },
];

const workspaceItems = ["Usage", "Feedback", "Privacy", "Help"];

const actionItems = [
  "Upload CV",
  "Paste Job",
  "Analyze",
  "View Result",
  "History",
  "Delete Scan",
  "Daily limits",
];

const requirementRows = [
  { label: "React + TypeScript", status: "Matched", tone: "good" },
  { label: "REST APIs", status: "Matched", tone: "good" },
  { label: "PostgreSQL", status: "Missing", tone: "warning" },
  { label: "Docker", status: "Partial", tone: "neutral" },
];

const recentRows = [
  ["Today", "Frontend Developer", "82", "Completed"],
  ["Today", "Full Stack Intern", "78", "Completed"],
  ["Yesterday", "Backend Developer", "61", "Needs work"],
  ["Jun 30", "React Developer", "88", "Completed"],
];

export function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center px-[15px] pb-0 text-[#183f3a] sm:px-5 lg:px-6 xl:px-7">
      <video
        className="absolute inset-0 z-0 size-full object-cover opacity-40"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(251,250,247,0.86)_0%,rgba(248,247,243,0.78)_48%,rgba(248,247,243,0.95)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-0 h-1/3 bg-[radial-gradient(circle_at_center,rgba(169,199,193,0.32),transparent_58%)]"
      />

      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center overflow-hidden">
        <div className="flex shrink-0 flex-col items-center pt-3 text-center sm:pt-5 lg:pt-6">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(31,77,71,0.12)] bg-white/74 px-4 py-1.5 text-sm text-[#66736f] shadow-[0_12px_32px_-24px_rgba(31,77,71,0.42)] backdrop-blur-xl sm:mb-5"
          >
            <Sparkles className="size-3.5 text-[#1f4d47]" aria-hidden="true" />
            ATS-style CV match analysis
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="max-w-[42rem] text-balance font-display text-[2.75rem] leading-[0.95] tracking-tight text-[#183f3a] sm:text-6xl lg:text-[5rem]"
          >
            See how your CV{" "}
            <span className="font-display italic">matches</span> a job before
            you apply
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-4 max-w-[650px] text-base leading-relaxed text-[#66736f] sm:text-lg"
          >
            Upload a text-based CV PDF, paste a job description, and get a
            structured match score with missing skills, strong points, and
            practical next steps.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-5 flex items-center gap-3"
          >
            <Button
              asChild
              className="h-11 rounded-full bg-[#183f3a] px-6 text-sm font-medium text-white shadow-[0_18px_42px_-25px_rgba(31,77,71,0.72)] hover:bg-[#1f4d47]"
            >
              <Link href="/scan">Start free scan</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon-lg"
              className="size-11 rounded-full border-0 bg-white/82 text-[#183f3a] shadow-[0_2px_12px_rgba(31,77,71,0.14)] backdrop-blur-xl hover:bg-white"
            >
              <Link href="#how-it-works" aria-label="See how it works">
                <Play className="size-4 fill-current" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
            className="mt-3 max-w-md text-sm leading-6 text-[#66736f]"
          >
            No hiring decision. No fake guarantees. Just clear job-specific
            feedback.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="pointer-events-none mt-4 w-full max-w-5xl select-none sm:mt-5 lg:mt-7"
        >
          <div
            className="overflow-hidden rounded-2xl p-2.5 backdrop-blur-xl sm:p-3 md:p-4"
            style={{
              background: "rgba(255, 255, 255, 0.42)",
              border: "1px solid rgba(255, 255, 255, 0.58)",
              boxShadow:
                "0 25px 80px -12px rgba(31, 77, 71, 0.16), 0 0 0 1px rgba(31, 77, 71, 0.08)",
            }}
          >
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="h-[390px] overflow-hidden rounded-xl border border-[rgba(31,77,71,0.1)] bg-white text-[11px] text-[#183f3a] shadow-sm sm:h-[420px] lg:h-[450px]">
      <div className="flex h-12 items-center justify-between border-b border-[rgba(31,77,71,0.1)] bg-white px-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-lg border border-[rgba(31,77,71,0.12)] bg-white shadow-[0_10px_22px_-20px_rgba(31,77,71,0.28)]">
            <Image
              src="/cvmatch-logo-mark.png"
              alt=""
              width={64}
              height={64}
              className="size-4 object-contain"
            />
          </div>
          <span className="font-semibold">CVMatch</span>
          <ChevronDown className="size-3.5 text-[#66736f]" />
        </div>
        <div className="hidden min-w-72 items-center justify-between rounded-full border border-[rgba(31,77,71,0.1)] bg-[#f8f7f3] px-3 py-1.5 text-[#66736f] md:flex">
          <span className="inline-flex items-center gap-2">
            <Search className="size-3.5" />
            Search scans
          </span>
          <span className="rounded-md border border-[rgba(31,77,71,0.1)] bg-white px-1.5 py-0.5 text-[10px]">
            ⌘K
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-[#183f3a] px-3 py-1.5 font-medium text-white sm:inline-flex">
            New Scan
          </span>
          <Bell className="size-4 text-[#66736f]" />
          <div className="flex size-7 items-center justify-center rounded-full bg-[#dcebea] text-[10px] font-semibold text-[#183f3a]">
            ZA
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-3rem)]">
        <aside className="hidden w-40 shrink-0 border-r border-[rgba(31,77,71,0.1)] bg-[#fbfaf7] p-3 md:block">
          <div className="space-y-1.5">
            {mainItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={[
                    "flex items-center gap-2 rounded-lg px-2.5 py-2",
                    item.active
                      ? "bg-[#183f3a] text-white"
                      : "text-[#66736f]",
                  ].join(" ")}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66736f]">
            Workspace
          </div>
          <div className="mt-2 space-y-1.5">
            {workspaceItems.map((item) => (
              <div
                key={item}
                className="rounded-lg px-2.5 py-1.5 text-[#66736f]"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden bg-[#eef4f2]/45 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Welcome back</p>
              <p className="mt-0.5 text-[11px] text-[#66736f]">
                Review your latest CV match analysis.
              </p>
            </div>
            <div className="hidden items-center gap-1.5 lg:flex">
              {actionItems.map((item, index) => (
                <span
                  key={item}
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-medium",
                    index === 2
                      ? "bg-[#183f3a] text-white"
                      : "bg-white text-[#66736f]",
                  ].join(" ")}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[rgba(31,77,71,0.1)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Latest CV Match</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-semibold leading-none tracking-tight text-[#183f3a]">
                      78
                    </span>
                    <span className="rounded-full bg-[#dcebea] px-2 py-1 text-[10px] font-medium text-[#1f4d47]">
                      Good match
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="size-4 text-[#2d7a56]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                <Metric label="Matched skills" value="React, TS, APIs" />
                <Metric label="Missing required" value="PostgreSQL" />
                <Metric label="Score cap" value="Skill missing" />
              </div>
              <AreaChart />
            </div>

            <div className="rounded-xl border border-[rgba(31,77,71,0.1)] bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Requirements</p>
                <CircleAlert className="size-4 text-[#66736f]" />
              </div>
              <div className="mt-3 space-y-2">
                {requirementRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-[#f8f7f3] px-3 py-2"
                  >
                    <span className="font-medium">{row.label}</span>
                    <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[rgba(31,77,71,0.1)] bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Recent Scans</p>
              <Clock3 className="size-4 text-[#66736f]" />
            </div>
            <div className="mt-3 grid grid-cols-[0.8fr_1.5fr_0.6fr_0.8fr] gap-2 border-b border-[rgba(31,77,71,0.1)] pb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#66736f]">
              <span>Date</span>
              <span>Job Role</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-[rgba(31,77,71,0.08)]">
              {recentRows.map((row) => (
                <div
                  key={`${row[0]}-${row[1]}`}
                  className="grid grid-cols-[0.8fr_1.5fr_0.6fr_0.8fr] gap-2 py-2"
                >
                  {row.map((cell) => (
                    <span key={cell} className="truncate text-[#365a54]">
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8f7f3] p-2">
      <p className="text-[#66736f]">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: string;
  children: ReactNode;
}) {
  const className =
    tone === "good"
      ? "bg-[#e8f5ee] text-[#2d7a56]"
      : tone === "warning"
        ? "bg-[#fff4e4] text-[#8a5a1f]"
        : "bg-[#eef4f2] text-[#66736f]";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] ${className}`}>
      {children}
    </span>
  );
}

function AreaChart() {
  return (
    <svg
      viewBox="0 0 360 110"
      className="mt-4 h-20 w-full"
      role="img"
      aria-label="Decorative score trend chart"
    >
      <defs>
        <linearGradient id="cvmatch-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1f4d47" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1f4d47" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 85 C48 70 54 38 102 47 C151 56 144 18 198 26 C249 33 251 67 300 47 C333 34 344 24 360 18 L360 110 L0 110 Z"
        fill="url(#cvmatch-area)"
      />
      <path
        d="M0 85 C48 70 54 38 102 47 C151 56 144 18 198 26 C249 33 251 67 300 47 C333 34 344 24 360 18"
        fill="none"
        stroke="#1f4d47"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
