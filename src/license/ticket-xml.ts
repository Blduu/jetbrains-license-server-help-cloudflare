import {
  LEASE_CONTENT,
  SERVER_UID,
  getConfirmationStamp,
  getLeaseSignature,
  getSignedXml,
} from "../crypto/license-server-sign.js";
import { escapeXml } from "../crypto/util.js";

const HutoolRandomBase =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function randomTicketId(): string {
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += HutoolRandomBase[buf[i]! % HutoolRandomBase.length]!;
  }
  return s;
}

function wrapObtainTicketXml(fields: {
  action: string;
  confirmationStamp: string;
  leaseSignature: string;
  message: string;
  prolongationPeriod: string;
  responseCode: string;
  salt: string;
  serverLease: string;
  serverUid: string;
  ticketId: string;
  ticketProperties: string;
  validationDeadlinePeriod: string;
  validationPeriod: string;
}): string {
  const e = escapeXml;
  return (
    `<ObtainTicketResponse>` +
    `<action>${e(fields.action)}</action>` +
    `<confirmationStamp>${e(fields.confirmationStamp)}</confirmationStamp>` +
    `<leaseSignature>${e(fields.leaseSignature)}</leaseSignature>` +
    `<message>${e(fields.message)}</message>` +
    `<prolongationPeriod>${e(fields.prolongationPeriod)}</prolongationPeriod>` +
    `<responseCode>${e(fields.responseCode)}</responseCode>` +
    `<salt>${e(fields.salt)}</salt>` +
    `<serverLease>${e(fields.serverLease)}</serverLease>` +
    `<serverUid>${e(fields.serverUid)}</serverUid>` +
    `<ticketId>${e(fields.ticketId)}</ticketId>` +
    `<ticketProperties>${e(fields.ticketProperties)}</ticketProperties>` +
    `<validationDeadlinePeriod>${e(fields.validationDeadlinePeriod)}</validationDeadlinePeriod>` +
    `<validationPeriod>${e(fields.validationPeriod)}</validationPeriod>` +
    `</ObtainTicketResponse>`
  );
}

function wrapPingXml(fields: {
  action: string;
  confirmationStamp: string;
  leaseSignature: string;
  message: string;
  responseCode: string;
  salt: string;
      serverLease: string;
  serverUid: string;
  validationDeadlinePeriod: string;
  validationPeriod: string;
}): string {
  const e = escapeXml;
  return (
    `<PingResponse>` +
    `<action>${e(fields.action)}</action>` +
    `<confirmationStamp>${e(fields.confirmationStamp)}</confirmationStamp>` +
    `<leaseSignature>${e(fields.leaseSignature)}</leaseSignature>` +
    `<message>${e(fields.message)}</message>` +
    `<responseCode>${e(fields.responseCode)}</responseCode>` +
    `<salt>${e(fields.salt)}</salt>` +
    `<serverLease>${e(fields.serverLease)}</serverLease>` +
    `<serverUid>${e(fields.serverUid)}</serverUid>` +
    `<validationDeadlinePeriod>${e(fields.validationDeadlinePeriod)}</validationDeadlinePeriod>` +
    `<validationPeriod>${e(fields.validationPeriod)}</validationPeriod>` +
    `</PingResponse>`
  );
}

function wrapProlongXml(fields: {
  action: string;
  confirmationStamp: string;
  leaseSignature: string;
  message: string;
  responseCode: string;
  salt: string;
  serverLease: string;
  serverUid: string;
  validationDeadlinePeriod: string;
  validationPeriod: string;
}): string {
  const e = escapeXml;
  return (
    `<ProlongTicketResponse>` +
    `<action>${e(fields.action)}</action>` +
    `<confirmationStamp>${e(fields.confirmationStamp)}</confirmationStamp>` +
    `<leaseSignature>${e(fields.leaseSignature)}</leaseSignature>` +
    `<message>${e(fields.message)}</message>` +
    `<responseCode>${e(fields.responseCode)}</responseCode>` +
    `<salt>${e(fields.salt)}</salt>` +
    `<serverLease>${e(fields.serverLease)}</serverLease>` +
    `<serverUid>${e(fields.serverUid)}</serverUid>` +
    `<validationDeadlinePeriod>${e(fields.validationDeadlinePeriod)}</validationDeadlinePeriod>` +
    `<validationPeriod>${e(fields.validationPeriod)}</validationPeriod>` +
    `</ProlongTicketResponse>`
  );
}

function wrapReleaseXml(fields: {
  action: string;
  confirmationStamp: string;
  leaseSignature: string;
  message: string;
  responseCode: string;
  salt: string;
  serverLease: string;
  serverUid: string;
  validationDeadlinePeriod: string;
  validationPeriod: string;
}): string {
  const e = escapeXml;
  return (
    `<ReleaseTicketResponse>` +
    `<action>${e(fields.action)}</action>` +
    `<confirmationStamp>${e(fields.confirmationStamp)}</confirmationStamp>` +
    `<leaseSignature>${e(fields.leaseSignature)}</leaseSignature>` +
    `<message>${e(fields.message)}</message>` +
    `<responseCode>${e(fields.responseCode)}</responseCode>` +
    `<salt>${e(fields.salt)}</salt>` +
    `<serverLease>${e(fields.serverLease)}</serverLease>` +
    `<serverUid>${e(fields.serverUid)}</serverUid>` +
    `<validationDeadlinePeriod>${e(fields.validationDeadlinePeriod)}</validationDeadlinePeriod>` +
    `<validationPeriod>${e(fields.validationPeriod)}</validationPeriod>` +
    `</ReleaseTicketResponse>`
  );
}

async function commonStamp(machineId: string, salt: string | null) {
  const confirmationStamp = await getConfirmationStamp(machineId ?? "");
  const leaseSignature = await getLeaseSignature();
  return {
    confirmationStamp,
    leaseSignature,
    salt: salt ?? "",
    serverLease: LEASE_CONTENT,
    serverUid: SERVER_UID,
    validationDeadlinePeriod: "-1",
    validationPeriod: "600000",
  };
}

export async function handleObtainTicket(params: URLSearchParams): Promise<string> {
  const hostNameParam = params.get("hostName");
  const licenseeValue = hostNameParam == null ? "null" : hostNameParam;
  const machineId = params.get("machineId") ?? "";
  const salt = params.get("salt");
  const base = await commonStamp(machineId, salt);
  const xml = wrapObtainTicketXml({
    action: "NONE",
    message: "",
    prolongationPeriod: "600000",
    responseCode: "OK",
    ticketId: randomTicketId(),
    ticketProperties: `licensee=${licenseeValue}\tlicenseeType=5\tmetadata=0120211231PSAN000005`,
    ...base,
  });
  return getSignedXml(xml);
}

export async function handlePing(params: URLSearchParams): Promise<string> {
  const machineId = params.get("machineId") ?? "";
  const salt = params.get("salt");
  const base = await commonStamp(machineId, salt);
  const xml = wrapPingXml({
    action: "NONE",
    message: "",
    responseCode: "OK",
    ...base,
  });
  return getSignedXml(xml);
}

export async function handleProlongTicket(params: URLSearchParams): Promise<string> {
  const machineId = params.get("machineId") ?? "";
  const salt = params.get("salt");
  const base = await commonStamp(machineId, salt);
  const xml = wrapProlongXml({
    action: "NONE",
    message: "",
    responseCode: "OK",
    ...base,
  });
  return getSignedXml(xml);
}

export async function handleReleaseTicket(params: URLSearchParams): Promise<string> {
  const machineId = params.get("machineId") ?? "";
  const salt = params.get("salt");
  const base = await commonStamp(machineId, salt);
  const xml = wrapReleaseXml({
    action: "NONE",
    message: "",
    responseCode: "OK",
    ...base,
  });
  return getSignedXml(xml);
}
