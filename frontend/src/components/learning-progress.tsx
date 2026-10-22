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
    return <ProgressError />;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <ProgressError />;
  }

  let progress: ProgressSummary;

  try {
    progress = await response.json();
  } catch {
    return <ProgressError />;
  }

  return (
    <section
      aria-label="Learning progress"
      className={
        compact
          ? "mt-5"
          : "mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {compact ? (
          <span className="text-sm text-slate-400">Progress</span>
        ) : (
          <h2 className="font-semibold">Learning progress</h2>
        )}

        <span className="text-sm font-semibold text-indigo-400">
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
        className={`overflow-hidden rounded-full bg-slate-800 ${
          compact ? "mt-3 h-2" : "mt-4 h-3"
        }`}
      >
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${progress.completion_percent}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {progress.total_lessons === 0
          ? "Add lessons to start tracking your progress."
          : `${progress.completed_lessons} of ${progress.total_lessons} lessons completed`}
      </p>
    </section>
  );
}

function ProgressError() {
  return (
    <p role="alert" className="mt-6 text-sm text-slate-400">
      Unable to load learning progress. Please try refreshing the page.
    </p>
  );
}