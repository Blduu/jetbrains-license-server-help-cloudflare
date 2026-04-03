import {
  clampStringField,
  validateExpiryDate,
  validateProductCodeParam,
} from "./expiry.js";

export type ActivationInput =
  | { ok: true; licenseeName: string; assigneeName: string; expiryDate: string }
  | { ok: false; response: Response };

export function parseActivationInput(
  licenseeName: string,
  assigneeName: string,
  expiryDate: string,
  productCode: string | null,
): ActivationInput {
  const ln = clampStringField(licenseeName, "licenseeName");
  if (!ln.ok) {
    return { ok: false, response: plainError(400, ln.reason) };
  }
  const an = clampStringField(assigneeName, "assigneeName");
  if (!an.ok) {
    return { ok: false, response: plainError(400, an.reason) };
  }
  const pc = validateProductCodeParam(productCode);
  if (!pc.ok) {
    return { ok: false, response: plainError(400, pc.reason) };
  }
  const exp = validateExpiryDate(expiryDate);
  if (!exp.ok) {
    return { ok: false, response: plainError(400, exp.reason) };
  }
  return {
    ok: true,
    licenseeName: ln.value,
    assigneeName: an.value,
    expiryDate: expiryDate.trim(),
  };
}

function plainError(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });
}

const MAX_PLUGIN_ID_LEN = 64;

export function validatePluginId(pluginId: string): Response | null {
  if (pluginId.length > MAX_PLUGIN_ID_LEN) {
    return plainError(400, "plugin_id_too_long");
  }
  return null;
}
