import { apiFetch } from "@/lib/api";
import { isAllowedOrigin } from "@/lib/origin";

type RouteContext = {
  params: Promise<{ courseId: string; topicId: string; lessonId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return Response.json({ detail: "Invalid request origin" }, { status: 403 });
  }

  const { courseId, topicId, lessonId } = await params;
  const validIds = [courseId, topicId, lessonId].every(
    (id) => /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647,
  );
  if (!validIds) {
    return Response.json({ detail: "Lesson not found" }, { status: 404 });
  }

  try {
    const response = await apiFetch(
      `/courses/${courseId}/topics/${topicId}/lessons/${lessonId}/generate`,
      { method: "POST", signal: AbortSignal.timeout(25_000) },
    );
    return Response.json(await response.json(), { status: response.status });
  } catch {
    return Response.json(
      { detail: "Lesson generation is unavailable. Please try again." },
      { status: 502 },
    );
  }
}
