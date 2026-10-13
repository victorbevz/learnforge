"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function CreateCourseForm() {
  const router = useRouter();
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
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-400";

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Create a course</h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {isLoading ? "Creating…" : "Create course"}
        </button>
      </form>
    </section>
  );
}