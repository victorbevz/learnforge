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

type LessonUpdate = {
  title: string;
  content: string;
  position: number;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

async function forwardRequest(
  lessonPath: string,
  method: "PATCH" | "DELETE",
  body?: LessonUpdate,
) {
  try {
    const response = await apiFetch(lessonPath, {
      method,
      ...(body !== undefined
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });

    if (!response.ok) {
      const detail =
        response.status === 401
          ? "Please sign in again"
          : response.status === 404
            ? "Lesson not found"
            : "Unable to update or delete the lesson";

      return NextResponse.json(
        { detail },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { detail: "Server unavailable. Please try again later." },
      { status: 502 },
    );
  }
}

export async function PATCH(
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
    !("content" in body) ||
    typeof body.content !== "string" ||
    !("position" in body) ||
    typeof body.position !== "number"
  ) {
    return NextResponse.json(
      { detail: "Title, content, and position fields are required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const content = body.content;
  const position = body.position;

  if (title.length === 0 || title.length > 200) {
    return NextResponse.json(
      { detail: "Title must be 1–200 characters long" },
      { status: 400 },
    );
  }

  if (content.length > 50_000) {
    return NextResponse.json(
      { detail: "Content must be at most 50,000 characters long" },
      { status: 400 },
    );
  }

  if (
    !Number.isInteger(position) ||
    position < 0 ||
    position > 2147483647
  ) {
    return NextResponse.json(
      { detail: "Position must be an integer between 0 and 2147483647" },
      { status: 400 },
    );
  }

  const lessonPath =
    `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}`;

  return forwardRequest(lessonPath, "PATCH", {
    title,
    content,
    position,
  });
}

export async function DELETE(
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

  const lessonPath =
    `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}`;

  return forwardRequest(lessonPath, "DELETE");
}