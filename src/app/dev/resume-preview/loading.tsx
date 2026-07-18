export default function DevelopmentResumePreviewLoading() {
  return (
    <main className="min-h-dvh bg-[var(--app-bg)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <div className="h-8 w-72 rounded bg-[var(--app-surface-soft)]" />
        <div className="mt-3 h-5 w-full max-w-xl rounded bg-[var(--app-surface-soft)]" />
        <div className="mt-8 h-[46rem] rounded-xl bg-[var(--app-surface-soft)]" />
      </div>
    </main>
  );
}
