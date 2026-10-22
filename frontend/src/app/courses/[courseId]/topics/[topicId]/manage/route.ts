import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

type RouteContext = {
  params: Promise<{
    courseId: string;
    topicId: string;
  }>;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

async function forwardRequest(
  courseId: string,
  topicId: string,
  method: "PATCH" | "DELETE",
  body?: { title: string; position: number },
) {
  try {
    const response = await apiFetch(
      `/courses/${courseId}/topics/${topicId}`,
      {
        method,
        ...(body !== undefined
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      },
    );

    if (!response.ok) {
      const detail =
        response.status === 401
          ? "Please sign in again"
          : response.status === 404
            ? "Topic not found"
            : "Unable to update or delete the topic";

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

  const { courseId, topicId } = await context.params;

  if (!isValidId(courseId) || !isValidId(topicId)) {
    return NextResponse.json(
      { detail: "Topic not found" },
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
    !("position" in body) ||
    typeof body.position !== "number"
  ) {
    return NextResponse.json(
      { detail: "Title and position fields are required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const position = body.position;

  if (title.length === 0 || title.length > 200) {
    return NextResponse.json(
      { detail: "Title must be 1–200 characters long" },
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

  return forwardRequest(courseId, topicId, "PATCH", {
    title,
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

  const { courseId, topicId } = await context.params;

  if (!isValidId(courseId) || !isValidId(topicId)) {
    return NextResponse.json(
      { detail: "Topic not found" },
      { status: 404 },
    );
  }

  return forwardRequest(courseId, topicId, "DELETE");
}