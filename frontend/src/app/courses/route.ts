import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";

export async function POST(request: NextRequest) {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:3000";

  if (request.headers.get("origin") !== appOrigin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 },
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
    typeof body.title !== "string"
  ) {
    return NextResponse.json(
      { detail: "Course title is required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const description = "description" in body ? body.description : null;

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

  try {
    const response = await apiFetch("/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          detail:
            response.status === 401
              ? "Please sign in again"
              : "Unable to create the course",
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { detail: "Server unavailable. Please try again later." },
      { status: 502 },
    );
  }
}