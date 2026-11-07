import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";

type PageProps = {
  params: Promise<{ courseId: string; topicId: string; lessonId: string }>;
  searchParams: Promise<{ page?: string | string[]; attempt?: string | string[] }>;
};

type AttemptSummary = {
  id: number;
  quiz_title: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  created_at: string;
};

type AttemptDetail = AttemptSummary & {
  answers: {
    question: string;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }[];
};

const PAGE_SIZE = 20;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

export default async function QuizAttemptsPage({ params, searchParams }: PageProps) {
  const { courseId, topicId, lessonId } = await params;
  const { page: rawPage = "1", attempt } = await searchParams;
  if (
    ![courseId, topicId, lessonId].every(isValidId) ||
    typeof rawPage !== "string" ||
    !isValidId(rawPage) ||
    Number(rawPage) > 100_000 ||
    (attempt !== undefined && (typeof attempt !== "string" || !isValidId(attempt)))
  ) {
    notFound();
  }

  const page = Number(rawPage);
  const lessonPath = `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}`;
  const historyPath = `${lessonPath}/quiz/attempts`;
  const pagePath = (number: number) =>
    number === 1 ? historyPath : `${historyPath}?page=${number}`;
  const endpoint = attempt
    ? `${historyPath}/${attempt}`
    : `${historyPath}?limit=${PAGE_SIZE + 1}&offset=${(page - 1) * PAGE_SIZE}`;
  const response = await apiFetch(endpoint).catch(() => null);

  if (response?.status === 401) {
    redirect("/login");
  }
  if (response?.status === 404) {
    notFound();
  }

  const data: AttemptSummary[] | AttemptDetail | null = response?.ok
    ? await response.json().catch(() => null)
    : null;
  const attempts = Array.isArray(data) ? data : null;
  const detail = data && !Array.isArray(data) ? data : null;

  if (attempts?.length === 0 && page > 1) {
    redirect(historyPath);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <Link
          href={attempt ? pagePath(page) : lessonPath}
          className="text-sm text-indigo-400 hover:underline"
        >
          {attempt ? "Back to history" : "Back to lesson"}
        </Link>

        <h1 className="mt-8 break-words text-3xl font-bold">
          {detail?.quiz_title ?? "Quiz attempt history"}
        </h1>

        {detail ? (
          <>
            <p className="mt-4 text-xl font-semibold text-indigo-400">
              {detail.score_percent}% · {detail.correct_answers} of {detail.total_questions} correct
            </p>
            <AttemptDate value={detail.created_at} />

            <h2 className="mt-8 text-xl font-semibold">Answer review</h2>
            <div className="mt-4 space-y-4">
              {detail.answers.map((answer, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <h3 className="whitespace-pre-wrap break-words font-semibold">
                    {index + 1}. {answer.question}
                  </h3>
                  <p className={`mt-3 text-sm ${answer.is_correct ? "text-emerald-400" : "text-red-400"}`}>
                    {answer.is_correct ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">
                    Your answer: {answer.selected_answer}
                  </p>
                  {!answer.is_correct && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-emerald-400">
                      Correct answer: {answer.correct_answer}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : attempts ? (
          <>
            {attempts.length === 0 ? (
              <p className="mt-4 text-slate-400">You have no saved attempts for this lesson yet.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {attempts.slice(0, PAGE_SIZE).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${historyPath}?page=${page}&attempt=${item.id}`}
                      className="block rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-indigo-400"
                    >
                      <span className="block break-words font-semibold">{item.quiz_title}</span>
                      <span className="mt-2 block text-sm text-indigo-400">
                        {item.score_percent}% · {item.correct_answers} of {item.total_questions} correct
                      </span>
                      <AttemptDate value={item.created_at} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {(page > 1 || attempts.length > PAGE_SIZE) && (
              <nav aria-label="Attempt pagination" className="mt-6 flex flex-wrap items-center gap-5 text-sm">
                {page > 1 && <Link href={pagePath(page - 1)} className="text-indigo-400 hover:underline">Previous</Link>}
                <span className="text-slate-400">Page {page}</span>
                {page < 100_000 && attempts.length > PAGE_SIZE && (
                  <Link href={pagePath(page + 1)} className="text-indigo-400 hover:underline">Next</Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <p role="alert" className="mt-4 text-red-400">
            Unable to load quiz attempts. Please try refreshing the page.
          </p>
        )}
      </section>
    </main>
  );
}

function AttemptDate({ value }: { value: string }) {
  return (
    <time dateTime={value} className="mt-2 block text-sm text-slate-400">
      {dateFormat.format(new Date(value))} UTC
    </time>
  );
}
