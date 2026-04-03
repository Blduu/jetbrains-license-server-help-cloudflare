import { CODE_CA_CRT } from "../generated/pem.js";
import { getPrivateKeySha1 } from "../crypto/keys.js";
import { bytesToBase64, pemCertificateToDerBase64, utf8 } from "../crypto/util.js";

const METADATA_DEFAULT = "0120230914PSAX000005";

/** Hutool IdUtil.fastSimpleUUID: UUID without hyphens, lowercase hex. */
export function fastSimpleUuid(): string {
  return crypto.randomUUID().replace(/-/g, "").toLowerCase();
}

function buildProductJson(code: string, expiryDate: string): string {
  return `{"code":${JSON.stringify(code)},"fallbackDate":${JSON.stringify(expiryDate)},"paidUpTo":${JSON.stringify(expiryDate)}}`;
}

/** Match Hutool JSON field order: licenseId, licenseeName, assigneeName, products, metadata */
export function buildLicensePartJson(
  licenseId: string,
  licenseeName: string,
  assigneeName: string,
  productCodes: string[],
  expiryDate: string,
  metadata: string = METADATA_DEFAULT,
): string {
  const productsInner = productCodes.map((c) => buildProductJson(c, expiryDate)).join(",");
  return `{"licenseId":${JSON.stringify(licenseId)},"licenseeName":${JSON.stringify(licenseeName)},"assigneeName":${JSON.stringify(assigneeName)},"products":[${productsInner}],"metadata":${JSON.stringify(metadata)}}`;
}

/** License JSON UTF-8 → Base64 (Hutool encode of string as UTF-8). */
export function utf8JsonToLicenseBase64(json: string): string {
  return bytesToBase64(utf8(json));
}

export async function generateActivationCode(
  licensesName: string,
  assigneeName: string,
  expiryDate: string,
  productCodeSet: Set<string> | string[],
): Promise<string> {
  const codes =
    productCodeSet instanceof Set
      ? [...productCodeSet].sort()
      : [...productCodeSet].sort();
  const licenseId = fastSimpleUuid();
  const licensePartJson = buildLicensePartJson(
    licenseId,
    licensesName,
    assigneeName,
    codes,
    expiryDate,
  );
  const licensePartBase64 = utf8JsonToLicenseBase64(licensePartJson);
  const key = await getPrivateKeySha1();
  const sig = await crypto.subtle.sign(
    { name: "RSA-PKCS1-v1_5" },
    key,
    utf8(licensePartJson),
  );
  const signatureBase64 = bytesToBase64(new Uint8Array(sig));
  const certBase64 = pemCertificateToDerBase64(CODE_CA_CRT);
  return `${licenseId}-${licensePartBase64}-${signatureBase64}-${certBase64}`;
}
