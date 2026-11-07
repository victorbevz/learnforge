import Link from "next/link";
import WorkspaceFrame from "@/components/workspace-frame";
import { notFound, redirect } from "next/navigation";

import CreateQuizForm, { type QuizForEdit } from "@/components/create-quiz-form";
import { apiFetch } from "@/lib/api";

type PageProps = {
  params: Promise<{ courseId: string; topicId: string; lessonId: string }>;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

export default async function EditQuizPage({ params }: PageProps) {
  const { courseId, topicId, lessonId } = await params;
  if (![courseId, topicId, lessonId].every(isValidId)) {
    notFound();
  }

  const lessonPath = `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}`;
  const response = await apiFetch(`${lessonPath}/quiz/manage`).catch(() => null);

  if (response?.status === 401) {
    redirect("/login");
  }
  if (response?.status === 404) {
    notFound();
  }

  const quiz: QuizForEdit | null = response?.ok
    ? await response.json().catch(() => null)
    : null;

  return (
    <WorkspaceFrame className="px-6 py-8 text-slate-100 sm:py-12">
      <section className="mx-auto max-w-3xl">
        <Link href={lessonPath} className="text-sm text-indigo-400 hover:underline">
          Back to lesson
        </Link>

        {quiz ? (
          <CreateQuizForm key={quiz.id} lessonPath={lessonPath} initialQuiz={quiz} />
        ) : (
          <p role="alert" className="mt-8 text-red-400">
            Unable to load the quiz. Please try refreshing the page.
          </p>
        )}
      </section>
    </WorkspaceFrame>
  );
}
