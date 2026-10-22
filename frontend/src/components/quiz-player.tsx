"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type QuizData = {
  id: number;
  lesson_id: number;
  title: string;
  questions: {
    id: number;
    text: string;
    position: number;
    options: {
      id: number;
      text: string;
      position: number;
    }[];
  }[];
};

type QuizResult = {
  quiz_id: number;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  results: {
    question_id: number;
    selected_option_id: number;
    correct_option_id: number;
    is_correct: boolean;
  }[];
};

type QuizPlayerProps = {
  quiz: QuizData;
  quizPath: string;
};

export default function QuizPlayer({
  quiz,
  quizPath,
}: QuizPlayerProps) {
  const router = useRouter();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const answers = quiz.questions.map((question) => ({
      question_id: question.id,
      option_id: Number(formData.get(`question-${question.id}`)),
    }));

    if (
      answers.some(
        (answer) =>
          !Number.isInteger(answer.option_id) ||
          answer.option_id <= 0,
      )
    ) {
      setError("Answer every question before submitting.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${quizPath}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
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
            : "Unable to submit the quiz",
        );
        return;
      }

      const data: QuizResult = await response.json();
      setResult(data);
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  if (result) {
    return (
      <section className="mt-8">
        <div className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Your result</h2>

          <p
            role="status"
            className="mt-4 text-4xl font-bold text-indigo-400"
          >
            {result.score_percent}%
          </p>

          <p className="mt-3 text-slate-300">
            {result.correct_answers} of {result.total_questions} answers
            correct
          </p>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setError("");
            }}
            className="mt-6 rounded-lg bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400"
          >
            Try again
          </button>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Answer review</h2>

        <div className="mt-5 space-y-5">
          {quiz.questions.map((question, index) => {
            const answer = result.results.find(
              (item) => item.question_id === question.id,
            );

            if (!answer) {
              return null;
            }

            const selectedOption = question.options.find(
              (option) => option.id === answer.selected_option_id,
            );
            const correctOption = question.options.find(
              (option) => option.id === answer.correct_option_id,
            );

            return (
              <article
                key={question.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <p
                  className={`text-sm font-semibold ${
                    answer.is_correct
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {answer.is_correct ? "Correct" : "Incorrect"}
                </p>

                <h3 className="mt-3 whitespace-pre-wrap break-words font-semibold">
                  {index + 1}. {question.text}
                </h3>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-300">
                  Your answer: {selectedOption?.text ?? "Unavailable"}
                </p>

                {!answer.is_correct && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-emerald-400">
                    Correct answer: {correctOption?.text ?? "Unavailable"}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <fieldset disabled={isLoading} className="min-w-0 space-y-6">
        {quiz.questions.map((question, index) => (
          <fieldset
            key={question.id}
            className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <legend className="px-2 text-sm text-indigo-400">
              Question {index + 1} of {quiz.questions.length}
            </legend>

            <p className="whitespace-pre-wrap break-words text-lg font-semibold">
              {question.text}
            </p>

            <div className="mt-5 space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-4 hover:border-indigo-400"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    required
                    className="mt-1 shrink-0 accent-indigo-500"
                  />

                  <span className="min-w-0 whitespace-pre-wrap break-words text-slate-300">
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400 disabled:opacity-50"
        >
          {isLoading ? "Checking answers…" : "Submit answers"}
        </button>
      </fieldset>
    </form>
  );
}