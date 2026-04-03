import { SERVER_CHILD_CA_CRT } from "../generated/pem.js";
import { CODE_CA_CRT } from "../generated/pem.js";
import { getPrivateKeySha1, getPrivateKeySha512 } from "./keys.js";
import { bytesToBase64, pemCertificateToDerBase64, utf8 } from "./util.js";

export const SERVER_UID = "bluesky";
export const LEASE_CONTENT = `4102415999000:${SERVER_UID}`;

export async function signContentSha1(content: string): Promise<string> {
  const key = await getPrivateKeySha1();
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, utf8(content));
  return bytesToBase64(new Uint8Array(sig));
}

export async function signContentSha512(content: string): Promise<string> {
  const key = await getPrivateKeySha512();
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, utf8(content));
  return bytesToBase64(new Uint8Array(sig));
}

export async function getConfirmationStamp(machineId: string): Promise<string> {
  const timeStamp = Date.now();
  const contentToSign = `${timeStamp}:${machineId}`;
  const signature = await signContentSha1(contentToSign);
  const certificateBase64 = pemCertificateToDerBase64(SERVER_CHILD_CA_CRT);
  return `${timeStamp}:${machineId}:SHA1withRSA:${signature}:${certificateBase64}`;
}

export async function getLeaseSignature(): Promise<string> {
  const signature = await signContentSha512(LEASE_CONTENT);
  const certificateBase64 = pemCertificateToDerBase64(CODE_CA_CRT);
  return `SHA512withRSA-${signature}-${certificateBase64}`;
}

/** Prefix signed XML comment + JAXB-style XML body (no declaration). */
export async function getSignedXml(xmlBody: string): Promise<string> {
  const signature = await signContentSha1(xmlBody);
  const certificateBase64 = pemCertificateToDerBase64(SERVER_CHILD_CA_CRT);
  return `<!-- SHA1withRSA-${signature}-${certificateBase64} -->\n${xmlBody}`;
}
