import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CreateLessonForm from "@/components/create-lesson-form";

import { apiFetch } from "@/lib/api";

type Topic = {
  id: number;
  course_id: number;
  title: string;
  position: number;
};

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  content: string;
  position: number;
};

type PageProps = {
  params: Promise<{
    courseId: string;
    topicId: string;
  }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const PAGE_SIZE = 12;

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

export default async function TopicPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId, topicId } = await params;

  if (!isValidId(courseId) || !isValidId(topicId)) {
    notFound();
  }

  const coursePath = `/courses/${courseId}`;
  const topicPath = `${coursePath}/topics/${topicId}`;

  const { page: rawPage } = await searchParams;
  const page = rawPage === undefined ? 1 : Number(rawPage);

  if (
    Array.isArray(rawPage) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100_000
  ) {
    redirect(topicPath);
  }

  const offset = (page - 1) * PAGE_SIZE;

  let topicResponse: Response;
  let lessonsResponse: Response;

  try {
    [topicResponse, lessonsResponse] = await Promise.all([
      apiFetch(topicPath),
      apiFetch(
        `${topicPath}/lessons?limit=${PAGE_SIZE + 1}&offset=${offset}`,
      ),
    ]);
  } catch {
    return <ConnectionError coursePath={coursePath} />;
  }

  if (topicResponse.status === 401 || lessonsResponse.status === 401) {
    redirect("/login");
  }

  if (topicResponse.status === 404 || lessonsResponse.status === 404) {
    notFound();
  }

  if (!topicResponse.ok || !lessonsResponse.ok) {
    return <ConnectionError coursePath={coursePath} />;
  }

  let topic: Topic;
  let lessons: Lesson[];

  try {
    topic = await topicResponse.json();
    lessons = await lessonsResponse.json();
  } catch {
    return <ConnectionError coursePath={coursePath} />;
  }

  if (lessons.length === 0 && page > 1) {
    redirect(topicPath);
  }

  const hasNextPage = lessons.length > PAGE_SIZE;
  const visibleLessons = lessons.slice(0, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <Link
          href={coursePath}
          className="text-sm text-indigo-400 hover:underline"
        >
          Back to course
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-indigo-400">
            TOPIC
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold">
            {topic.title}
          </h1>
        </header>
        <CreateLessonForm
            courseId={topic.course_id}
            topicId={topic.id}
        />
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Lessons</h2>

          {visibleLessons.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
              <h3 className="text-lg font-semibold">No lessons yet</h3>
              <p className="mt-2 text-slate-400">
                Add your first lesson to start building this topic.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleLessons.map((lesson) => (
                <article
                  key={lesson.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <h3 className="break-words text-lg font-semibold">
                    {lesson.title}
                  </h3>
                </article>
              ))}
            </div>
          )}

          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Lesson pagination"
              className="mt-6 flex items-center justify-between gap-4"
            >
              {page > 1 ? (
                <Link
                  href={
                    page === 2
                      ? topicPath
                      : `${topicPath}?page=${page - 1}`
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
                  href={`${topicPath}?page=${page + 1}`}
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

function ConnectionError({ coursePath }: { coursePath: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Unable to load this topic</h1>
        <p className="mt-3 text-slate-400">
          Please try refreshing the page in a moment.
        </p>
        <Link
          href={coursePath}
          className="mt-5 inline-block text-indigo-400 hover:underline"
        >
          Back to course
        </Link>
      </div>
    </main>
  );
}