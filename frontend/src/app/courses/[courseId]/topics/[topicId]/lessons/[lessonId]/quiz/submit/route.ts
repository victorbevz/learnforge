import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

type RouteContext = {
  params: Promise<{
    courseId: string;
    topicId: string;
    lessonId: string;
  }>;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 },
    );
  }

  const { courseId, topicId, lessonId } = await context.params;

  if (
    !isValidId(courseId) ||
    !isValidId(topicId) ||
    !isValidId(lessonId)
  ) {
    return NextResponse.json(
      { detail: "Lesson not found" },
      { status: 404 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("answers" in body) ||
    !Array.isArray(body.answers) ||
    body.answers.length < 1 ||
    body.answers.length > 50
  ) {
    return NextResponse.json(
      { detail: "Submit between 1 and 50 answers" },
      { status: 400 },
    );
  }

  try {
    const response = await apiFetch(
      `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}/quiz/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: body.answers }),
      },
    );

    if (!response.ok) {
      const detail =
        response.status === 401
          ? "Please sign in again"
          : response.status === 404
            ? "Quiz not found"
            : response.status === 422
              ? "Answer every question and select an available option for each."
              : "Unable to submit the quiz";

      return NextResponse.json(
        { detail },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const result: unknown = await response.json();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { detail: "Server unavailable. Please try again later." },
      { status: 502 },
    );
  }
}