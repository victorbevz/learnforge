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
    const upstream = await fetch(`${apiUrl}/api/v1/auth/login`, {
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
        upstream.status === 401
          ? "Invalid email or password"
          : upstream.status === 422
            ? "Check your email and password. Password must be 8–128 characters long."
            : "Unable to sign in";

      return NextResponse.json(
        { detail },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    const data: unknown = await upstream.json();

    if (
      typeof data !== "object" ||
      data === null ||
      !("access_token" in data) ||
      typeof data.access_token !== "string" ||
      data.access_token.length === 0
    ) {
      return NextResponse.json(
        { detail: "Invalid authentication server response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        detail:
          "Authentication server unavailable. Please try again later.",
      },
      { status: 502 },
    );
  }
}