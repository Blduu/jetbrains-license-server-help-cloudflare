import { describe, expect, it } from "vitest";
import { withCommonHeaders } from "../src/http/headers.js";

describe("withCommonHeaders", () => {
  it("adds security headers and preserves status", () => {
    const r = withCommonHeaders(new Response("x", { status: 201 }));
    expect(r.status).toBe(201);
    expect(r.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(r.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(r.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });
});
