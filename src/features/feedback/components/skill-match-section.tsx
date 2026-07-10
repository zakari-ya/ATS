import { AlertTriangle, CheckCircle2, ChevronDown, CircleHelp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMatchStatus, formatPriority } from "@/features/feedback/feedback-copy";
import type { FeedbackSkillItem } from "@/features/feedback/types";

type Variant = "matched" | "missing-required" | "missing-preferred";

const variants = {
  matched: { icon: CheckCircle2, surface: "bg-[#effaf4]", iconColor: "text-[#17623a]", badge: "border-[#b9dec9] bg-[#effaf4] text-[#17623a]" },
  "missing-required": { icon: AlertTriangle, surface: "bg-[#fff7f0]", iconColor: "text-[#9a3412]", badge: "border-[#f0d0b8] bg-[#fff7f0] text-[#9a3412]" },
  "missing-preferred": { icon: CircleHelp, surface: "bg-[#eef4f2]", iconColor: "text-[#365a54]", badge: "border-[#cfe2de] bg-[#eef4f2] text-[#365a54]" },
} as const;

export function SkillMatchSection({
  title,
  description,
  emptyMessage,
  items,
  variant,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  items: FeedbackSkillItem[];
  variant: Variant;
}) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <section className="overflow-hidden rounded-xl bg-white">
      <header className={`flex gap-3 p-4 sm:p-5 ${config.surface}`}>
        <Icon className={`mt-0.5 size-5 shrink-0 ${config.iconColor}`} aria-hidden="true" />
        <div><h2 className="text-lg font-semibold text-[#183f3a]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#66736f]">{description}</p></div>
      </header>
      <div className="divide-y divide-[rgba(31,77,71,0.1)]">
        {items.length === 0 ? <p className="p-5 text-sm leading-6 text-[#66736f]">{emptyMessage}</p> : null}
        {items.map((item, index) => (
          <details key={`${item.requirement}-${index}`} className="group p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c7c1] [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <h3 className="font-medium text-[#183f3a]">{item.requirement}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className={`${config.badge} capitalize`}>{formatPriority(item.priority)}</Badge>
                  {item.matchStatus ? <Badge variant="outline" className="border-[#d9e3e0] bg-[#f8f7f3] text-[#66736f]">{formatMatchStatus(item.matchStatus)}</Badge> : null}
                  {item.confidence !== null ? <span className="self-center text-xs text-[#66736f]">{Math.round(item.confidence * 100)}% confidence</span> : null}
                </div>
              </div>
              <ChevronDown className="mt-1 size-4 shrink-0 text-[#66736f] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <div className="mt-4 space-y-3 pl-0 sm:pl-1">
              {item.reason ? <p className="text-sm leading-6 text-[#55706b]">{item.reason}</p> : null}
              {item.cvEvidence ? <Evidence label="CV evidence" text={item.cvEvidence} /> : null}
              {item.jobEvidence ? <Evidence label="Job evidence" text={item.jobEvidence} /> : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Evidence({ label, text }: { label: string; text: string }) {
  return <div className="rounded-lg bg-[#f8f7f3] p-3.5"><p className="text-xs font-semibold text-[#365a54]">{label}</p><p className="mt-1 text-sm leading-6 text-[#66736f]">{text}</p></div>;
}
