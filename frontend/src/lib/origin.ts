import "server-only";

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = (
    process.env.APP_ORIGINS ?? "http://localhost:3000"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin);
}