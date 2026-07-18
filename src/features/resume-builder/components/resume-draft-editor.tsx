"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  FilePenLine,
  Layers3,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

import { ResumePdfDownloadButton } from "@/components/resume/pdf/resume-pdf-download-button";
import { ResumePdfPreview } from "@/components/resume/pdf/resume-pdf-preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ResumeDraft,
  ResumeDraftSectionName,
} from "@/lib/resume-builder/resume-draft-schema";
import {
  getResumeLanguageLabel,
  type ResumeLanguage,
  type ResumeLanguageSource,
} from "@/lib/resume-builder/resume-language";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";

type Props = {
  scanId: string;
  jobTitle?: string | null;
  profile: ResumeReadyProfile;
  draft: ResumeDraft;
  dirty: boolean;
  pending: boolean;
  resumeLanguage: ResumeLanguage;
  languageSource: ResumeLanguageSource;
  onDraftChange: (draft: ResumeDraft) => void;
  onSave: () => void;
  onRegenerate: () => void;
  onLanguageChange: (language: ResumeLanguage) => void;
  onRefreshProfile: () => void;
};

const sectionLabels: Record<ResumeDraftSectionName, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  languages: "Languages",
};

export function ResumeDraftEditor({
  scanId,
  jobTitle,
  profile,
  draft,
  dirty,
  pending,
  resumeLanguage,
  languageSource,
  onDraftChange,
  onSave,
  onRegenerate,
  onLanguageChange,
  onRefreshProfile,
}: Props) {
  function updateSummary(id: string, text: string) {
    onDraftChange({
      ...draft,
      summarySentences: draft.summarySentences.map((sentence) =>
        sentence.id === id ? { ...sentence, text } : sentence
      ),
      userEditedContentIds: Array.from(
        new Set([...draft.userEditedContentIds, id])
      ),
    });
  }

  function updateBullet(
    kind: "experience" | "projects",
    entryId: string,
    id: string,
    text: string
  ) {
    onDraftChange({
      ...draft,
      [kind]: draft[kind].map((entry) =>
        entry.entryId === entryId
          ? {
              ...entry,
              bullets: entry.bullets.map((bullet) =>
                bullet.id === id ? { ...bullet, text } : bullet
              ),
            }
          : entry
      ),
      userEditedContentIds: Array.from(
        new Set([...draft.userEditedContentIds, id])
      ),
    });
  }

  function toggleSection(section: ResumeDraftSectionName) {
    onDraftChange({
      ...draft,
      hiddenSections: draft.hiddenSections.includes(section)
        ? draft.hiddenSections.filter((item) => item !== section)
        : [...draft.hiddenSections, section],
    });
  }

  function toggleSkill(skillId: string) {
    onDraftChange({
      ...draft,
      selectedSkillIds: draft.selectedSkillIds.includes(skillId)
        ? draft.selectedSkillIds.filter((item) => item !== skillId)
        : [...draft.selectedSkillIds, skillId],
    });
  }

  function moveEditorTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const editor = (
    <ResumeEditorFields
      profile={profile}
      draft={draft}
      onSummary={updateSummary}
      onBullet={updateBullet}
      onToggleSection={toggleSection}
      onToggleSkill={toggleSkill}
    />
  );

  const preview = (
    <ResumePdfPreview
      profile={profile}
      draft={draft}
      language={resumeLanguage}
    />
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f8f7]">
      <header className="relative flex min-h-16 shrink-0 items-center justify-between gap-3 bg-[#123f38] px-3 text-white sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
            aria-label="CVMatch home"
          >
            <Image
              src="/logo_cvmatch2-bgNo.png"
              alt=""
              width={48}
              height={48}
              className="size-9 object-contain"
              aria-hidden="true"
            />
            <span
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CVMatch
            </span>
          </Link>
          <span className="hidden h-6 w-px bg-white/18 sm:block" />
          <Link
            href={`/scan/${scanId}`}
            className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 text-sm text-white/78 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="hidden lg:inline">Result</span>
          </Link>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-xs text-white/55">
              {jobTitle ?? "Completed CV match"}
            </p>
          </div>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          <h1 className="text-base font-semibold">Tailored resume</h1>
          <span className={`rounded-full px-2 py-1 text-[0.68rem] font-semibold ${dirty ? "bg-[#fff1cc] text-[#77551a]" : "bg-[#d8f0df] text-[#215c3f]"}`}>
            {dirty ? "Unsaved" : "Saved"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onRegenerate}
            disabled={pending}
            className="hidden min-h-10 border border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white xl:inline-flex"
          >
            <RefreshCw className={pending ? "animate-spin" : ""} />
            Regenerate
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={pending || !dirty}
            className="min-h-10 border border-white/20 bg-transparent px-3 text-white hover:bg-white/10"
          >
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            <span className="hidden sm:inline">{dirty ? "Save changes" : "Saved"}</span>
          </Button>
          {!dirty ? (
            <ResumePdfDownloadButton
              profile={profile}
              draft={draft}
              language={resumeLanguage}
              className="min-h-10 bg-white px-3 text-[#123f38] hover:bg-[#eef4f2] focus-visible:outline-white"
            />
          ) : null}
        </div>
      </header>

      {draft.warnings.length ? (
        <div
          className="shrink-0 border-b border-[#ead9ba] bg-[#fff9eb] px-4 py-2 text-xs leading-5 text-[#76551f]"
          role="status"
        >
          {draft.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[5rem_minmax(24rem,0.43fr)_minmax(34rem,0.57fr)]">
        <nav
          className="flex min-h-0 flex-col items-center gap-2 border-r border-[#dfe6e3] bg-white px-2 py-4"
          aria-label="Resume editor tools"
        >
          <ToolButton
            label="Content"
            icon={<FilePenLine className="size-5" />}
            active
            onClick={() => moveEditorTo("resume-editor-content")}
          />
          <ToolButton
            label="Sections"
            icon={<Layers3 className="size-5" />}
            onClick={() => moveEditorTo("resume-editor-sections")}
          />
          <ToolButton
            label="Preview"
            icon={<Eye className="size-5" />}
            onClick={() =>
              document
                .querySelector<HTMLElement>("[data-resume-preview]")
                ?.focus()
            }
          />
          <div className="mt-auto flex items-center gap-1 text-[0.65rem] text-[#66736f]">
            <Check className="size-3.5 text-[#2f7658]" />
            {dirty ? "Unsaved" : "Saved"}
          </div>
        </nav>

        <div className="flex min-h-0 flex-col border-r border-[#dfe6e3] bg-[#fbfcfb]">
          <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e3e9e6] bg-white px-5">
            <div>
              <h2 className="text-base font-semibold text-[#183f3a]">
                Edit content
              </h2>
              <p className="text-xs text-[#66736f]">
                Changes reflect in the preview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="resume-editor-language">
                Resume language
              </label>
              <select
                id="resume-editor-language"
                value={resumeLanguage}
                onChange={(event) =>
                  onLanguageChange(event.target.value as ResumeLanguage)
                }
                disabled={pending}
                className="min-h-10 rounded-lg border border-[#dbe4e0] bg-white px-3 text-xs font-medium text-[#183f3a] outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/15"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10"
                onClick={onRefreshProfile}
                disabled={pending}
                aria-label="Refresh information from uploaded CV"
                title="Refresh CV information"
              >
                <RefreshCw className={pending ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
          <div
            id="resume-editor-content"
            className="min-h-0 flex-1 scroll-py-4 overflow-y-auto overscroll-contain p-4 xl:p-5"
            role="region"
            aria-label="Resume editing fields"
            tabIndex={0}
          >
            {languageSource === "detected" ? (
              <p className="mb-3 text-xs text-[#7a8884]">
                {getResumeLanguageLabel(resumeLanguage)} was detected from your CV.
              </p>
            ) : null}
            {editor}
          </div>
        </div>

        <aside
          data-resume-preview
          className="min-h-0 overflow-hidden bg-[#edf0ef] focus:outline-none"
          aria-label="Resume PDF preview"
          tabIndex={-1}
        >
          {preview}
        </aside>
      </div>

      <Tabs defaultValue="edit" className="min-h-0 flex-1 bg-[#f8f7f3] p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:hidden">
        <TabsList className="sticky top-0 z-10 grid min-h-12 w-full grid-cols-2 bg-[#e6eeeb]">
          <TabsTrigger value="edit" className="min-h-11">
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="min-h-11">
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-3 min-h-0 overflow-y-auto">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#183f3a]">Edit content</p>
            <select
              value={resumeLanguage}
              onChange={(event) =>
                onLanguageChange(event.target.value as ResumeLanguage)
              }
              className="min-h-11 rounded-lg border border-[#dbe4e0] bg-white px-3 text-sm text-[#183f3a]"
              aria-label="Resume language"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
          {editor}
        </TabsContent>
        <TabsContent
          value="preview"
          className="mt-3 min-h-0 overflow-hidden rounded-xl border border-[#dfe6e3]"
        >
          {preview}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ToolButton({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c45] ${active ? "bg-[#e5f0ec] text-[#174b3f]" : "text-[#66736f] hover:bg-[#f1f5f3] hover:text-[#183f3a]"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ResumeEditorFields({
  profile,
  draft,
  onSummary,
  onBullet,
  onToggleSection,
  onToggleSkill,
}: {
  profile: ResumeReadyProfile;
  draft: ResumeDraft;
  onSummary: (id: string, text: string) => void;
  onBullet: (
    kind: "experience" | "projects",
    entryId: string,
    id: string,
    text: string
  ) => void;
  onToggleSection: (section: ResumeDraftSectionName) => void;
  onToggleSkill: (skillId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {draft.summarySentences.length ? (
        <EditorSection title="Professional summary" defaultOpen>
          {draft.summarySentences.map((sentence) => (
            <textarea
              key={sentence.id}
              value={sentence.text}
              onChange={(event) => onSummary(sentence.id, event.target.value)}
              className="min-h-32 w-full resize-none overflow-hidden rounded-lg border border-[#dce4e1] bg-white p-3 text-sm leading-6 text-[#263f3a] outline-none [field-sizing:content] focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/12"
              aria-label="Professional summary"
            />
          ))}
        </EditorSection>
      ) : null}

      <EditorSection title="Skills" defaultOpen>
        <div className="space-y-3">
          {profile.skills.map((group) => (
            <div
              key={group.id}
              className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start"
            >
              <p className="pt-2 text-xs font-medium text-[#52635f]">
                {group.category.value}
              </p>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-[#e0e7e4] bg-white p-2">
                {group.items.map((skill) => {
                  const selected = draft.selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => onToggleSkill(skill.id)}
                      aria-pressed={selected}
                      className={`min-h-8 cursor-pointer rounded-md border px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#315c45] ${selected ? "border-[#bdd4cc] bg-[#edf5f2] text-[#183f3a]" : "border-transparent bg-[#f2f4f3] text-[#7b8884] line-through"}`}
                    >
                      {skill.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </EditorSection>

      {draft.experience.length ? (
        <EditorSection title="Experience">
          <EntryBulletEditors
            kind="experience"
            entries={draft.experience}
            profile={profile}
            onBullet={onBullet}
          />
        </EditorSection>
      ) : null}

      {draft.projects.length ? (
        <EditorSection title="Projects" defaultOpen>
          <EntryBulletEditors
            kind="projects"
            entries={draft.projects}
            profile={profile}
            onBullet={onBullet}
          />
        </EditorSection>
      ) : null}

      <div id="resume-editor-sections">
        <EditorSection title="Section visibility">
          <div className="grid gap-2 sm:grid-cols-2">
            {draft.sectionOrder.map((section) => {
              const visible = !draft.hiddenSections.includes(section);
              return (
                <button
                  type="button"
                  key={section}
                  onClick={() => onToggleSection(section)}
                  aria-pressed={visible}
                  className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c45] ${visible ? "border-[#c9dcd5] bg-[#edf5f2] text-[#183f3a]" : "border-[#e0e4e2] bg-white text-[#77827f]"}`}
                >
                  {sectionLabels[section]}
                  {visible ? <Check className="size-4 text-[#2f7658]" /> : null}
                </button>
              );
            })}
          </div>
        </EditorSection>
      </div>
    </div>
  );
}

function EntryBulletEditors({
  kind,
  entries,
  profile,
  onBullet,
}: {
  kind: "experience" | "projects";
  entries: ResumeDraft["experience"] | ResumeDraft["projects"];
  profile: ResumeReadyProfile;
  onBullet: (
    kind: "experience" | "projects",
    entryId: string,
    id: string,
    text: string
  ) => void;
}) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const title =
          kind === "experience"
            ? profile.experience.find((item) => item.id === entry.entryId)?.role?.value
            : profile.projects.find((item) => item.id === entry.entryId)?.name.value;

        return (
          <div key={entry.entryId} className="rounded-lg border border-[#dfe6e3] bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-[#315c45]">
              {title ?? (kind === "experience" ? "Experience entry" : "Project entry")}
            </p>
            <div className="space-y-2">
              {entry.bullets.map((bullet, index) => (
                <textarea
                  key={bullet.id}
                  value={bullet.text}
                  onChange={(event) =>
                    onBullet(
                      kind,
                      entry.entryId,
                      bullet.id,
                      event.target.value
                    )
                  }
                  className="min-h-20 w-full resize-none overflow-hidden rounded-lg border border-[#e0e7e4] bg-[#fcfdfc] p-3 text-sm leading-6 text-[#263f3a] outline-none [field-sizing:content] focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/12"
                  aria-label={`${title ?? kind} bullet ${index + 1}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EditorSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group overflow-hidden rounded-xl border border-[#dde5e2] bg-white shadow-[0_6px_18px_-18px_rgba(24,63,58,0.32)]"
      open={defaultOpen}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-[#183f3a] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#315c45]">
        <span className="flex items-center gap-2">
          <Check className="size-4 rounded-full bg-[#237253] p-0.5 text-white" />
          {title}
        </span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#e5ebe8] p-3 sm:p-4">{children}</div>
    </details>
  );
}
