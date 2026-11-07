"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

export default function CreateCourseForm() {
  const router = useRouter();
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
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
            : "Unable to create the course",
        );
        return;
      }

      form.reset();
      if (disclosureRef.current) {
        disclosureRef.current.open = false;
        summaryRef.current?.focus();
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded border border-[var(--workspace-field)] bg-[var(--workspace-paper)] px-3 py-2.5";

  return (
    <details ref={disclosureRef} className="mb-5 sm:mb-0">
      <summary
        ref={summaryRef}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded bg-[var(--workspace-accent)] px-4 text-sm font-semibold text-[#211a0f] hover:bg-[var(--workspace-accent-hover)] sm:absolute sm:top-2 sm:right-0"
      >
        <span aria-hidden="true" className="text-lg leading-none">+</span>
        New course
      </summary>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4 rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-surface)] p-4 sm:mt-0 sm:mb-6 sm:p-6"
      >
        <h2 className="text-lg font-semibold">Create a course</h2>
        <div>
          <label htmlFor="title" className="mb-2 block text-sm">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={200}
            required
            disabled={isLoading}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={10_000}
            disabled={isLoading}
            className={inputClassName}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-[var(--workspace-error)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="min-h-11 rounded bg-[var(--workspace-accent)] px-4 text-sm font-semibold text-[#211a0f] hover:bg-[var(--workspace-accent-hover)] disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create course"}
        </button>
      </form>
    </details>
  );
}
