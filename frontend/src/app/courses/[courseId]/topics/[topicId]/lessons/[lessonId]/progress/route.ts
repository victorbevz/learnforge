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

async function updateProgress(
  request: NextRequest,
  context: RouteContext,
  method: "PUT" | "DELETE",
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

  try {
    const response = await apiFetch(
      `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}/progress`,
      { method },
    );

    if (!response.ok) {
      const detail =
        response.status === 401
          ? "Please sign in again"
          : response.status === 404
            ? "Lesson not found"
            : "Unable to update lesson progress";

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

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  return updateProgress(request, context, "PUT");
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return updateProgress(request, context, "DELETE");
}