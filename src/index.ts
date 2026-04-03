import { withCommonHeaders } from "./http/headers.js";
import { route, type Env } from "./router.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const handled = await route(request, env);
      if (handled != null) return withCommonHeaders(handled);
      const assetResponse = await env.ASSETS.fetch(request);
      return withCommonHeaders(assetResponse);
    } catch (err) {
      console.error("worker error:", err);
      return withCommonHeaders(
        new Response(JSON.stringify({ error: "internal_error" }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=UTF-8" },
        }),
      );
    }
  },
} satisfies ExportedHandler<Env>;
