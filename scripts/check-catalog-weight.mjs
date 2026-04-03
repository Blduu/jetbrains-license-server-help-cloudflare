/**
 * Prints approximate license JSON length for "single product" vs "all catalog" codes.
 * Run: node scripts/check-catalog-weight.mjs
 * Use to compare workload (Workers Free CPU 10ms vs Paid).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const productJson = JSON.parse(fs.readFileSync(path.join(root, "src/data/product.json"), "utf8"));
const pluginJson = JSON.parse(fs.readFileSync(path.join(root, "src/data/plugin.json"), "utf8"));

const codes = new Set();
for (const p of productJson) {
  if (!p.productCode?.trim()) continue;
  for (const part of p.productCode.split(",")) {
    const c = part.trim();
    if (c) codes.add(c);
  }
}
for (const pl of pluginJson) {
  const c = pl.productCode?.trim();
  if (c) codes.add(c);
}
const sorted = [...codes].sort();
const ideOnly = new Set();
for (const p of productJson) {
  if (!p.productCode?.trim()) continue;
  for (const part of p.productCode.split(",")) {
    const c = part.trim();
    if (c) ideOnly.add(c);
  }
}
const ideSorted = [...ideOnly].sort();
const id = "a".repeat(32);
function buildProductJson(code, exp) {
  return `{"code":${JSON.stringify(code)},"fallbackDate":${JSON.stringify(exp)},"paidUpTo":${JSON.stringify(exp)}}`;
}
function buildLicenseJson(productCodes, exp) {
  const inner = productCodes.map((c) => buildProductJson(c, exp)).join(",");
  return `{"licenseId":${JSON.stringify(id)},"licenseeName":"X","assigneeName":"Y","products":[${inner}],"metadata":"0120230914PSAX000005"}`;
}
const exp = "2090-09-03";
const one = buildLicenseJson(["II"], exp);
const allIde = buildLicenseJson(ideSorted, exp);
const all = buildLicenseJson(sorted, exp);
console.log("IDE-only codes (default when productCode omitted):", ideSorted.length, "json length", allIde.length);
console.log("IDE + all plugins (explicit long list only):", sorted.length, "json length", all.length);
console.log("Approx license JSON length (single II):", one.length);
