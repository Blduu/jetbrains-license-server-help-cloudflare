const PUBLIC_READ_PATHS = new Set(["/api/health", "/api/products", "/api/plugins"]);

export function isPublicCorsPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return PUBLIC_READ_PATHS.has(path);
}

export function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

/** Attach permissive CORS for public read-only JSON APIs (devtools / cross-origin dashboards). */
export function withPublicReadCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.has("Vary")) {
    headers.set("Vary", "Origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
