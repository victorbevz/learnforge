import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

function isValidId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647;
}

async function forwardRequest(
  courseId: string,
  method: "PATCH" | "DELETE",
  body?: { title: string; description: string | null },
) {
  try {
    const response = await apiFetch(`/courses/${courseId}`, {
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
            ? "Course not found"
            : "Unable to update or delete the course";

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

  const { courseId } = await context.params;

  if (!isValidId(courseId)) {
    return NextResponse.json(
      { detail: "Course not found" },
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
    !("description" in body)
  ) {
    return NextResponse.json(
      { detail: "Title and description fields are required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const description = body.description;

  if (title.length === 0 || title.length > 200) {
    return NextResponse.json(
      { detail: "Title must be 1–200 characters long" },
      { status: 400 },
    );
  }

  if (
    description !== null &&
    (typeof description !== "string" || description.length > 10_000)
  ) {
    return NextResponse.json(
      { detail: "Description must be at most 10,000 characters long" },
      { status: 400 },
    );
  }

  return forwardRequest(courseId, "PATCH", {
    title,
    description:
      typeof description === "string"
        ? description.trim() || null
        : null,
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

  const { courseId } = await context.params;

  if (!isValidId(courseId)) {
    return NextResponse.json(
      { detail: "Course not found" },
      { status: 404 },
    );
  }

  return forwardRequest(courseId, "DELETE");
}