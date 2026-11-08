export async function GET() {
  const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const data = response.ok ? await response.json() : null;

    if (data?.status === "ok") {
      return Response.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // The API may still be starting.
  }

  return Response.json({ ready: false }, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}
