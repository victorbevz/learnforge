import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";

type LearningProgressProps = {
  progressPath: string;
  compact?: boolean;
};

type ProgressSummary = {
  total_lessons: number;
  completed_lessons: number;
  completion_percent: number;
};

export default async function LearningProgress({
  progressPath,
  compact = false,
}: LearningProgressProps) {
  let response: Response;

  try {
    response = await apiFetch(progressPath);
  } catch {
    return <ProgressError compact={compact} />;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <ProgressError compact={compact} />;
  }

  let progress: ProgressSummary;

  try {
    progress = await response.json();
  } catch {
    return <ProgressError compact={compact} />;
  }

  const completionLabel =
    progress.total_lessons === 0
      ? "No lessons yet"
      : `${progress.completed_lessons} of ${progress.total_lessons} lessons completed`;

  return (
    <section
      aria-label="Learning progress"
      className={
        compact
          ? "pt-0.5"
          : "mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        {compact ? (
          <span className="text-xs text-[var(--workspace-muted)]">{completionLabel}</span>
        ) : (
          <h2 className="font-semibold">Learning progress</h2>
        )}

        <span className={`text-sm font-semibold tabular-nums ${compact ? "text-[var(--workspace-accent)]" : "text-indigo-400"}`}>
          {progress.completion_percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Completed lessons"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.completion_percent}
        aria-valuetext={`${progress.completed_lessons} of ${progress.total_lessons} lessons completed`}
        className={`overflow-hidden rounded-full ${
          compact ? "mt-2 h-1.5 bg-[var(--workspace-line)]" : "mt-4 h-3 bg-slate-800"
        }`}
      >
        <div
          className={`h-full rounded-full ${compact ? "bg-[var(--workspace-accent)]" : "bg-indigo-500"}`}
          style={{ width: `${progress.completion_percent}%` }}
        />
      </div>

      {!compact && (
        <p className="mt-3 text-sm text-slate-400">
          {progress.total_lessons === 0
            ? "Add lessons to start tracking your progress."
            : completionLabel}
        </p>
      )}
    </section>
  );
}

function ProgressError({ compact }: { compact: boolean }) {
  return (
    <p role="alert" className={compact ? "text-sm text-[var(--workspace-muted)]" : "mt-6 text-sm text-slate-400"}>
      Unable to load learning progress. Please try refreshing the page.
    </p>
  );
}
