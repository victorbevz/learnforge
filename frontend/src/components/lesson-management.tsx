"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type LessonManagementProps = {
  lessonPath: string;
  topicPath: string;
  title: string;
  content: string;
  position: number;
};

export default function LessonManagement({
  lessonPath,
  topicPath,
  title,
  content,
  position,
}: LessonManagementProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isBusy = isLoading || isPending;

  async function submitRequest(
    method: "PATCH" | "DELETE",
    body?: {
      title: string;
      content: string;
      position: number;
    },
  ) {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${lessonPath}/manage`, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
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
            : "Unable to save changes",
        );
        return;
      }

      setIsEditing(false);
      setIsDeleting(false);

      startTransition(() => {
        if (method === "DELETE") {
          router.replace(topicPath);
        }

        router.refresh();
      });
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await submitRequest("PATCH", {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      position: Number(formData.get("position")),
    });
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-400";

  return (
    <section className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            setIsEditing(!isEditing);
            setIsDeleting(false);
            setError("");
          }}
          className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {isEditing ? "Cancel editing" : "Edit lesson"}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            setIsDeleting(!isDeleting);
            setIsEditing(false);
            setError("");
          }}
          className="rounded-lg border border-red-900 px-4 py-2 text-red-400 hover:bg-red-950 disabled:opacity-50"
        >
          {isDeleting ? "Cancel deletion" : "Delete lesson"}
        </button>
      </div>

      {isEditing && (
        <form
          onSubmit={handleSave}
          className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label
              htmlFor="edit-lesson-title"
              className="mb-2 block text-sm"
            >
              Title
            </label>
            <input
              id="edit-lesson-title"
              name="title"
              defaultValue={title}
              maxLength={200}
              required
              disabled={isBusy}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="edit-lesson-content"
              className="mb-2 block text-sm"
            >
              Content (optional)
            </label>
            <textarea
              id="edit-lesson-content"
              name="content"
              defaultValue={content}
              rows={12}
              maxLength={50_000}
              disabled={isBusy}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="edit-lesson-position"
              className="mb-2 block text-sm"
            >
              Position
            </label>
            <input
              id="edit-lesson-position"
              name="position"
              type="number"
              defaultValue={position}
              min={0}
              max={2147483647}
              step={1}
              required
              disabled={isBusy}
              className={inputClassName}
            />
            <p className="mt-2 text-sm text-slate-400">
              Lessons with smaller positions appear first.
            </p>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400 disabled:opacity-50"
          >
            {isBusy ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}

      {isDeleting && (
        <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold">Delete this lesson?</h2>

          <p className="mt-2 text-sm text-slate-300">
            This lesson and its progress will be permanently deleted.
          </p>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => submitRequest("DELETE")}
            className="mt-4 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            {isBusy ? "Deleting…" : "Permanently delete lesson"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}