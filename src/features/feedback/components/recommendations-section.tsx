import { CheckCircle2, Lightbulb, Wrench } from "lucide-react";

export function RecommendationsSection({
  strongPoints,
  weakPoints,
  recommendations,
}: {
  strongPoints: string[];
  weakPoints: string[];
  recommendations: string[];
}) {
  return (
    <section className="grid items-start gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-xl bg-[#eef4f2] p-5">
        <p className="text-sm font-medium text-[#66736f]">Evidence review</p>
        <h2 className="mt-1 text-xl font-semibold text-[#183f3a]">What helps and what needs clarity</h2>
        <FeedbackList title="Strong points" items={strongPoints} empty="No strong points were stored." icon={CheckCircle2} tone="positive" />
        <FeedbackList title="Weak points" items={weakPoints} empty="No weak points were stored." icon={Wrench} tone="warning" />
      </div>
      <div className="rounded-xl bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#183f3a] text-white"><Lightbulb className="size-4" aria-hidden="true" /></span>
          <div><p className="text-sm font-medium text-[#66736f]">Improvement plan</p><h2 className="text-xl font-semibold text-[#183f3a]">Recommended next actions</h2></div>
        </div>
        {recommendations.length ? (
          <ol className="mt-5 space-y-0">
            {recommendations.map((item, index) => (
              <li key={`${item}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[#e1e9e7] py-4 first:pt-0 last:border-b-0 last:pb-0">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#dcebea] text-xs font-semibold text-[#183f3a]">{index + 1}</span>
                <p className="pt-1 text-sm leading-6 text-[#365a54]">{item}</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-5 text-sm leading-6 text-[#66736f]">No recommendations were stored for this analysis.</p>}
        <p className="mt-5 text-xs leading-5 text-[#66736f]">Only add skills or experience that are true. Clearer evidence is more useful than keyword stuffing.</p>
      </div>
    </section>
  );
}

function FeedbackList({ title, items, empty, icon: Icon, tone }: { title: string; items: string[]; empty: string; icon: typeof CheckCircle2; tone: "positive" | "warning" }) {
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183f3a]"><Icon className={`size-4 ${tone === "positive" ? "text-[#276948]" : "text-[#9a6a27]"}`} aria-hidden="true" />{title}</h3>
      {items.length ? <ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="text-sm leading-6 text-[#55706b]">{item}</li>)}</ul> : <p className="mt-2 text-sm text-[#66736f]">{empty}</p>}
    </div>
  );
}
