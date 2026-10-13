import "server-only";

import { cookies } from "next/headers";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return Response.json(
      { detail: "Authentication required" },
      { status: 401 },
    );
  }

  const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${apiUrl}/api/v1${path}`, {
    ...options,
    headers,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(10_000),
  });
}