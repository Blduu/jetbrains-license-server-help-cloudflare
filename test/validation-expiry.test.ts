import { describe, expect, it } from "vitest";
import { validateExpiryDate } from "../src/validation/expiry.js";

describe("validateExpiryDate", () => {
  it("accepts valid UTC calendar dates", () => {
    expect(validateExpiryDate("2099-12-31")).toEqual({ ok: true });
    expect(validateExpiryDate("2024-02-29")).toEqual({ ok: true });
  });

  it("rejects empty, bad format, impossible dates", () => {
    expect(validateExpiryDate("").ok).toBe(false);
    expect(validateExpiryDate("2024-13-01").ok).toBe(false);
    expect(validateExpiryDate("2023-02-29").ok).toBe(false);
    expect(validateExpiryDate("24-01-01").ok).toBe(false);
  });
});
