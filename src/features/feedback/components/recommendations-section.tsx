import { CheckCircle2, Lightbulb, Wrench } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecommendationsSectionProps = {
  strongPoints: string[];
  weakPoints: string[];
  recommendations: string[];
};

export function RecommendationsSection({
  strongPoints,
  weakPoints,
  recommendations,
}: RecommendationsSectionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FeedbackListCard
        title="Strong points"
        description="Evidence already visible in the CV."
        emptyMessage="No strong points were returned for this analysis."
        items={strongPoints}
        icon={CheckCircle2}
        tone="green"
      />
      <FeedbackListCard
        title="Weak points"
        description="Areas where the evidence is thin or unclear."
        emptyMessage="No weak points were returned for this analysis."
        items={weakPoints}
        icon={Wrench}
        tone="amber"
      />
      <FeedbackListCard
        title="Recommended improvements"
        description="Practical CV updates to consider."
        emptyMessage="No recommendations were returned for this analysis."
        items={recommendations}
        icon={Lightbulb}
        tone="blue"
      />
    </div>
  );
}

type FeedbackListCardProps = {
  title: string;
  description: string;
  emptyMessage: string;
  items: string[];
  icon: typeof CheckCircle2;
  tone: "green" | "amber" | "blue";
};

const toneClassName = {
  green: "bg-[#effaf4] text-[#17623a]",
  amber: "bg-[#fff7f0] text-[#9a3412]",
  blue: "bg-[#eef7f8] text-[#245f6b]",
} as const;

function FeedbackListCard({
  title,
  description,
  emptyMessage,
  items,
  icon: Icon,
  tone,
}: FeedbackListCardProps) {
  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-2 p-4">
        <div
          className={`mb-2 flex size-11 items-center justify-center rounded-2xl ${toneClassName[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight text-[#183f3a]">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#66736f]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[rgba(31,77,71,0.18)] bg-[#f8f7f3] p-4 text-sm leading-6 text-[#66736f]">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4 text-sm leading-6 text-[#183f3a]"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
