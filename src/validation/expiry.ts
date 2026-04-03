/** Strict `yyyy-MM-dd` with real calendar date (in UTC). */
export function validateExpiryDate(expiryDate: string): { ok: true } | { ok: false; reason: string } {
  const t = expiryDate.trim();
  if (!t) {
    return { ok: false, reason: "expiry_date_required" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return { ok: false, reason: "expiry_date_format" };
  }
  const [ys, ms, ds] = t.split("-").map((x) => Number.parseInt(x, 10));
  const d = new Date(Date.UTC(ys, ms - 1, ds));
  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCFullYear() !== ys ||
    d.getUTCMonth() !== ms - 1 ||
    d.getUTCDate() !== ds
  ) {
    return { ok: false, reason: "expiry_date_invalid" };
  }
  return { ok: true };
}

const MAX_FIELD_LEN = 2048;
const MAX_PRODUCT_CODE_LIST_LEN = 8192;

export function clampStringField(
  value: string,
  name: string,
): { ok: true; value: string } | { ok: false; reason: string } {
  if (value.length > MAX_FIELD_LEN) {
    return { ok: false, reason: `field_too_long:${name}` };
  }
  return { ok: true, value };
}

export function validateProductCodeParam(
  value: string | null,
): { ok: true } | { ok: false; reason: string } {
  if (value != null && value.length > MAX_PRODUCT_CODE_LIST_LEN) {
    return { ok: false, reason: "product_code_too_long" };
  }
  return { ok: true };
}
