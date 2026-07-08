"use client";

import { useId, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_MIN_LENGTH,
} from "@/features/scan/constants";
import { validateJobDescriptionForUi } from "@/features/scan/validators";

type JobDescriptionFormProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function JobDescriptionForm({
  value,
  onValueChange,
}: JobDescriptionFormProps) {
  const textareaId = useId();
  const descriptionId = useId();
  const [hasInteracted, setHasInteracted] = useState(false);
  const validation = useMemo(
    () => validateJobDescriptionForUi(value),
    [value]
  );
  const characterCount = value.length;
  const showValidationMessage = hasInteracted && value.length > 0;
  const isNearLimit = characterCount > JOB_DESCRIPTION_MAX_LENGTH * 0.9;
  const isOverLimit = characterCount > JOB_DESCRIPTION_MAX_LENGTH;

  return (
    <Card className="flex min-h-0 flex-col border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
            <ClipboardList className="size-5" aria-hidden="true" />
          </div>
          <Badge
            variant="outline"
            className="border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]"
          >
            Job post
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
            Paste the job description
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#66736f]">
            Include the requirements, responsibilities, and preferred skills so
            the later analysis has enough context.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor={textareaId}>Job description</Label>
              <p id={descriptionId} className="text-sm leading-6 text-[#66736f]">
                Recommended minimum: {JOB_DESCRIPTION_MIN_LENGTH} characters.
              </p>
            </div>
            <span
              className={[
                "shrink-0 text-xs font-medium tabular-nums",
                isOverLimit
                  ? "text-[#8f3a32]"
                  : isNearLimit
                    ? "text-[#8a5a1f]"
                    : "text-[#66736f]",
              ].join(" ")}
            >
              {characterCount.toLocaleString()} /{" "}
              {JOB_DESCRIPTION_MAX_LENGTH.toLocaleString()}
            </span>
          </div>

          <Textarea
            id={textareaId}
            aria-describedby={descriptionId}
            aria-invalid={showValidationMessage && !validation.valid}
            value={value}
            onBlur={() => setHasInteracted(true)}
            onChange={(event) => {
              setHasInteracted(true);
              onValueChange(event.target.value);
            }}
            placeholder="Paste the full job post here..."
            className="h-[15.5rem] min-h-[15.5rem] max-h-[42dvh] flex-1 overflow-y-auto resize-none rounded-2xl border-[rgba(31,77,71,0.14)] bg-[#f8f7f3] p-4 text-base leading-7 text-[#183f3a] shadow-inner shadow-[#183f3a]/3 [field-sizing:fixed] focus-visible:border-[#1f4d47] focus-visible:ring-[#a9c7c1]/35 md:h-[18rem] md:min-h-[18rem] lg:h-[21rem] lg:min-h-[21rem] lg:max-h-none lg:resize-y xl:h-[26rem] xl:min-h-[26rem]"
          />
        </div>

        {showValidationMessage && validation.valid ? (
          <Alert className="border-[#b9dec9] bg-[#effaf4] text-[#17623a]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Enough detail for setup</AlertTitle>
            <AlertDescription className="text-[#276948]">
              This looks ready for secure upload and the next analysis step.
            </AlertDescription>
          </Alert>
        ) : null}

        {showValidationMessage && !validation.valid ? (
          <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Improve the job post</AlertTitle>
            <AlertDescription className="text-[#8a2d2d]">
              {validation.error}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-3 text-sm leading-6 text-[#66736f]">
          Pasted content stays inside this textarea. The app does not render it
          as HTML.
        </div>
      </CardContent>
    </Card>
  );
}
