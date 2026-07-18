"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  CircleAlert,
  FilePenLine,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { ResumeDraftEditor } from "@/features/resume-builder/components/resume-draft-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  addManualProfileFactAction,
  confirmMissingRequirementAction,
  confirmResumeFactsAction,
  generateResumeDraftAction,
  initializeResumeProfileAction,
  refreshResumeProfileAction,
  reviewResumeFactAction,
  saveResumeDraftAction,
  setResumeLanguageAction,
} from "@/features/resume-builder/actions";
import type { ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeProfile } from "@/lib/resume-builder/resume-profile-schema";
import {
  getResumeLanguageLabel,
  type ResumeLanguage,
  type ResumeLanguageSource,
} from "@/lib/resume-builder/resume-language";
import {
  ADDITIONAL_TECHNICAL_SKILLS_CATEGORY,
  createResumeReadyProfile,
  evaluateResumeProfile,
} from "@/lib/resume-builder/resume-profile-utils";
import {
  getRequirementKindLabel,
  getRequirementQuestion,
  type ResumeRequirement,
  type ResumeRequirementKind,
} from "@/lib/resume-builder/resume-requirement";
import {
  collectCandidateFactsForReview,
  RESUME_REVIEW_SECTION_LABELS,
  RESUME_REVIEW_SECTION_ORDER,
  type ResumeCandidateFact,
  type ResumeReviewSection,
} from "@/lib/resume-builder/resume-profile-review";

type ManualField = "fullName" | "professionalTitle" | "email" | "phone" | "location" | "linkedin" | "github" | "portfolio" | "summary";

type Props = {
  scanId: string;
  initialProfile: ResumeProfile | null;
  initialProfileLanguage: ResumeLanguage;
  initialProfileLanguageSource: ResumeLanguageSource;
  initialDraft: ResumeDraft | null;
  initialDraftLanguage: ResumeLanguage | null;
  missingRequirements: ResumeRequirement[];
  jobTitle?: string | null;
};


export function ResumeBuilderWorkspace({
  scanId,
  initialProfile,
  initialProfileLanguage,
  initialProfileLanguageSource,
  initialDraft,
  initialDraftLanguage,
  missingRequirements,
  jobTitle,
}: Props) {
  const router = useRouter();
  const profile = initialProfile;
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [factValues, setFactValues] = useState<Record<string, string>>({});
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [manual, setManual] = useState<{ field: ManualField; value: string }>({ field: "professionalTitle", value: "" });
  const [requirementAnswers, setRequirementAnswers] = useState<Record<string, "yes" | "limited" | "no">>({});
  const [requirementEvidence, setRequirementEvidence] = useState<Record<string, string>>({});
  const [requirementSkillCategories, setRequirementSkillCategories] = useState<Record<string, string>>({});
  const [requirementTargets, setRequirementTargets] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<ResumeLanguage | null>(null);

  const evaluation = useMemo(() => (profile ? evaluateResumeProfile(profile) : null), [profile]);
  const candidates = useMemo(() => (profile ? collectCandidateFactsForReview(profile) : []), [profile]);
  const ready = useMemo(() => (profile ? createResumeReadyProfile(profile) : null), [profile]);
  const activeStage = !profile || candidates.length ? 1 : !draft ? 2 : 3;

  function requestResumeLanguage(language: ResumeLanguage) {
    if (language === initialProfileLanguage) return;
    if (draft) {
      setPendingLanguage(language);
      return;
    }
    setResumeLanguage(language);
  }

  function setResumeLanguage(language: ResumeLanguage) {
    if (language === initialProfileLanguage) return;
    setError(null);
    startTransition(async () => {
      const result = await setResumeLanguageAction({ scanId, language });
      if (!result.ok) return setError(result.error.message);
      refresh(
        result.data.draftCleared
          ? "Resume language updated. Generate a new draft to apply it."
          : "Resume language updated."
      );
    });
  }

  function refresh(message?: string) {
    setNotice(message ?? null);
    router.refresh();
  }

  function initializeProfile() {
    setError(null);
    startTransition(async () => {
      const result = await initializeResumeProfileAction(scanId);
      if (!result.ok) return setError(result.error.message);
      refresh("Your CV information is ready for review.");
    });
  }

  function refreshProfile() {
    setError(null);
    startTransition(async () => {
      const result = await refreshResumeProfileAction(scanId);
      if (!result.ok) return setError(result.error.message);
      refresh("Your CV information was refreshed. Generate a new tailored resume to use it.");
    });
  }

  function reviewFact(fact: ResumeCandidateFact, decision: "edit" | "remove") {
    setError(null);
    startTransition(async () => {
      const result = await reviewResumeFactAction({
        scanId,
        factId: fact.id,
        decision,
        value: decision === "edit" ? factValues[fact.id] ?? fact.value : undefined,
      });
      if (!result.ok) return setError(result.error.message);
      setEditingFactId(null);
      setSelectedFactIds((current) =>
        current.filter((factId) => factId !== fact.id)
      );
      refresh(decision === "remove" ? "Information removed." : "Information saved.");
    });
  }

  function confirmSelectedFacts() {
    if (!selectedFactIds.length) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmResumeFactsAction({
        scanId,
        factIds: selectedFactIds,
      });
      if (!result.ok) return setError(result.error.message);
      const count = selectedFactIds.length;
      setSelectedFactIds([]);
      refresh(`${count} fact${count === 1 ? "" : "s"} confirmed.`);
    });
  }

  function addManualFact() {
    if (!profile || !manual.value.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addManualProfileFactAction({ scanId, field: manual.field, value: manual.value });
      if (!result.ok) return setError(result.error.message);
      setManual((current) => ({ ...current, value: "" }));
      refresh("Information added as user-provided.");
    });
  }

  function saveRequirementConfirmation(requirement: ResumeRequirement) {
    const answer = requirementAnswers[requirement.name];
    if (!answer) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmMissingRequirementAction({
        scanId,
        requirement: requirement.name,
        category: requirement.category,
        answer,
        evidence: requirementEvidence[requirement.name],
        skillCategory:
          requirementSkillCategories[requirement.name] ??
          ADDITIONAL_TECHNICAL_SKILLS_CATEGORY,
        targetEntryId: requirementTargets[requirement.name],
      });
      if (!result.ok) return setError(result.error.message);
      refresh(
        answer === "no"
          ? "The requirement was kept as a genuine gap."
          : requirement.kind === "skill"
            ? "The skill and its evidence were added to your resume."
            : "The requirement was linked to the supporting information in your resume."
      );
    });
  }

  function generateDraft() {
    setError(null);
    startTransition(async () => {
      const result = await generateResumeDraftAction(scanId);
      if (!result.ok) return setError(result.error.message);
      refresh("Your tailored resume is ready to review.");
    });
  }

  function saveDraft() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveResumeDraftAction(scanId, draft);
      if (!result.ok) return setError(result.error.message);
      setIsDirty(false);
      refresh("Changes saved.");
    });
  }

  function updateDraft(next: ResumeDraft) {
    setDraft(next);
    setIsDirty(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
      {!(draft && ready?.ok) ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[rgba(31,77,71,0.10)] bg-[#fbfaf7] px-2 py-2 sm:px-3">
          <StageIndicator activeStage={activeStage} />
          {profile ? (
            <ResumeLanguageControl
              language={draft ? initialDraftLanguage ?? initialProfileLanguage : initialProfileLanguage}
              source={initialProfileLanguageSource}
              pending={isPending}
              onChange={requestResumeLanguage}
            />
          ) : null}
          {profile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10"
              onClick={refreshProfile}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              <span className="hidden sm:inline">Refresh CV data</span>
            </Button>
          ) : null}
        </div>
      ) : null}
      {pendingLanguage ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#eef4f2] px-4 py-3 text-sm text-[#315c45]">
          <p>Switch to {getResumeLanguageLabel(pendingLanguage)}? Your current draft will be replaced so the wording and template stay in one language.</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPendingLanguage(null)} disabled={isPending}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => { setResumeLanguage(pendingLanguage); setPendingLanguage(null); }} disabled={isPending}>Change language</Button>
          </div>
        </div>
      ) : null}
      {notice ? <p role="status" className="rounded-xl bg-[#eef4f2] px-4 py-3 text-sm text-[#315c45]">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-xl bg-[#fff4f2] px-4 py-3 text-sm text-[#8f3a32]">{error}</p> : null}

      {!profile ? (
        <EmptyProfileState pending={isPending} onInitialize={initializeProfile} />
      ) : draft && ready?.ok ? (
        <ResumeDraftEditor
          scanId={scanId}
          jobTitle={jobTitle}
          profile={ready.data}
          draft={draft}
          dirty={isDirty}
          pending={isPending}
          onDraftChange={updateDraft}
          onSave={saveDraft}
          onRegenerate={generateDraft}
          resumeLanguage={initialDraftLanguage ?? initialProfileLanguage}
          languageSource={initialProfileLanguageSource}
          onLanguageChange={requestResumeLanguage}
          onRefreshProfile={refreshProfile}
        />
      ) : (
        <ReviewAndGenerate
          profile={profile}
          candidates={candidates}
          evaluation={evaluation!}
          missingRequirements={missingRequirements}
          factValues={factValues}
          onFactValue={(id, value) => setFactValues((current) => ({ ...current, [id]: value }))}
          onReviewFact={reviewFact}
          selectedFactIds={selectedFactIds}
          onSelectedFactIds={setSelectedFactIds}
          editingFactId={editingFactId}
          onEditingFactId={setEditingFactId}
          onConfirmSelected={confirmSelectedFacts}
          manual={manual}
          onManualChange={setManual}
          onAddManual={addManualFact}
          requirementAnswers={requirementAnswers}
          requirementEvidence={requirementEvidence}
          requirementSkillCategories={requirementSkillCategories}
          requirementTargets={requirementTargets}
          onRequirementAnswer={(requirement, answer) => setRequirementAnswers((current) => ({ ...current, [requirement]: answer }))}
          onRequirementEvidence={(requirement, evidence) => setRequirementEvidence((current) => ({ ...current, [requirement]: evidence }))}
          onRequirementSkillCategory={(requirement, category) => setRequirementSkillCategories((current) => ({ ...current, [requirement]: category }))}
          onRequirementTarget={(requirement, targetEntryId) => setRequirementTargets((current) => ({ ...current, [requirement]: targetEntryId }))}
          onSaveRequirement={saveRequirementConfirmation}
          onGenerate={generateDraft}
          pending={isPending}
        />
      )}
    </div>
  );
}

function ResumeLanguageControl({
  language,
  source,
  pending,
  onChange,
}: {
  language: ResumeLanguage;
  source: ResumeLanguageSource;
  pending: boolean;
  onChange: (language: ResumeLanguage) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-xl bg-[#eef4f2] px-3 text-sm font-medium text-[#183f3a]">
      <span className="sr-only">Resume language</span>
      <span className="hidden text-xs text-[#66736f] sm:inline">Resume language</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as ResumeLanguage)}
        disabled={pending}
        className="min-w-0 appearance-none bg-transparent pr-5 text-sm font-semibold text-[#183f3a] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Resume language"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
      {source === "detected" ? (
        <span className="hidden text-xs text-[#66736f] lg:inline">Detected from CV</span>
      ) : null}
    </label>
  );
}

function StageIndicator({ activeStage }: { activeStage: number }) {
  return <ol className="grid grid-cols-3 gap-2" aria-label="Tailored resume steps">
    {[
      { short: "CV details", full: "CV details" },
      { short: "Generate", full: "Generate resume" },
      { short: "Download", full: "Edit and download" },
    ].map(({ short, full }, index) => {
      const step = index + 1;
      return <li key={full} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:justify-start sm:px-3 sm:text-sm ${step === activeStage ? "bg-[#183f3a] text-white" : step < activeStage ? "bg-[#dcebea] text-[#183f3a]" : "bg-white/70 text-[#66736f]"}`}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs">{step < activeStage ? <Check className="size-3" /> : step}</span><span className="truncate sm:hidden">{short}</span><span className="hidden truncate sm:inline">{full}</span></li>;
    })}
  </ol>;
}

function EmptyProfileState({ pending, onInitialize }: { pending: boolean; onInitialize: () => void }) {
  return <section className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white/90 p-6 shadow-sm shadow-[#183f3a]/5"><Sparkles className="size-5 text-[#315c45]" /><h2 className="mt-4 text-xl font-semibold text-[#183f3a]">Prepare your CV details</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#66736f]">We will organize factual information from the CV already attached to this completed scan. Details verified against your uploaded CV are ready to use immediately.</p><Button className="mt-5 h-10 bg-[#183f3a] text-white hover:bg-[#1f4d47]" onClick={onInitialize} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <FilePenLine />}Prepare CV information</Button></section>;
}

function ReviewAndGenerate(props: {
  profile: ResumeProfile;
  candidates: ResumeCandidateFact[];
  evaluation: ReturnType<typeof evaluateResumeProfile>;
  missingRequirements: ResumeRequirement[];
  factValues: Record<string, string>;
  onFactValue: (id: string, value: string) => void;
  onReviewFact: (
    fact: ResumeCandidateFact,
    decision: "edit" | "remove"
  ) => void;
  selectedFactIds: string[];
  onSelectedFactIds: (ids: string[]) => void;
  editingFactId: string | null;
  onEditingFactId: (id: string | null) => void;
  onConfirmSelected: () => void;
  manual: { field: ManualField; value: string };
  onManualChange: (value: { field: ManualField; value: string }) => void;
  onAddManual: () => void;
  requirementAnswers: Record<string, "yes" | "limited" | "no">;
  requirementEvidence: Record<string, string>;
  requirementSkillCategories: Record<string, string>;
  requirementTargets: Record<string, string>;
  onRequirementAnswer: (
    requirement: string,
    answer: "yes" | "limited" | "no"
  ) => void;
  onRequirementEvidence: (requirement: string, evidence: string) => void;
  onRequirementSkillCategory: (requirement: string, category: string) => void;
  onRequirementTarget: (requirement: string, targetEntryId: string) => void;
  onSaveRequirement: (requirement: ResumeRequirement) => void;
  onGenerate: () => void;
  pending: boolean;
}) {
  const { candidates, evaluation } = props;
  const totalFacts = collectFactCount(props.profile);
  const reviewedFacts = Math.max(0, totalFacts - candidates.length);
  const progress = totalFacts
    ? Math.round((reviewedFacts / totalFacts) * 100)
    : 0;
  const groupedFacts = RESUME_REVIEW_SECTION_ORDER.map((section) => ({
    section,
    facts: candidates.filter((fact) => fact.section === section),
  })).filter((group) => group.facts.length > 0);
  const [openSections, setOpenSections] = useState<ResumeReviewSection[]>(() =>
    groupedFacts[0] ? [groupedFacts[0].section] : []
  );

  const toggleFact = (factId: string) => {
    props.onSelectedFactIds(
      props.selectedFactIds.includes(factId)
        ? props.selectedFactIds.filter((id) => id !== factId)
        : [...props.selectedFactIds, factId]
    );
  };
  const toggleSectionSelection = (facts: ResumeCandidateFact[]) => {
    const factIds = facts.map((fact) => fact.id);
    const allSelected = factIds.every((id) =>
      props.selectedFactIds.includes(id)
    );
    props.onSelectedFactIds(
      allSelected
        ? props.selectedFactIds.filter((id) => !factIds.includes(id))
        : Array.from(new Set([...props.selectedFactIds, ...factIds]))
    );
  };
  const toggleOpenSection = (section: ResumeReviewSection) => {
    setOpenSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  };

  return (
    <div className="grid min-h-0 gap-4 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_22rem] xl:overflow-hidden">
      <section className="flex min-h-0 flex-col border-x border-b border-[rgba(31,77,71,0.12)] bg-white/95">
        <div className="border-b border-[rgba(31,77,71,0.10)] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#66736f] uppercase">
                Step 1
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#183f3a]">
                Your CV details
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#52635f]">
                Details verified against your uploaded CV are ready to use. You can still add or correct information below.
              </p>
            </div>
            <Badge className="bg-[#eef4f2] text-[#315c45]">
              {reviewedFacts} of {totalFacts} reviewed
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1 bg-[#e5eeeb]" />
            <span className="min-w-10 text-right text-xs font-semibold tabular-nums text-[#315c45]">
              {progress}%
            </span>
          </div>
        </div>

        <div className="min-h-0 p-3 sm:p-4 xl:overflow-y-auto">
          {candidates.length ? (
            <div className="space-y-2">
              <div className="flex min-h-11 items-center justify-between gap-3 px-1">
                <p className="text-sm text-[#52635f]">
                  {candidates.length} item{candidates.length === 1 ? "" : "s"} need review
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 text-[#315c45]"
                  onClick={() =>
                    props.onSelectedFactIds(
                      props.selectedFactIds.length === candidates.length
                        ? []
                        : candidates.map((fact) => fact.id)
                    )
                  }
                >
                  {props.selectedFactIds.length === candidates.length
                    ? "Clear selection"
                    : "Select all"}
                </Button>
              </div>

              {groupedFacts.map(({ section, facts }) => {
                const isOpen = openSections.includes(section);
                const selectedCount = facts.filter((fact) =>
                  props.selectedFactIds.includes(fact.id)
                ).length;
                return (
                  <section
                    key={section}
                    className="overflow-hidden rounded-xl border border-[rgba(31,77,71,0.10)] bg-[#fbfaf7]"
                  >
                    <div className="flex min-h-14 items-center gap-2 px-3 sm:px-4">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 pr-1 text-xs font-medium text-[#52635f]">
                        <input
                          type="checkbox"
                          checked={selectedCount === facts.length}
                          onChange={() => toggleSectionSelection(facts)}
                          className="size-5 shrink-0 accent-[#183f3a]"
                          aria-label={`Select all ${RESUME_REVIEW_SECTION_LABELS[section]} facts`}
                        />
                        <span className="sr-only sm:not-sr-only">Select all</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleOpenSection(section)}
                        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c45]"
                        aria-expanded={isOpen}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#183f3a]">
                            {RESUME_REVIEW_SECTION_LABELS[section]}
                          </span>
                          <span className="block text-xs text-[#66736f]">
                            {selectedCount} of {facts.length} selected
                          </span>
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-[#66736f] transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="border-t border-[rgba(31,77,71,0.08)] bg-white">
                        {facts.map((fact) => (
                          <ReviewFactRow
                            key={fact.id}
                            fact={fact}
                            selected={props.selectedFactIds.includes(fact.id)}
                            editing={props.editingFactId === fact.id}
                            value={props.factValues[fact.id] ?? fact.value}
                            pending={props.pending}
                            onToggle={() => toggleFact(fact.id)}
                            onEdit={() => {
                              props.onFactValue(fact.id, fact.value);
                              props.onEditingFactId(fact.id);
                            }}
                            onCancel={() => props.onEditingFactId(null)}
                            onValue={(value) => props.onFactValue(fact.id, value)}
                            onSave={() => props.onReviewFact(fact, "edit")}
                            onRemove={() => props.onReviewFact(fact, "remove")}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-[#eef4f2] p-4 text-sm text-[#315c45]">
              <Check className="mr-2 inline size-4" />
              Your extracted CV details are ready to use.
            </div>
          )}

          <ManualFactForm {...props} />

          {evaluation.missingRequiredFields.length ||
          evaluation.warnings.length ? (
            <div className="mt-4 rounded-xl border border-[#ead9ba] bg-[#fff9eb] p-4 text-sm leading-6 text-[#76551f]">
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-1 size-4 shrink-0" />
                <div>
                  {[...evaluation.missingRequiredFields, ...evaluation.warnings].map(
                    (message) => (
                      <p key={message}>{message}</p>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {props.selectedFactIds.length ? (
          <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 m-3 mt-0 flex flex-col gap-3 rounded-xl bg-[#183f3a] p-3 text-white shadow-[0_16px_40px_-20px_rgba(24,63,58,0.75)] sm:flex-row sm:items-center sm:justify-between xl:bottom-2 xl:m-4 xl:mt-0">
            <div>
              <p className="text-sm font-semibold">
                {props.selectedFactIds.length} fact
                {props.selectedFactIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-xs text-white/70">
                Confirm only information you reviewed as accurate.
              </p>
            </div>
            <Button
              type="button"
              className="min-h-11 bg-white text-[#183f3a] hover:bg-[#eef4f2]"
              onClick={props.onConfirmSelected}
              disabled={props.pending}
            >
              {props.pending ? <Loader2 className="animate-spin" /> : <Check />}
              Confirm selected
            </Button>
          </div>
        ) : null}
      </section>

      <aside className="space-y-4 xl:min-h-0 xl:overflow-y-auto">
        <section className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#dcebea]/70 p-4">
          <p className="text-xs font-semibold text-[#66736f] uppercase">
            Step 2
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#183f3a]">
            Review missing requirements
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#52635f]">
            Confirm only requirements you can support with real experience or
            qualifications.
          </p>
          <div className="mt-4 space-y-4">
            {props.missingRequirements.length ? (
              props.missingRequirements.map((requirement) => (
                <RequirementConfirmation
                  key={`${requirement.priority}-${requirement.category}-${requirement.name}`}
                  requirement={requirement}
                  answer={props.requirementAnswers[requirement.name]}
                  evidence={props.requirementEvidence[requirement.name] ?? ""}
                  skillCategory={props.requirementSkillCategories[requirement.name] ?? ADDITIONAL_TECHNICAL_SKILLS_CATEGORY}
                  targetEntryId={props.requirementTargets[requirement.name] ?? ""}
                  categories={getSkillCategoryOptions(props.profile)}
                  targets={getRequirementTargets(props.profile, requirement.kind)}
                  pending={props.pending}
                  onAnswer={props.onRequirementAnswer}
                  onEvidence={props.onRequirementEvidence}
                  onSkillCategory={props.onRequirementSkillCategory}
                  onTarget={props.onRequirementTarget}
                  onSave={props.onSaveRequirement}
                />
              ))
            ) : (
              <p className="text-sm text-[#52635f]">
                No high-impact missing requirements need confirmation.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-[#183f3a] p-5 text-white">
          <p className="text-xs font-semibold text-white/65 uppercase">
            Step 3
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Generate a grounded draft
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            CVMatch can rewrite verified CV facts, but cannot add qualifications
            you have not confirmed.
          </p>
          <Button
            className="mt-4 min-h-11 w-full bg-white text-[#183f3a] hover:bg-[#eef4f2]"
            onClick={props.onGenerate}
            disabled={!evaluation.isReady || props.pending}
          >
            {props.pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate tailored resume
          </Button>
        </section>
      </aside>
    </div>
  );
}

function ReviewFactRow({
  fact,
  selected,
  editing,
  value,
  pending,
  onToggle,
  onEdit,
  onCancel,
  onValue,
  onSave,
  onRemove,
}: {
  fact: ResumeCandidateFact;
  selected: boolean;
  editing: boolean;
  value: string;
  pending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onValue: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      className={`border-b border-[rgba(31,77,71,0.07)] p-3 last:border-b-0 sm:p-4 ${selected ? "bg-[#eef4f2]/65" : "bg-white"}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <label className="flex min-h-11 shrink-0 cursor-pointer items-start pt-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-5 accent-[#183f3a]"
            aria-label={`Confirm ${fact.label}`}
          />
        </label>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#66736f]">{fact.label}</p>
          {editing ? (
            fact.isLongText ? (
              <textarea
                value={value}
                onChange={(event) => onValue(event.target.value)}
                className="mt-2 min-h-32 w-full resize-y rounded-lg border border-[rgba(31,77,71,0.18)] bg-white p-3 text-base leading-7 text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#a9c7c1]/40"
                aria-label={`Edit ${fact.label}`}
              />
            ) : (
              <input
                value={value}
                onChange={(event) => onValue(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-[rgba(31,77,71,0.18)] bg-white px-3 text-base text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#a9c7c1]/40"
                aria-label={`Edit ${fact.label}`}
              />
            )
          ) : (
            <p className="mt-1 max-w-[72ch] whitespace-pre-wrap break-words text-sm leading-6 text-[#183f3a] [overflow-wrap:anywhere]">
              {fact.value}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-2 pl-8">
        {editing ? (
          <>
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              onClick={onSave}
              disabled={pending || !value.trim()}
            >
              <Save /> Save edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11"
              onClick={onCancel}
              disabled={pending}
            >
              <X /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11 text-[#315c45]"
              onClick={onEdit}
              disabled={pending}
            >
              <Pencil /> Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11 text-[#8f3a32] hover:bg-[#fff4f2] hover:text-[#8f3a32]"
              onClick={onRemove}
              disabled={pending}
            >
              <Trash2 /> Remove
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function ManualFactForm(
  props: Pick<
    Parameters<typeof ReviewAndGenerate>[0],
    "manual" | "onManualChange" | "onAddManual" | "pending"
  >
) {
  const valueField =
    props.manual.field === "summary" ? (
      <textarea
        value={props.manual.value}
        onChange={(event) =>
          props.onManualChange({ ...props.manual, value: event.target.value })
        }
        placeholder="Add your factual professional summary"
        className="min-h-32 w-full resize-y rounded-lg border border-[rgba(31,77,71,0.14)] bg-white p-3 text-base leading-7 text-[#183f3a] outline-none focus:border-[#315c45]"
        aria-label="Professional summary"
      />
    ) : (
      <input
        value={props.manual.value}
        onChange={(event) =>
          props.onManualChange({ ...props.manual, value: event.target.value })
        }
        placeholder="Add factual information"
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-[rgba(31,77,71,0.14)] bg-white px-3 text-base text-[#183f3a] outline-none focus:border-[#315c45]"
        aria-label="New resume information"
      />
    );

  return (
    <details className="mt-4 rounded-xl bg-[#eef4f2]/70 open:pb-4">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-[#183f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c45]">
        <span className="flex items-center gap-2">
          <Plus className="size-4" /> Add missing information
        </span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </summary>
      <div className="space-y-3 px-4 pt-2">
        <label className="block text-sm font-medium text-[#52635f]">
          Information type
          <select
            value={props.manual.field}
            onChange={(event) =>
              props.onManualChange({
                field: event.target.value as ManualField,
                value: props.manual.value,
              })
            }
            className="mt-1 min-h-11 w-full rounded-lg border border-[rgba(31,77,71,0.14)] bg-white px-3 text-base text-[#183f3a]"
          >
            <option value="fullName">Full name</option>
            <option value="professionalTitle">Professional title</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="location">Location</option>
            <option value="linkedin">LinkedIn URL</option>
            <option value="github">GitHub URL</option>
            <option value="portfolio">Portfolio URL</option>
            <option value="summary">Professional summary</option>
          </select>
        </label>
        {valueField}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={props.onAddManual}
          disabled={props.pending || !props.manual.value.trim()}
        >
          <Plus /> Add information
        </Button>
      </div>
    </details>
  );
}

function RequirementConfirmation({
  requirement,
  answer,
  evidence,
  skillCategory,
  targetEntryId,
  categories,
  targets,
  pending,
  onAnswer,
  onEvidence,
  onSkillCategory,
  onTarget,
  onSave,
}: {
  requirement: ResumeRequirement;
  answer?: "yes" | "limited" | "no";
  evidence: string;
  skillCategory: string;
  targetEntryId: string;
  categories: string[];
  targets: Array<{ id: string; label: string }>;
  pending: boolean;
  onAnswer: (
    requirement: string,
    answer: "yes" | "limited" | "no"
  ) => void;
  onEvidence: (requirement: string, evidence: string) => void;
  onSkillCategory: (requirement: string, category: string) => void;
  onTarget: (requirement: string, targetEntryId: string) => void;
  onSave: (requirement: ResumeRequirement) => void;
}) {
  const identifier = requirement.name
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  const categoryId = `requirement-category-${identifier}`;
  const targetId = `requirement-target-${identifier}`;
  const evidenceId = `requirement-evidence-${identifier}`;
  const needsTarget = requirement.kind !== "skill";
  const hasRequiredTarget = !needsTarget || Boolean(targetEntryId);

  return (
    <div className="rounded-xl bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium text-[#183f3a]">
          {requirement.name}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-[#66736f]">
          <span className="rounded-full bg-[#eef4f2] px-2 py-1">
            {getRequirementKindLabel(requirement.kind)}
          </span>
          <span>{requirement.priority}</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-[#52635f]">
        {getRequirementQuestion(requirement.kind)}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(["yes", "limited", "no"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(requirement.name, option)}
            className={[
              "min-h-11 cursor-pointer rounded-lg px-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c45]",
              answer === option
                ? "bg-[#183f3a] text-white"
                : "bg-[#eef4f2] text-[#315c45] hover:bg-[#dcebea]",
            ].join(" ")}
          >
            {option === "yes"
              ? "Yes"
              : option === "limited"
                ? "Partly"
                : "No"}
          </button>
        ))}
      </div>

      {answer && answer !== "no" ? (
        <div className="mt-3 space-y-3">
          {requirement.kind === "skill" ? (
            <label
              htmlFor={categoryId}
              className="block text-sm font-medium text-[#315c45]"
            >
              Add to resume skills under
              <select
                id={categoryId}
                value={skillCategory}
                onChange={(event) =>
                  onSkillCategory(requirement.name, event.target.value)
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-[rgba(31,77,71,0.14)] bg-white px-3 text-base text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/20"
              >
                <option value={ADDITIONAL_TECHNICAL_SKILLS_CATEGORY}>
                  {ADDITIONAL_TECHNICAL_SKILLS_CATEGORY}
                </option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label
              htmlFor={targetId}
              className="block text-sm font-medium text-[#315c45]"
            >
              Connect this evidence to
              <select
                id={targetId}
                value={targetEntryId}
                onChange={(event) =>
                  onTarget(requirement.name, event.target.value)
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-[rgba(31,77,71,0.14)] bg-white px-3 text-base text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/20"
              >
                <option value="">Choose supporting information</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
              {!targets.length ? (
                <span className="mt-2 block text-xs leading-5 text-[#8a6331]">
                  This requirement cannot be confirmed until a matching {" "}
                  {requirement.kind} entry exists in your CV information.
                </span>
              ) : null}
            </label>
          )}

          <label
            htmlFor={evidenceId}
            className="block text-sm font-medium text-[#315c45]"
          >
            {getEvidenceLabel(requirement.kind)}
            <textarea
              id={evidenceId}
              value={evidence}
              onChange={(event) =>
                onEvidence(requirement.name, event.target.value)
              }
              placeholder={getEvidencePlaceholder(requirement.kind)}
              className="mt-1 min-h-28 w-full resize-y rounded-lg border border-[rgba(31,77,71,0.14)] bg-white p-3 text-base leading-6 text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/20"
            />
          </label>
          <p className="text-xs leading-5 text-[#66736f]">
            CVMatch stores this as user-provided evidence and will not turn the
            requirement itself into a skill.
          </p>
        </div>
      ) : null}

      {answer ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 min-h-11 w-full"
          disabled={
            pending ||
            (answer !== "no" &&
              (evidence.trim().length < 10 || !hasRequiredTarget))
          }
          onClick={() => onSave(requirement)}
        >
          Save response
        </Button>
      ) : null}
    </div>
  );
}

function getRequirementTargets(
  profile: ResumeProfile,
  kind: ResumeRequirementKind
): Array<{ id: string; label: string }> {
  if (kind === "experience") {
    return profile.experience.map((entry) => ({
      id: entry.id,
      label:
        [entry.role?.value, entry.company?.value, entry.dateLabel?.value]
          .filter(Boolean)
          .join(" · ") || "Experience entry",
    }));
  }
  if (kind === "education") {
    return profile.education.map((entry) => ({
      id: entry.id,
      label:
        [entry.degree?.value, entry.fieldOfStudy?.value, entry.institution?.value]
          .filter(Boolean)
          .join(" · ") || "Education entry",
    }));
  }
  if (kind === "certification") {
    return profile.certifications.map((entry) => ({
      id: entry.id,
      label: [entry.name.value, entry.issuer?.value]
        .filter(Boolean)
        .join(" · "),
    }));
  }
  if (kind === "language") {
    return profile.languages.map((entry) => ({
      id: entry.id,
      label: [entry.language.value, entry.proficiency?.value]
        .filter(Boolean)
        .join(" · "),
    }));
  }
  return [];
}

function getEvidenceLabel(kind: ResumeRequirementKind): string {
  switch (kind) {
    case "experience":
      return "Which work and dates support this?";
    case "education":
      return "Which qualification supports this?";
    case "certification":
      return "Add the credential or issuer details";
    case "language":
      return "Describe your real proficiency";
    default:
      return "Where did you use it?";
  }
}

function getEvidencePlaceholder(kind: ResumeRequirementKind): string {
  switch (kind) {
    case "experience":
      return "For example: Worked as a backend developer from 2019 to 2026 across these roles...";
    case "education":
      return "For example: Bachelor of Science in Computer Science, completed in 2024.";
    case "certification":
      return "For example: AWS certification issued in 2025.";
    case "language":
      return "For example: Used English daily with clients and technical documentation.";
    default:
      return "For example: Used PostgreSQL in a project to store and query application data.";
  }
}

function getSkillCategoryOptions(profile: ResumeProfile): string[] {
  const seen = new Set<string>();

  return profile.skills
    .map((group) => group.category.value.trim())
    .filter((category) => {
      const key = category.toLocaleLowerCase("en");
      if (!category || key === ADDITIONAL_TECHNICAL_SKILLS_CATEGORY.toLocaleLowerCase("en") || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function collectFactCount(profile: ResumeProfile): number { let count = 0; const walk = (value: unknown) => { if (Array.isArray(value)) return value.forEach(walk); if (!value || typeof value !== "object") return; if ("id" in value && "value" in value && "verificationStatus" in value) { count += 1; return; } Object.values(value).forEach(walk); }; walk(profile); return count; }
