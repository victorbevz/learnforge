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
    !("title" in body) ||
    typeof body.title !== "string" ||
    !("questions" in body) ||
    !Array.isArray(body.questions)
  ) {
    return NextResponse.json(
      { detail: "Quiz title and questions are required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();

  if (title.length === 0 || title.length > 200) {
    return NextResponse.json(
      { detail: "Title must be 1–200 characters long" },
      { status: 400 },
    );
  }

  if (body.questions.length < 1 || body.questions.length > 50) {
    return NextResponse.json(
      { detail: "A quiz must contain between 1 and 50 questions" },
      { status: 400 },
    );
  }

  try {
    const response = await apiFetch(
      `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}/quiz`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          questions: body.questions,
        }),
      },
    );

    if (!response.ok) {
      const detail =
        response.status === 401
          ? "Please sign in again"
          : response.status === 404
            ? "Lesson not found"
            : response.status === 409
              ? "This lesson already has a quiz"
              : response.status === 422
                ? "Check your questions: each needs 2–6 non-empty options and exactly one correct answer. Question text must be at most 5,000 characters and options at most 1,000."
                : "Unable to create the quiz";

      return NextResponse.json(
        { detail },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { detail: "Server unavailable. Please try again later." },
      { status: 502 },
    );
  }
}