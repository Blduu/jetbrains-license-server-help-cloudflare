import { describe, expect, it } from "vitest";
import { bytesToBase64 } from "../src/crypto/util.js";

function refBytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    bin += String.fromCharCode(...sub);
  }
  return btoa(bin);
}

describe("bytesToBase64", () => {
  it("matches reference for empty", () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe(refBytesToBase64(new Uint8Array(0)));
  });

  it("matches reference for short and medium buffers", () => {
    for (const len of [1, 100, 8191, 8192, 8193, 20000]) {
      const buf = new Uint8Array(len);
      for (let i = 0; i < len; i++) buf[i] = i % 256;
      expect(bytesToBase64(buf)).toBe(refBytesToBase64(buf));
    }
  });
});
