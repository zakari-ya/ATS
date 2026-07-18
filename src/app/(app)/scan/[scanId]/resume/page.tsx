import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResumeBuilderWorkspace } from "@/features/resume-builder/components/resume-builder-workspace";
import { parseSkillItems } from "@/features/feedback/types";
import { getResumeDraftForScan } from "@/lib/resume-builder/resume-draft-repository";
import { getResumeProfileForScan } from "@/lib/resume-builder/resume-profile-repository";
import { classifyResumeRequirement } from "@/lib/resume-builder/resume-requirement";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ scanId: string }> };
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const maxDuration = 300;

export default async function TailoredResumePage({ params }: Props) {
  const { scanId } = await params;
  if (!uuid(scanId)) notFound();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: scan } = await supabase
    .from("scans")
    .select("id, user_id, current_status, job_title")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; user_id: string; current_status: string; job_title: string | null }>();
  if (!scan || scan.user_id !== user.id || scan.current_status !== "completed") notFound();

  const { data: result } = await supabase
    .from("scan_results")
    .select("ai_validation_status, missing_required_skills, missing_preferred_skills")
    .eq("scan_id", scanId)
    .eq("user_id", user.id)
    .maybeSingle<{ ai_validation_status: string; missing_required_skills: unknown; missing_preferred_skills: unknown }>();
  if (!result || result.ai_validation_status !== "valid") notFound();

  const [profileResult, draftResult] = await Promise.all([
    getResumeProfileForScan(scanId),
    getResumeDraftForScan(scanId),
  ]);
  if (!profileResult.ok || !draftResult.ok) notFound();

  const missingRequirements = [
    ...parseSkillItems(result.missing_required_skills),
    ...parseSkillItems(result.missing_preferred_skills).slice(0, 3),
  ].map((item) => ({
    name: item.requirement,
    category: item.category,
    priority: item.priority ?? "required",
    kind: classifyResumeRequirement({
      requirement: item.requirement,
      category: item.category,
    }),
  }));

  return (
    <div className="app-section-enter flex min-h-full flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
      {!draftResult.data?.draft ? (
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[rgba(31,77,71,0.12)] bg-white/80 px-3 py-2 sm:px-4">
        <div>
          <Button asChild variant="ghost" className="h-8 px-0 text-[#66736f] hover:bg-transparent hover:text-[#183f3a]"><Link href={`/scan/${scanId}`}><ArrowLeft className="size-4" />Return to result</Link></Button>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h1 className="text-lg font-semibold text-[#183f3a]">Tailored resume</h1><p className="text-xs text-[#66736f]">{scan.job_title ?? "Completed CV match"}</p></div>
        </div>
      </div>
      ) : null}
      <ResumeBuilderWorkspace
        key={`${profileResult.data?.updatedAt ?? "no-profile"}:${draftResult.data?.updatedAt ?? "no-draft"}`}
        scanId={scanId}
        initialProfile={profileResult.data?.profile ?? null}
        initialProfileLanguage={profileResult.data?.resumeLanguage ?? "en"}
        initialProfileLanguageSource={profileResult.data?.resumeLanguageSource ?? "detected"}
        initialDraft={draftResult.data?.draft ?? null}
        initialDraftLanguage={draftResult.data?.resumeLanguage ?? null}
        missingRequirements={missingRequirements}
        jobTitle={scan.job_title}
      />
    </div>
  );
}
