import { allIdeProductCodesForLicense, plugins, products } from "./data/catalog.js";
import { corsPreflightResponse, isPublicCorsPath, withPublicReadCors } from "./http/cors.js";
import { generateActivationCode } from "./license/generate-code.js";
import {
  jrebelLeases1Json,
  jrebelLeasesJson,
  jrebelValidateJson,
} from "./license/jrebel.js";
import {
  handleObtainTicket,
  handlePing,
  handleProlongTicket,
  handleReleaseTicket,
} from "./license/ticket-xml.js";
import { parseActivationInput, validatePluginId } from "./validation/activation.js";

export interface Env {
  ASSETS: Fetcher;
}

const MAX_LICENSE_POST_BYTES = 65536;

async function mergeSearchParams(request: Request): Promise<URLSearchParams> {
  const url = new URL(request.url);
  const merged = new URLSearchParams(url.search);
  if (request.method === "POST") {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await request.clone().text();
      const body = new URLSearchParams(text);
      body.forEach((v, k) => merged.set(k, v));
    }
  }
  return merged;
}

function textXml(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/xml; charset=UTF-8" },
  });
}

function textPlain(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });
}

function json(body: unknown, cacheSec?: number): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=UTF-8",
  };
  if (cacheSec != null && cacheSec > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSec}`;
  }
  return new Response(JSON.stringify(body), { headers });
}

function methodNotAllowed(allow: string[]): Response {
  return new Response(JSON.stringify({ error: "method_not_allowed", allow }), {
    status: 405,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

type GenBody = {
  licenseName?: string;
  assigneeName?: string;
  expiryDate?: string;
  productCode?: string;
};

async function parseGenerateBody(
  request: Request,
): Promise<{ ok: true; body: GenBody } | { ok: false; response: Response }> {
  const cl = request.headers.get("content-length");
  if (cl != null) {
    const n = Number.parseInt(cl, 10);
    if (!Number.isNaN(n) && n > MAX_LICENSE_POST_BYTES) {
      return {
        ok: false,
        response: new Response("payload_too_large", { status: 413 }),
      };
    }
  }
  let t: string;
  try {
    t = await request.text();
  } catch {
    return {
      ok: false,
      response: new Response("read_error", { status: 400 }),
    };
  }
  if (t.length > MAX_LICENSE_POST_BYTES) {
    return {
      ok: false,
      response: new Response("payload_too_large", { status: 413 }),
    };
  }
  if (!t.trim()) {
    return { ok: true, body: {} };
  }
  try {
    return { ok: true, body: JSON.parse(t) as GenBody };
  } catch {
    return {
      ok: false,
      response: new Response("Invalid JSON", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
      }),
    };
  }
}

async function resolveProductCodes(productCodeParam: string | null): Promise<Set<string>> {
  if (productCodeParam == null || productCodeParam.trim() === "") {
    return allIdeProductCodesForLicense();
  }
  const set = new Set<string>();
  for (const p of productCodeParam.split(",")) {
    const c = p.trim();
    if (c) set.add(c);
  }
  return set;
}

function strictMethodGate(path: string, method: string): Response | null {
  if (path === "/guid") {
    return method === "GET" ? null : methodNotAllowed(["GET"]);
  }
  if (path === "/ja-netfilter") {
    return method === "GET" ? null : methodNotAllowed(["GET"]);
  }
  if (path === "/api/health") {
    return method === "GET" || method === "HEAD" ? null : methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
  }
  if (path === "/api/products" || path === "/api/plugins") {
    return method === "GET" || method === "HEAD"
      ? null
      : methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
  }
  if (path === "/api/downloadAgent") {
    return method === "GET" ? null : methodNotAllowed(["GET"]);
  }
  if (path === "/api/generateLicense" || path === "/api/generatePluginLicense") {
    return method === "GET" ? null : methodNotAllowed(["GET"]);
  }
  if (path === "/license-code/generate") {
    return method === "GET" || method === "POST"
      ? null
      : methodNotAllowed(["GET", "POST"]);
  }
  return null;
}

export async function route(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const method = request.method.toUpperCase();

  if (method === "OPTIONS" && isPublicCorsPath(path)) {
    return corsPreflightResponse();
  }

  const gate = strictMethodGate(path, method);
  if (gate != null) {
    return gate;
  }

  if (path === "/guid" && method === "GET") {
    return textPlain(crypto.randomUUID());
  }

  if (path === "/ja-netfilter" && method === "GET") {
    const assetUrl = new URL("/ja-netfilter.zip", request.url);
    const r = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    if (!r.ok) return r;
    const headers = new Headers(r.headers);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", 'attachment; filename="ja-netfilter.zip"');
    return new Response(r.body, { status: r.status, headers });
  }

  if (path === "/api/health" && (method === "GET" || method === "HEAD")) {
    if (method === "HEAD") {
      return withPublicReadCors(
        new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "no-store",
          },
        }),
      );
    }
    return withPublicReadCors(
      new Response(
        JSON.stringify({
          ok: true,
          service: "jetbrains-license-server-help-cloudflare",
        }),
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "no-store",
          },
        },
      ),
    );
  }

  if (path === "/api/products" && (method === "GET" || method === "HEAD")) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "public, max-age=600",
    };
    if (method === "HEAD") {
      return withPublicReadCors(new Response(null, { status: 200, headers }));
    }
    return withPublicReadCors(json(products, 600));
  }

  if (path === "/api/plugins" && (method === "GET" || method === "HEAD")) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "public, max-age=600",
    };
    if (method === "HEAD") {
      return withPublicReadCors(new Response(null, { status: 200, headers }));
    }
    return withPublicReadCors(json(plugins, 600));
  }

  if (path === "/api/downloadAgent" && method === "GET") {
    return Response.redirect(new URL("/ja-netfilter", request.url).toString(), 302);
  }

  if (path === "/api/generateLicense" && method === "GET") {
    const licenseeName = url.searchParams.get("licenseeName") ?? "";
    const assigneeName = url.searchParams.get("assigneeName") ?? "";
    const expiryDate = url.searchParams.get("expiryDate") ?? "";
    const productCode = url.searchParams.get("productCode");
    const checked = parseActivationInput(licenseeName, assigneeName, expiryDate, productCode);
    if (!checked.ok) return checked.response;
    const set = await resolveProductCodes(productCode);
    const code = await generateActivationCode(
      checked.licenseeName,
      checked.assigneeName,
      checked.expiryDate,
      set,
    );
    return textPlain(code);
  }

  if (path === "/api/generatePluginLicense" && method === "GET") {
    const pluginId = url.searchParams.get("pluginId") ?? "";
    const errP = validatePluginId(pluginId);
    if (errP != null) return errP;
    const licenseeName = url.searchParams.get("licenseeName") ?? "";
    const assigneeName = url.searchParams.get("assigneeName") ?? "";
    const expiryDate = url.searchParams.get("expiryDate") ?? "";
    const checked = parseActivationInput(licenseeName, assigneeName, expiryDate, null);
    if (!checked.ok) return checked.response;
    const pluginRows = plugins;
    let productCode =
      pluginRows.find((p) => String(p.id) === pluginId)?.productCode?.trim() ?? "";
    if (!productCode) productCode = `PLUGIN_${pluginId}`;
    const code = await generateActivationCode(
      checked.licenseeName,
      checked.assigneeName,
      checked.expiryDate,
      [productCode],
    );
    return textPlain(code);
  }

  if (path === "/license-code/generate" && (method === "GET" || method === "POST")) {
    let licenseName = "";
    let assigneeName = "";
    let expiryDate = "";
    let productCode: string | null = null;

    if (method === "GET") {
      licenseName = url.searchParams.get("licenseeName") ?? "";
      assigneeName = url.searchParams.get("assigneeName") ?? "";
      expiryDate = url.searchParams.get("expiryDate") ?? "";
      productCode = url.searchParams.get("productCode");
    } else {
      const parsed = await parseGenerateBody(request);
      if (!parsed.ok) return parsed.response;
      const body = parsed.body;
      licenseName = body.licenseName ?? "";
      assigneeName = body.assigneeName ?? "";
      expiryDate = body.expiryDate ?? "";
      productCode = body.productCode ?? null;
    }
    const checked = parseActivationInput(licenseName, assigneeName, expiryDate, productCode);
    if (!checked.ok) return checked.response;
    const set = await resolveProductCodes(productCode);
    const code = await generateActivationCode(
      checked.licenseeName,
      checked.assigneeName,
      checked.expiryDate,
      set,
    );
    return textPlain(code);
  }

  if (path === "/jrebel/leases" || path === "/agent/leases") {
    const params = await mergeSearchParams(request);
    return jrebelLeasesJson(params);
  }

  if (path === "/jrebel/leases/1" || path === "/agent/leases/1") {
    const params = await mergeSearchParams(request);
    return jrebelLeases1Json(params);
  }

  if (path === "/jrebel/validate-connection") {
    return jrebelValidateJson();
  }

  const rpcParams = await mergeSearchParams(request);
  if (path === "/rpc/obtainTicket.action") {
    const xml = await handleObtainTicket(rpcParams);
    return textXml(xml);
  }
  if (path === "/rpc/ping.action") {
    const xml = await handlePing(rpcParams);
    return textXml(xml);
  }
  if (path === "/rpc/prolongTicket.action") {
    const xml = await handleProlongTicket(rpcParams);
    return textXml(xml);
  }
  if (path === "/rpc/releaseTicket.action") {
    const xml = await handleReleaseTicket(rpcParams);
    return textXml(xml);
  }

  return null;
}
