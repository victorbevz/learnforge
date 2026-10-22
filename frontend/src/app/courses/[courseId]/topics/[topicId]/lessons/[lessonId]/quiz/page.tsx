import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuizPlayer, { type QuizData } from "@/components/quiz-player";
import { apiFetch } from "@/lib/api";

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

export default async function QuizPage({ params }: PageProps) {
  const { courseId, topicId, lessonId } = await params;

  if (
    !isValidId(courseId) ||
    !isValidId(topicId) ||
    !isValidId(lessonId)
  ) {
    notFound();
  }

  const lessonPath =
    `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}`;
  const quizPath = `${lessonPath}/quiz`;

  let response: Response;

  try {
    response = await apiFetch(quizPath);
  } catch {
    return <ConnectionError lessonPath={lessonPath} />;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return <ConnectionError lessonPath={lessonPath} />;
  }

  let quiz: QuizData;

  try {
    quiz = await response.json();
  } catch {
    return <ConnectionError lessonPath={lessonPath} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <Link
          href={lessonPath}
          className="text-sm text-indigo-400 hover:underline"
        >
          Back to lesson
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-indigo-400">
            QUIZ
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold">
            {quiz.title}
          </h1>

          <p className="mt-4 text-slate-400">
            Select one answer for each question, then submit your answers.
          </p>
        </header>

        <QuizPlayer
          key={quiz.id}
          quiz={quiz}
          quizPath={quizPath}
        />
      </section>
    </main>
  );
}

function ConnectionError({
  lessonPath,
}: {
  lessonPath: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Unable to load this quiz</h1>

        <p className="mt-3 text-slate-400">
          Please try refreshing the page in a moment.
        </p>

        <Link
          href={lessonPath}
          className="mt-5 inline-block text-indigo-400 hover:underline"
        >
          Back to lesson
        </Link>
      </div>
    </main>
  );
}