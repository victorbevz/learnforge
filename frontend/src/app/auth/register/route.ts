import { NextRequest, NextResponse } from "next/server";

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
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

  try {
    const upstream = await fetch(`${apiUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      const detail =
        upstream.status === 409
          ? "Email is already registered"
          : upstream.status === 422
            ? "Enter a valid email and a password of 8–128 characters"
            : "Unable to create your account";

      return NextResponse.json(
        { detail },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { detail: "Authentication server unavailable. Please try again later." },
      { status: 502 },
    );
  }
}