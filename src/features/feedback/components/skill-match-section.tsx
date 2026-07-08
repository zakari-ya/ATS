import { AlertTriangle, CheckCircle2, CircleHelp, SearchCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatMatchStatus,
  formatPriority,
} from "@/features/feedback/feedback-copy";
import type { FeedbackSkillItem } from "@/features/feedback/types";

type SkillMatchSectionVariant = "matched" | "missing-required" | "missing-preferred";

type SkillMatchSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  items: FeedbackSkillItem[];
  variant: SkillMatchSectionVariant;
};

const variantConfig = {
  matched: {
    icon: CheckCircle2,
    iconClassName: "bg-[#effaf4] text-[#17623a]",
    badgeClassName: "border-[#b9dec9] bg-[#effaf4] text-[#17623a]",
  },
  "missing-required": {
    icon: AlertTriangle,
    iconClassName: "bg-[#fff7f0] text-[#9a3412]",
    badgeClassName: "border-[#f0d0b8] bg-[#fff7f0] text-[#9a3412]",
  },
  "missing-preferred": {
    icon: CircleHelp,
    iconClassName: "bg-[#eef7f8] text-[#245f6b]",
    badgeClassName: "border-[#c8e2e6] bg-[#eef7f8] text-[#245f6b]",
  },
} as const;

export function SkillMatchSection({
  title,
  description,
  emptyMessage,
  items,
  variant,
}: SkillMatchSectionProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-2 p-4">
        <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
          <SearchCheck className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#66736f]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(31,77,71,0.18)] bg-[#f8f7f3] p-5 text-sm leading-6 text-[#66736f]">
            {emptyMessage}
          </div>
        ) : null}

        {items.map((item, index) => (
          <article
            key={`${item.requirement}-${index}`}
            className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4"
          >
            <div className="flex gap-3">
              <div
                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${config.iconClassName}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="font-medium text-[#183f3a]">
                    {item.requirement}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`${config.badgeClassName} capitalize`}
                    >
                      {formatPriority(item.priority)}
                    </Badge>
                    {item.matchStatus ? (
                      <Badge
                        variant="outline"
                        className="border-[rgba(31,77,71,0.12)] bg-white capitalize text-[#66736f]"
                      >
                        {formatMatchStatus(item.matchStatus)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {item.reason ? (
                  <p className="mt-3 text-sm leading-6 text-[#66736f]">
                    {item.reason}
                  </p>
                ) : null}

                {item.cvEvidence || item.jobEvidence ? (
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {item.cvEvidence ? (
                      <div className="rounded-xl border border-[rgba(31,77,71,0.12)] bg-white p-3">
                        <p className="font-medium text-[#183f3a]">
                          CV evidence
                        </p>
                        <p className="mt-1 leading-6 text-[#66736f]">
                          {item.cvEvidence}
                        </p>
                      </div>
                    ) : null}
                    {item.jobEvidence ? (
                      <div className="rounded-xl border border-[rgba(31,77,71,0.12)] bg-white p-3">
                        <p className="font-medium text-[#183f3a]">
                          Job evidence
                        </p>
                        <p className="mt-1 leading-6 text-[#66736f]">
                          {item.jobEvidence}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
