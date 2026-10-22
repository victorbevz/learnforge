import Link from "next/link";
import { redirect } from "next/navigation";

import CreateQuizForm from "@/components/create-quiz-form";
import { apiFetch } from "@/lib/api";

type LessonQuizProps = {
  lessonPath: string;
};

type QuizSummary = {
  id: number;
  title: string;
  questions: { id: number }[];
};

export default async function LessonQuiz({
  lessonPath,
}: LessonQuizProps) {
  let response: Response;

  try {
    response = await apiFetch(`${lessonPath}/quiz`);
  } catch {
    return <QuizError />;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    return <CreateQuizForm lessonPath={lessonPath} />;
  }

  if (!response.ok) {
    return <QuizError />;
  }

  let quiz: QuizSummary;

  try {
    quiz = await response.json();
  } catch {
    return <QuizError />;
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm font-semibold tracking-widest text-indigo-400">
        QUIZ
      </p>

      <h2 className="mt-3 break-words text-xl font-semibold">
        {quiz.title}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {quiz.questions.length} questions
      </p>

      <Link
        href={`${lessonPath}/quiz`}
        className="mt-5 inline-block rounded-lg bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400"
      >
        Take quiz
      </Link>
    </section>
  );
}

function QuizError() {
  return (
    <p role="alert" className="mt-8 text-sm text-red-400">
      Unable to load the quiz. Please try refreshing the page.
    </p>
  );
}