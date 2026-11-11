import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

export async function forwardDraftRequest(
  request: Request,
  path: "/courses/generate" | "/courses/generate-from-pdf" | "/courses/draft",
) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return Response.json({ detail: "Invalid request origin" }, { status: 403 });
  }

  let options: RequestInit;
  if (path === "/courses/generate-from-pdf") {
    const limit = 3 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > limit + 16 * 1024) {
      return Response.json({ detail: "PDF files must be 3 MB or smaller" }, { status: 413 });
    }
    const fields = await request.formData().catch(() => null);
    const file = fields?.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ detail: "Select a PDF file" }, { status: 400 });
    }
    if (file.size > limit) {
      return Response.json({ detail: "PDF files must be 3 MB or smaller" }, { status: 413 });
    }
    const upload = new FormData();
    upload.set("file", file);
    options = { body: upload };
  } else {
    const body: unknown = await request.json().catch(() => null);
    if (body === null) {
      return Response.json({ detail: "Invalid JSON" }, { status: 400 });
    }
    options = {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  try {
    const response = await apiFetch(path, {
      method: "POST",
      ...options,
      signal: path === "/courses/draft" ? undefined : AbortSignal.timeout(25_000),
    });

    return Response.json(await response.json(), { status: response.status });
  } catch {
    return Response.json(
      { detail: "Server unavailable. Please try again." },
      { status: 502 },
    );
  }
}
