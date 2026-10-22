import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import LessonProgressButton from "@/components/lesson-progress-button";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  content: string;
  position: number;
};

type LessonProgress = {
  lesson_id: number;
  is_completed: boolean;
  completed_at: string | null;
};

type PageProps = {
  params: Promise<{
    courseId: string;
    topicId: string;
    lessonId: string;
  }>;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseId, topicId, lessonId } = await params;

  if (
    !isValidId(courseId) ||
    !isValidId(topicId) ||
    !isValidId(lessonId)
  ) {
    notFound();
  }

  const topicPath = `/courses/${courseId}/topics/${topicId}`;
  const lessonPath = `${topicPath}/lessons/${lessonId}`;

  let lessonResponse: Response;
  let progressResponse: Response;

  try {
    [lessonResponse, progressResponse] = await Promise.all([
      apiFetch(lessonPath),
      apiFetch(`${lessonPath}/progress`),
    ]);
  } catch {
    return <ConnectionError topicPath={topicPath} />;
  }

  if (lessonResponse.status === 401 || progressResponse.status === 401) {
    redirect("/login");
  }

  if (lessonResponse.status === 404 || progressResponse.status === 404) {
    notFound();
  }

  if (!lessonResponse.ok || !progressResponse.ok) {
    return <ConnectionError topicPath={topicPath} />;
  }

  let lesson: Lesson;
  let progress: LessonProgress;

  try {
    lesson = await lessonResponse.json();
    progress = await progressResponse.json();
  } catch {
    return <ConnectionError topicPath={topicPath} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <Link
          href={topicPath}
          className="text-sm text-indigo-400 hover:underline"
        >
          Back to topic
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-indigo-400">
            LESSON
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold">
            {lesson.title}
          </h1>

          <p
            role="status"
            className={`mt-4 text-sm ${
              progress.is_completed
                ? "text-emerald-400"
                : "text-slate-400"
            }`}
          >
            {progress.is_completed ? "Completed" : "Not completed"}
          </p>

          {progress.completed_at && (
            <p className="mt-2 text-sm text-slate-400">
              Completed on{" "}
              <time dateTime={progress.completed_at}>
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                }).format(new Date(progress.completed_at))}{" "}
                UTC
              </time>
            </p>
          )}

          <LessonProgressButton
            lessonPath={lessonPath}
            isCompleted={progress.is_completed}
          />
        </header>

        <article className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          {lesson.content ? (
            <p className="whitespace-pre-wrap break-words leading-8 text-slate-300">
              {lesson.content}
            </p>
          ) : (
            <p className="text-slate-400">
              No content has been added to this lesson yet.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}

function ConnectionError({ topicPath }: { topicPath: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Unable to load this lesson</h1>
        <p className="mt-3 text-slate-400">
          Please try refreshing the page in a moment.
        </p>
        <Link
          href={topicPath}
          className="mt-5 inline-block text-indigo-400 hover:underline"
        >
          Back to topic
        </Link>
      </div>
    </main>
  );
}