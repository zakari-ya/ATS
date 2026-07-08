"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, FileText, ShieldCheck, Upload, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ACCEPTED_CV_FILE_EXTENSION,
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_FILE_SIZE_LABEL,
} from "@/features/scan/constants";
import type { SelectedCvFileState } from "@/features/scan/types";
import { validateCvFileForUi } from "@/features/scan/validators";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createSelectedFileState(file: File): SelectedCvFileState {
  return {
    file,
    fileName: file.name,
    fileSizeBytes: file.size,
    fileSizeLabel: formatFileSize(file.size),
    validation: validateCvFileForUi(file),
  };
}

type CvUploadCardProps = {
  selectedFile: SelectedCvFileState | null;
  onSelectedFileChange: (selectedFile: SelectedCvFileState | null) => void;
};

export function CvUploadCard({
  selectedFile,
  onSelectedFileChange,
}: CvUploadCardProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!selectedFile && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [selectedFile]);

  function handleSelectedFile(file: File | null) {
    onSelectedFileChange(file ? createSelectedFileState(file) : null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleSelectedFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  function clearSelectedFile() {
    onSelectedFileChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const hasValidFile = selectedFile?.validation.valid === true;
  const hasFileError = selectedFile?.validation.valid === false;

  return (
    <Card className="overflow-hidden border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
            <Upload className="size-5" aria-hidden="true" />
          </div>
          <Badge
            variant="outline"
            className="border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]"
          >
            PDF only
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
            Upload your CV
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#66736f]">
            Add a clean PDF version of your CV. The server validates the file
            metadata again before storing it privately.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={`${ACCEPTED_CV_MIME_TYPES.join(",")},${ACCEPTED_CV_FILE_EXTENSION}`}
          className="sr-only"
          onChange={handleInputChange}
        />

        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            "group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition",
            isDragging
              ? "border-[#1f4d47] bg-[#dcebea]"
              : "border-[rgba(31,77,71,0.22)] bg-[#f8f7f3] hover:border-[#1f4d47] hover:bg-[#eef4f2]",
          ].join(" ")}
        >
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white text-[#183f3a] transition group-hover:-translate-y-0.5">
            <FileText className="size-6" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold tracking-tight text-[#183f3a]">
            Drop your PDF here
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#66736f]">
            Or tap to choose a file. PDF only, up to {MAX_CV_FILE_SIZE_LABEL}.
          </p>
        </label>

        {selectedFile ? (
          <div className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-3">
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                  hasValidFile
                    ? "bg-[#effaf4] text-[#17623a]"
                    : "bg-[#fff3f0] text-[#9a3412]",
                ].join(" ")}
              >
                {hasValidFile ? (
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="size-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#183f3a]">
                  {selectedFile.fileName}
                </p>
                <p className="mt-1 text-sm text-[#66736f]">
                  {selectedFile.fileSizeLabel}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelectedFile}
                className="h-10 rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]"
              >
                <X className="size-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        {hasFileError ? (
          <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Check this file</AlertTitle>
            <AlertDescription className="text-[#8a2d2d]">
              {selectedFile.validation.error}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-2xl border border-[#cfe2de] bg-[#eef4f2] p-3">
          <div className="flex gap-3">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-[#17623a]"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-[#315c45]">
              Your CV is private. Deeper PDF signature and content checks will
              be added in the extraction step.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
