"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

type CreateQuizFormProps = {
  lessonPath: string;
};

type QuestionDraft = {
  id: number;
  optionIds: number[];
};

export default function CreateQuizForm({
  lessonPath,
}: CreateQuizFormProps) {
  const router = useRouter();
  const nextQuestionId = useRef(2);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { id: 1, optionIds: [1, 2] },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isBusy = isLoading || isPending;

  function addQuestion() {
    const id = nextQuestionId.current;
    nextQuestionId.current += 1;

    setQuestions((current) =>
      current.length >= 50
        ? current
        : [...current, { id, optionIds: [1, 2] }],
    );
  }

  function removeQuestion(questionId: number) {
    setQuestions((current) =>
      current.length <= 1
        ? current
        : current.filter((question) => question.id !== questionId),
    );
  }

  function addOption(questionId: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (
          question.id !== questionId ||
          question.optionIds.length >= 6
        ) {
          return question;
        }

        return {
          ...question,
          optionIds: [
            ...question.optionIds,
            Math.max(...question.optionIds) + 1,
          ],
        };
      }),
    );
  }

  function removeOption(questionId: number, optionId: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (
          question.id !== questionId ||
          question.optionIds.length <= 2
        ) {
          return question;
        }

        return {
          ...question,
          optionIds: question.optionIds.filter(
            (id) => id !== optionId,
          ),
        };
      }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const body = {
      title: String(formData.get("title") ?? "").trim(),
      questions: questions.map((question) => ({
        text: String(
          formData.get(`question-${question.id}`) ?? "",
        ).trim(),
        options: question.optionIds.map((optionId) => ({
          text: String(
            formData.get(`option-${question.id}-${optionId}`) ?? "",
          ).trim(),
          is_correct:
            formData.get(`correct-${question.id}`) === String(optionId),
        })),
      })),
    };

    if (
      !body.title ||
      body.questions.some(
        (question) =>
          !question.text ||
          question.options.some((option) => !option.text) ||
          question.options.filter((option) => option.is_correct)
            .length !== 1,
      )
    ) {
      setError(
        "Fill in all fields and select one correct answer for each question.",
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${lessonPath}/quiz/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        startTransition(() => {
          router.replace("/login");
          router.refresh();
        });
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
            : "Unable to create the quiz",
        );
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-400";

  const buttonClassName =
    "rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50";

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Create a quiz</h2>

      <p className="mt-2 text-sm text-slate-400">
        Add questions and select one correct answer for each.
      </p>

      <form onSubmit={handleSubmit} className="mt-5">
        <fieldset disabled={isBusy} className="min-w-0 space-y-6">
          <div>
            <label htmlFor="quiz-title" className="mb-2 block text-sm">
              Quiz title
            </label>
            <input
              id="quiz-title"
              name="title"
              maxLength={200}
              required
              className={inputClassName}
            />
          </div>

          {questions.map((question, questionIndex) => (
            <fieldset
              key={question.id}
              className="min-w-0 rounded-xl border border-slate-700 p-4"
            >
              <legend className="px-2 font-semibold">
                Question {questionIndex + 1}
              </legend>

              <label
                htmlFor={`question-${question.id}`}
                className="mb-2 block text-sm"
              >
                Question text
              </label>
              <textarea
                id={`question-${question.id}`}
                name={`question-${question.id}`}
                rows={3}
                maxLength={5000}
                required
                className={inputClassName}
              />

              <div className="mt-4 space-y-4">
                {question.optionIds.map((optionId, optionIndex) => (
                  <div
                    key={optionId}
                    className="rounded-lg border border-slate-800 p-3"
                  >
                    <label
                      htmlFor={`option-${question.id}-${optionId}`}
                      className="mb-2 block text-sm"
                    >
                      Option {optionIndex + 1}
                    </label>
                    <input
                      id={`option-${question.id}-${optionId}`}
                      name={`option-${question.id}-${optionId}`}
                      maxLength={1000}
                      required
                      className={inputClassName}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          value={optionId}
                          required
                          className="accent-indigo-500"
                        />
                        Correct answer
                      </label>

                      <button
                        type="button"
                        disabled={question.optionIds.length <= 2}
                        onClick={() =>
                          removeOption(question.id, optionId)
                        }
                        className={buttonClassName}
                      >
                        Remove option
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={question.optionIds.length >= 6}
                  onClick={() => addOption(question.id)}
                  className={buttonClassName}
                >
                  Add option
                </button>

                <button
                  type="button"
                  disabled={questions.length <= 1}
                  onClick={() => removeQuestion(question.id)}
                  className={buttonClassName}
                >
                  Remove question
                </button>
              </div>
            </fieldset>
          ))}

          <button
            type="button"
            disabled={questions.length >= 50}
            onClick={addQuestion}
            className={buttonClassName}
          >
            Add question
          </button>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400 disabled:opacity-50"
            >
              {isBusy ? "Creating…" : "Create quiz"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}