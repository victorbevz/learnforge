"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type CourseDraft = {
  title: string;
  description: string | null;
  topics: {
    title: string;
    description: string | null;
    lessons: { title: string; content: string }[];
  }[];
};

const inputClassName =
  "w-full rounded border border-[var(--workspace-field)] bg-[var(--workspace-paper)] px-3 py-2.5";
const buttonClassName =
  "min-h-11 rounded bg-[var(--workspace-accent)] px-4 text-sm font-semibold text-[#211a0f] hover:bg-[var(--workspace-accent-hover)] disabled:opacity-50";

export default function GenerateCourseForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [source, setSource] = useState<"idea" | "pdf">("idea");
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isLoading || isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    const fields = new FormData(event.currentTarget);
    const text = (name: string) => String(fields.get(name) ?? "").trim();
    const upload = !draft && source === "pdf";
    if (upload) {
      const file = fields.get("file");
      if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024) {
        setError("Select a PDF file that is 3 MB or smaller.");
        return;
      }
    }
    const body = draft
      ? {
          title: text("title"),
          description: text("description") || null,
          topics: draft.topics.map((topic, topicIndex) => ({
            title: text(`topic-${topicIndex}`),
            description: text(`topic-description-${topicIndex}`) || null,
            lessons: topic.lessons.map((_, lessonIndex) => ({
              title: text(`lesson-${topicIndex}-${lessonIndex}`),
              content: text(`lesson-content-${topicIndex}-${lessonIndex}`),
            })),
          })),
        }
      : { prompt: prompt.trim() };

    setError("");
    setIsLoading(true);

    try {
      const endpoint = draft
        ? "/courses/draft"
        : upload ? "/courses/generate-from-pdf" : "/courses/generate";
      const response = await fetch(endpoint, {
        method: "POST",
        ...(upload
          ? { body: fields }
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }),
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data?.detail === "string"
            ? data.detail
            : draft
              ? "Check the course fields before saving."
              : upload ? "Unable to generate a course from this PDF." : "Enter a course idea between 1 and 1,000 characters.",
        );
        return;
      }

      if (draft) {
        startTransition(() => {
          router.push(`/courses/${data.id}`);
        });
      } else {
        setDraft(data);
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-surface)] p-4 sm:mb-6 sm:p-6"
    >
      <h2 className="text-lg font-semibold">Create a course with AI</h2>
      <fieldset key={draft ? "draft" : "prompt"} disabled={isBusy} className="mt-4 min-w-0 space-y-4">
        {draft ? (
          <>
            <p className="text-sm">Review and edit the draft before creating the course.</p>
            <label className="block space-y-2 text-sm">
              <span>Course title</span>
              <input name="title" defaultValue={draft.title} maxLength={200} required className={inputClassName} />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Description (optional)</span>
              <textarea
                name="description"
                defaultValue={draft.description ?? ""}
                maxLength={10_000}
                rows={3}
                className={inputClassName}
              />
            </label>
            {draft.topics.map((topic, topicIndex) => (
              <fieldset key={topicIndex} className="min-w-0 space-y-3 rounded border border-[var(--workspace-line)] p-3">
                <legend className="px-1 text-sm font-semibold">Topic {topicIndex + 1}</legend>
                <label className="block space-y-2 text-sm">
                  <span>Topic title</span>
                  <input
                    name={`topic-${topicIndex}`}
                    defaultValue={topic.title}
                    maxLength={200}
                    required
                    className={inputClassName}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Topic description</span>
                  <textarea
                    name={`topic-description-${topicIndex}`}
                    defaultValue={topic.description ?? ""}
                    maxLength={10_000}
                    rows={2}
                    className={inputClassName}
                  />
                </label>
                {topic.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className="space-y-2 border-t border-[var(--workspace-line)] pt-3">
                    <label className="block space-y-2 text-sm">
                      <span>Lesson {lessonIndex + 1} title</span>
                      <input
                        name={`lesson-${topicIndex}-${lessonIndex}`}
                        defaultValue={lesson.title}
                        maxLength={200}
                        required
                        className={inputClassName}
                      />
                    </label>
                    <label className="block space-y-2 text-sm">
                      <span>Lesson content</span>
                      <textarea
                        name={`lesson-content-${topicIndex}-${lessonIndex}`}
                        defaultValue={lesson.content}
                        maxLength={50_000}
                        rows={5}
                        className={inputClassName}
                      />
                    </label>
                  </div>
                ))}
              </fieldset>
            ))}
          </>
        ) : (
          <>
            <label className="block space-y-2 text-sm">
              <span>Course source</span>
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value === "pdf" ? "pdf" : "idea");
                  setError("");
                }}
                className={inputClassName}
              >
                <option value="idea">Course idea</option>
                <option value="pdf">PDF document</option>
              </select>
            </label>
            {source === "pdf" ? (
              <label className="block space-y-2 text-sm">
                <span>PDF file</span>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,application/pdf"
                  required
                  className={inputClassName}
                />
                <span className="block text-xs">
                  Up to 3 MB and 20 pages. The first 6 KB of selectable text is sent to Groq.
                </span>
              </label>
            ) : (
              <label className="block space-y-2 text-sm">
                <span>Course idea</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Python for beginners"
                  maxLength={1000}
                  rows={2}
                  required
                  className={inputClassName}
                />
              </label>
            )}
          </>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={buttonClassName}>
            {draft
              ? isBusy ? "Creating…" : "Create course from draft"
              : isBusy ? "Generating…" : "Generate course draft"}
          </button>
          {draft && (
            <button
              type="button"
              className="min-h-11 rounded border border-[var(--workspace-line)] px-4 text-sm disabled:opacity-50"
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              Discard draft
            </button>
          )}
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-[var(--workspace-error)]">{error}</p>}
    </form>
  );
}
