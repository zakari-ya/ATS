"use client";

import {
  ExternalLink,
  Hand,
  Maximize2,
  Minus,
  MoveHorizontal,
  MousePointer2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  Document as PdfDocument,
  Page as PdfPage,
  pdfjs,
} from "react-pdf";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { ResumeDocument } from "./resume-document";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type Props = {
  profile: ResumeReadyProfile;
  draft?: ResumeDraft;
  language: ResumeLanguage;
};

type ViewMode = "page" | "width" | "custom";

type ViewportSize = {
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  scrollLeft: number;
  scrollTop: number;
};

const A4_ASPECT_RATIO = 210 / 297;
const VIEWPORT_PADDING = 48;
const MIN_ZOOM = 40;
const MAX_ZOOM = 250;
const ZOOM_STEP = 10;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));
}

function getFitPageWidth({ width, height }: ViewportSize) {
  if (width <= 0 || height <= 0) return 0;

  const availableWidth = Math.max(240, width - VIEWPORT_PADDING);
  const availableHeight = Math.max(320, height - VIEWPORT_PADDING);

  return Math.min(availableWidth, availableHeight * A4_ASPECT_RATIO);
}

function getFitWidth({ width }: ViewportSize) {
  return Math.max(240, width - VIEWPORT_PADDING);
}

export function ResumePdfPreviewBrowser({
  profile,
  draft,
  language,
}: Props) {
  const urlRef = useRef<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("page");
  const [zoom, setZoom] = useState(100);
  const [handTool, setHandTool] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreparing(true);
      setError(null);

      try {
        const blob = await pdf(
          <ResumeDocument profile={profile} draft={draft} language={language} />
        ).toBlob();

        if (cancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = nextUrl;
        setUrl(nextUrl);
      } catch {
        if (!cancelled) {
          setError(
            "The PDF preview could not be prepared. You can still use the download button."
          );
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draft, language, profile]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const fitPageWidth = getFitPageWidth(viewportSize);
  const fitWidth = getFitWidth(viewportSize);
  const pageWidth =
    viewMode === "page"
      ? fitPageWidth
      : viewMode === "width"
        ? fitWidth
        : fitPageWidth * (zoom / 100);

  const visibleZoom =
    viewMode === "page"
      ? 100
      : viewMode === "width"
        ? clampZoom((fitWidth / Math.max(fitPageWidth, 1)) * 100)
        : zoom;

  const preserveViewportCenter = useCallback((updateView: () => void) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      updateView();
      return;
    }

    const centerRatioX =
      (viewport.scrollLeft + viewport.clientWidth / 2) /
      Math.max(viewport.scrollWidth, 1);
    const centerRatioY =
      (viewport.scrollTop + viewport.clientHeight / 2) /
      Math.max(viewport.scrollHeight, 1);

    updateView();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const currentViewport = viewportRef.current;
        if (!currentViewport) return;

        currentViewport.scrollLeft =
          centerRatioX * currentViewport.scrollWidth -
          currentViewport.clientWidth / 2;
        currentViewport.scrollTop =
          centerRatioY * currentViewport.scrollHeight -
          currentViewport.clientHeight / 2;
      });
    });
  }, []);

  const setCustomZoom = useCallback(
    (nextZoom: number) => {
      const next = clampZoom(nextZoom);
      preserveViewportCenter(() => {
        setViewMode("custom");
        setZoom(next);
      });
    },
    [preserveViewportCenter]
  );

  const changeZoom = useCallback(
    (direction: -1 | 1) => {
      setCustomZoom(visibleZoom + direction * ZOOM_STEP);
    },
    [setCustomZoom, visibleZoom]
  );

  const setFitMode = useCallback(
    (mode: "page" | "width") => {
      preserveViewportCenter(() => setViewMode(mode));
    },
    [preserveViewportCenter]
  );

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 1 : -1);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey) {
      setHandTool((current) => !current);
      return;
    }

    if (!event.ctrlKey && !event.metaKey) return;

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeZoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      changeZoom(-1);
    } else if (event.key === "0") {
      event.preventDefault();
      setFitMode("page");
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!handTool || !viewport || event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const drag = dragRef.current;
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return;

    viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.pointerX);
    viewport.scrollTop = drag.scrollTop - (event.clientY - drag.pointerY);
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const drag = dragRef.current;
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return;

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  async function openFullPreview() {
    setOpening(true);
    setError(null);

    try {
      let previewUrl = url;
      let temporaryUrl: string | null = null;

      if (!previewUrl) {
        const blob = await pdf(
          <ResumeDocument profile={profile} draft={draft} language={language} />
        ).toBlob();
        temporaryUrl = URL.createObjectURL(blob);
        previewUrl = temporaryUrl;
      }

      const previewWindow = window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!previewWindow) {
        if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
        setError(
          "Your browser blocked the PDF preview. Use the download button instead."
        );
        return;
      }

      if (temporaryUrl) {
        window.setTimeout(() => URL.revokeObjectURL(temporaryUrl), 60_000);
      }
    } catch {
      setError("The PDF preview could not be prepared. Try the download button.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#eef0ef]">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border-soft)] bg-white/90 px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-0.5" aria-label="PDF controls">
          <span className="mr-1 hidden min-w-12 text-center text-xs font-medium tabular-nums text-[var(--app-muted)] sm:inline">
            1 / {numPages}
          </span>
          <button
            type="button"
            onClick={() => changeZoom(-1)}
            disabled={visibleZoom <= MIN_ZOOM}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-12 text-center text-xs font-semibold tabular-nums text-[var(--app-forest)]">
            {viewMode === "page"
              ? "Fit"
              : viewMode === "width"
                ? "Width"
                : `${zoom}%`}
          </span>
          <button
            type="button"
            onClick={() => changeZoom(1)}
            disabled={visibleZoom >= MAX_ZOOM}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setFitMode("page")}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)]"
            aria-label="Fit the complete page"
            aria-pressed={viewMode === "page"}
            title="Fit page"
          >
            <Maximize2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setFitMode("width")}
            className="hidden size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)] sm:inline-flex"
            aria-label="Fit page to preview width"
            aria-pressed={viewMode === "width"}
            title="Fit width"
          >
            <MoveHorizontal className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setHandTool((current) => !current)}
            className="hidden size-10 cursor-pointer items-center justify-center rounded-lg text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)] data-[active=true]:bg-[#dcebea] sm:inline-flex"
            data-active={handTool}
            aria-label={handTool ? "Disable hand pan tool" : "Enable hand pan tool"}
            aria-pressed={handTool}
            title={handTool ? "Hand tool active" : "Enable hand tool"}
          >
            {handTool ? <Hand className="size-4" /> : <MousePointer2 className="size-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={openFullPreview}
          disabled={opening}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium text-[var(--app-forest)] transition-colors hover:bg-[#eef4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
        >
          {opening ? (
            <RotateCcw className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          <span className="hidden sm:inline">Open PDF</span>
          <span className="sm:hidden">Open</span>
        </button>
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        className={`relative min-h-[30rem] flex-1 overflow-auto overscroll-contain outline-none lg:min-h-0 ${
          handTool
            ? dragging
              ? "cursor-grabbing select-none"
              : "cursor-grab"
            : "cursor-auto"
        }`}
        aria-label="Resume PDF preview. Use Control plus or minus to zoom, or drag with the hand tool to pan."
        aria-busy={preparing}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div
          className="flex min-h-full flex-col items-center gap-5 py-6"
          style={{
            width: `${Math.max(viewportSize.width, pageWidth + VIEWPORT_PADDING)}px`,
          }}
        >
          {url && pageWidth > 0 ? (
            <PdfDocument
              file={url}
              loading={<PreviewPageSkeleton width={pageWidth} />}
              error={null}
              onLoadSuccess={({ numPages: loadedPages }) => {
                setNumPages(loadedPages);
                setError(null);
              }}
              onLoadError={() => {
                setError(
                  "The PDF preview could not be displayed. Use Open PDF or the download button instead."
                );
              }}
            >
              {Array.from({ length: numPages }, (_, index) => (
                <PdfPage
                  key={`resume-page-${index + 1}`}
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={<PreviewPageSkeleton width={pageWidth} />}
                  className="overflow-hidden bg-white shadow-[0_24px_60px_-28px_rgba(24,63,58,0.36)]"
                />
              ))}
            </PdfDocument>
          ) : (
            <PreviewPageSkeleton width={Math.max(pageWidth, 320)} />
          )}
        </div>

        {preparing ? (
          <div
            className="pointer-events-none sticky bottom-4 left-1/2 z-10 flex w-fit -translate-x-1/2 items-center gap-2 rounded-full bg-[#183f3a]/92 px-3 py-2 text-xs font-medium text-white shadow-lg"
            role="status"
          >
            <RotateCcw className="size-3.5 animate-spin" />
            Updating preview
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="shrink-0 border-t border-[var(--app-border-soft)] bg-[#fff4f2] px-4 py-3 text-sm text-[var(--destructive)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PreviewPageSkeleton({ width }: { width: number }) {
  return (
    <div
      className="animate-pulse bg-white/80 shadow-sm"
      style={{
        width: `${width}px`,
        aspectRatio: "210 / 297",
      }}
    />
  );
}
