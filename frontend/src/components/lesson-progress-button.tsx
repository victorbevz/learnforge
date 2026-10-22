"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LessonProgressButtonProps = {
  lessonPath: string;
  isCompleted: boolean;
};

export default function LessonProgressButton({
  lessonPath,
  isCompleted,
}: LessonProgressButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${lessonPath}/progress`, {
        method: isCompleted ? "DELETE" : "PUT",
      });

      if (response.status === 401) {
        startTransition(() => {
          router.replace("/login");
          router.refresh();
        });
        return;
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);

        setError(
          typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            typeof data.detail === "string"
            ? data.detail
            : "Unable to update lesson progress",
        );
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  const isBusy = isLoading || isPending;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-50"
      >
        {isBusy
          ? "Saving…"
          : isCompleted
            ? "Mark as incomplete"
            : "Mark as completed"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}