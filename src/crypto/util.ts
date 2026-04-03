const te = new TextEncoder();

export function pemPkcs8ToDer(pem: string): ArrayBuffer {
  const lines = pem.trim().split(/\r?\n/).filter((l) => !l.startsWith("-----"));
  const b64 = lines.join("");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

/** PEM body → DER bytes → standard Base64 (Hutool-style for certs in stamps). */
export function pemCertificateToDerBase64(pem: string): string {
  const der = pemPkcs8ToDer(pem);
  return bytesToBase64(new Uint8Array(der));
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) return btoa("");
  // Keep chunks at 8192: larger apply() argument counts can throw in some Workers/V8 paths.
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function utf8(s: string): Uint8Array {
  return te.encode(s);
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
