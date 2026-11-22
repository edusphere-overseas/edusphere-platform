/** Only same-site paths are allowed after sign-in (no links to other websites). */
export function safeNext(next: unknown, fallback = "/portal") {
  const value = typeof next === "string" ? next : "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
