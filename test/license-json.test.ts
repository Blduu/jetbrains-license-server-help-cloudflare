import { describe, expect, it } from "vitest";
import { buildLicensePartJson, fastSimpleUuid } from "../src/license/generate-code.js";

describe("license JSON shape", () => {
  it("uses Hutool field order and compact arrays", () => {
    const id = fastSimpleUuid();
    expect(id.length).toBe(32);
    expect(id).toMatch(/^[0-9a-f]+$/);

    const json = buildLicensePartJson(id, "Co", "User", ["II", "PS"], "2099-12-31", "0120230914PSAX000005");
    expect(json).toBe(
      `{"licenseId":"${id}","licenseeName":"Co","assigneeName":"User","products":[{"code":"II","fallbackDate":"2099-12-31","paidUpTo":"2099-12-31"},{"code":"PS","fallbackDate":"2099-12-31","paidUpTo":"2099-12-31"}],"metadata":"0120230914PSAX000005"}`,
    );
  });
});
