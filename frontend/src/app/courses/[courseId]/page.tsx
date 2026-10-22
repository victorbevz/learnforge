import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CreateTopicForm from "@/components/create-topic-form";

import { apiFetch } from "@/lib/api";

type Course = {
  id: number;
  title: string;
  description: string | null;
};

type Topic = {
  id: number;
  course_id: number;
  title: string;
  position: number;
};

type PageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const PAGE_SIZE = 12;

export default async function CoursePage({
  params,
  searchParams,
}: PageProps) {
  const { courseId } = await params;

  if (
    !/^[1-9]\d*$/.test(courseId) ||
    Number(courseId) > 2147483647
  ) {
    notFound();
  }

  const basePath = `/courses/${courseId}`;
  const { page: rawPage } = await searchParams;
  const page = rawPage === undefined ? 1 : Number(rawPage);

  if (
    Array.isArray(rawPage) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100_000
  ) {
    redirect(basePath);
  }

  const offset = (page - 1) * PAGE_SIZE;

  let courseResponse: Response;
  let topicsResponse: Response;

  try {
    [courseResponse, topicsResponse] = await Promise.all([
      apiFetch(`/courses/${courseId}`),
      apiFetch(
        `/courses/${courseId}/topics?limit=${PAGE_SIZE + 1}&offset=${offset}`,
      ),
    ]);
  } catch {
    return <ConnectionError />;
  }

  if (courseResponse.status === 401 || topicsResponse.status === 401) {
    redirect("/login");
  }

  if (courseResponse.status === 404 || topicsResponse.status === 404) {
    notFound();
  }

  if (!courseResponse.ok || !topicsResponse.ok) {
    return <ConnectionError />;
  }

  let course: Course;
  let topics: Topic[];

  try {
    course = await courseResponse.json();
    topics = await topicsResponse.json();
  } catch {
    return <ConnectionError />;
  }

  if (topics.length === 0 && page > 1) {
    redirect(basePath);
  }

  const hasNextPage = topics.length > PAGE_SIZE;
  const visibleTopics = topics.slice(0, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm text-indigo-400 hover:underline"
        >
          ← Back to courses
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-indigo-400">
            COURSE
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold">
            {course.title}
          </h1>

          <p className="mt-4 whitespace-pre-wrap break-words text-slate-400">
            {course.description || "No description yet."}
          </p>
        </header>
        <CreateTopicForm courseId={course.id} />
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Topics</h2>

          {visibleTopics.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
              <h3 className="text-lg font-semibold">No topics yet</h3>
              <p className="mt-2 text-slate-400">
                Organize your course into topics to get started.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleTopics.map((topic) => (
                <Link
                    key={topic.id}
                    href={`/courses/${course.id}/topics/${topic.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-indigo-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400"
                >
                    <h3 className="break-words text-lg font-semibold">
                    {topic.title}
                    </h3>
                </Link>
                ))}
            </div>
          )}

          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Topic pagination"
              className="mt-6 flex items-center justify-between gap-4"
            >
              {page > 1 ? (
                <Link
                  href={
                    page === 2
                      ? basePath
                      : `${basePath}?page=${page - 1}`
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-slate-400">
                Page {page}
              </span>

              {hasNextPage ? (
                <Link
                  href={`${basePath}?page=${page + 1}`}
                  className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </section>
    </main>
  );
}

function ConnectionError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Unable to load this course</h1>
        <p className="mt-3 text-slate-400">
          Please try refreshing the page in a moment.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block text-indigo-400 hover:underline"
        >
          Back to courses
        </Link>
      </div>
    </main>
  );
}