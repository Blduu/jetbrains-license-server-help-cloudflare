import { PRIVATE_KEY } from "../generated/pem.js";
import { pemPkcs8ToDer } from "./util.js";

let keySha1: CryptoKey | null = null;
let keySha512: CryptoKey | null = null;

export async function getPrivateKeySha1(): Promise<CryptoKey> {
  if (keySha1) return keySha1;
  const der = pemPkcs8ToDer(PRIVATE_KEY);
  keySha1 = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-1" },
    false,
    ["sign"],
  );
  return keySha1;
}

export async function getPrivateKeySha512(): Promise<CryptoKey> {
  if (keySha512) return keySha512;
  const der = pemPkcs8ToDer(PRIVATE_KEY);
  keySha512 = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
    false,
    ["sign"],
  );
  return keySha512;
}
