import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:3000";

  if (request.headers.get("origin") !== appOrigin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}