import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

export async function forwardDraftRequest(
  request: Request,
  path: "/courses/generate" | "/courses/draft",
) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return Response.json({ detail: "Invalid request origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  try {
    const response = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: path === "/courses/generate" ? AbortSignal.timeout(25_000) : undefined,
    });

    return Response.json(await response.json(), { status: response.status });
  } catch {
    return Response.json(
      { detail: "Server unavailable. Please try again." },
      { status: 502 },
    );
  }
}
