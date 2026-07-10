"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ScanHistoryCard } from "@/features/scan/components/scan-history-card";
import { ScanHistoryEmptyState } from "@/features/scan/components/scan-history-empty-state";
import type { ScanHistoryItem } from "@/features/scan/types";

const IN_PROGRESS = new Set([
  "created", "uploading", "uploaded", "validating_file", "extracting_text", "analyzing", "scoring",
]);

export function ScanHistoryList({ scans }: { scans: ScanHistoryItem[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [label, setLabel] = useState("all");
  const [sort, setSort] = useState("newest");

  const filteredScans = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("en");
    return scans
      .filter((scan) => !normalizedSearch || (scan.jobTitle ?? "Untitled scan").toLocaleLowerCase("en").includes(normalizedSearch))
      .filter((scan) => {
        if (status === "all") return true;
        if (status === "in_progress") return IN_PROGRESS.has(scan.currentStatus);
        return scan.currentStatus === status;
      })
      .filter((scan) => label === "all" || scan.finalLabel === label)
      .sort((left, right) => {
        if (sort === "oldest") return Date.parse(left.createdAt) - Date.parse(right.createdAt);
        if (sort === "score_high") return (right.finalScore ?? -1) - (left.finalScore ?? -1);
        if (sort === "score_low") return (left.finalScore ?? 101) - (right.finalScore ?? 101);
        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      });
  }, [label, scans, search, sort, status]);

  if (scans.length === 0) return <ScanHistoryEmptyState />;

  const scoredScans = scans.filter((scan): scan is ScanHistoryItem & { finalScore: number } => scan.currentStatus === "completed" && scan.finalScore !== null);
  const average = scoredScans.length ? scoredScans.reduce((sum, scan) => sum + scan.finalScore, 0) / scoredScans.length : null;
  const highest = scoredScans.length ? Math.max(...scoredScans.map((scan) => scan.finalScore)) : null;
  const failed = scans.filter((scan) => scan.currentStatus === "failed").length;

  return (
    <div className="space-y-4">
      <section className="grid overflow-hidden rounded-xl bg-[#eef4f2] sm:grid-cols-4" aria-label="History summary">
        <HistoryStat label="Visible scans" value={String(scans.length)} />
        <HistoryStat label="Completed" value={String(scoredScans.length)} />
        <HistoryStat label="Recent average" value={average === null ? "—" : `${Math.round(average)}%`} />
        <HistoryStat label="Highest / failed" value={`${highest === null ? "—" : `${Math.round(highest)}%`} · ${failed}`} />
      </section>

      {scoredScans.length >= 2 ? <HistoryScoreStrip scans={scoredScans} /> : null}

      <section className="rounded-xl bg-white p-3 sm:p-4">
        <div className="grid gap-2 md:grid-cols-[minmax(14rem,1fr)_auto_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search scans by job title</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736f]" aria-hidden="true" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job titles" className="h-11 border-[#cfe2de] bg-[#f8f7f3] pl-9" />
          </label>
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[
            ["all", "All statuses"], ["completed", "Completed"], ["in_progress", "In progress"], ["failed", "Failed"],
          ]} />
          <FilterSelect label="Label" value={label} onChange={setLabel} options={[
            ["all", "All labels"], ["great_match", "Great match"], ["good_match", "Good match"], ["needs_improvement", "Needs improvement"], ["low_match", "Low match"],
          ]} />
          <FilterSelect label="Sort" value={sort} onChange={setSort} options={[
            ["newest", "Newest"], ["oldest", "Oldest"], ["score_high", "Highest score"], ["score_low", "Lowest score"],
          ]} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#66736f]">
          <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="size-3.5" aria-hidden="true" />{filteredScans.length} result{filteredScans.length === 1 ? "" : "s"}</span>
          {(search || status !== "all" || label !== "all" || sort !== "newest") ? (
            <button type="button" className="font-medium text-[#183f3a] underline-offset-4 hover:underline" onClick={() => { setSearch(""); setStatus("all"); setLabel("all"); setSort("newest"); }}>Clear filters</button>
          ) : null}
        </div>
      </section>

      {filteredScans.length === 0 ? (
        <div className="rounded-xl bg-white p-7 text-center">
          <h2 className="font-semibold text-[#183f3a]">No scans match these filters</h2>
          <p className="mt-2 text-sm text-[#66736f]">Clear the filters or search for another job title.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white">
          <AnimatePresence initial={false}>
            {filteredScans.map((scan) => (
              <motion.div key={scan.id} layout={!shouldReduceMotion} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                <ScanHistoryCard scan={scan} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-[#cfe2de] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-xs font-medium text-[#66736f]">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums text-[#183f3a]">{value}</p></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-36 rounded-md border border-[#cfe2de] bg-[#f8f7f3] px-3 text-sm text-[#183f3a] outline-none focus-visible:ring-2 focus-visible:ring-[#a9c7c1]">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function HistoryScoreStrip({ scans }: { scans: Array<ScanHistoryItem & { finalScore: number }> }) {
  const ordered = [...scans].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const points = ordered.map((scan, index) => `${ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100},${100 - scan.finalScore}`).join(" ");
  return (
    <section className="rounded-xl bg-[#183f3a] px-4 py-3 text-white" aria-label={`Score trend across ${ordered.length} completed visible scans`}>
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-white/55">Visible score trend</p><p className="mt-1 text-sm font-medium">{ordered.length} completed scans</p></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-12 w-40 overflow-visible" aria-hidden="true"><polyline points={points} fill="none" stroke="#b9d4ce" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
    </section>
  );
}
