const SERVER_GUID = "a1b4aea8-b031-4302-b602-670a990272cb";
const SERVER_RANDOMNESS = "H2ulzLlh7E0=";

/** PKCS#8 DER base64 (LicenseServer2ToJRebelPrivateKey). */
const JREBEL_PRIVATE_PKCS8_B64 =
  "MIICXAIBAAKBgQDQ93CP6SjEneDizCF1P/MaBGf582voNNFcu8oMhgdTZ/N6qa6O7XJDr1FSCyaDdKSsPCdxPK7Y4Usq/fOPas2kCgYcRS/iebrtPEFZ/7TLfk39HLuTEjzo0/CNvjVsgWeh9BYznFaxFDLx7fLKqCQ6w1OKScnsdqwjpaXwXqiulwIDAQABAoGATOQvvBSMVsTNQkbgrNcqKdGjPNrwQtJkk13aO/95ZJxkgCc9vwPqPrOdFbZappZeHa5IyScOI2nLEfe+DnC7V80K2dBtaIQjOeZQt5HoTRG4EHQaWoDh27BWuJoip5WMrOd+1qfkOtZoRjNcHl86LIAh/+3vxYyebkug4UHNGPkCQQD+N4ZUkhKNQW7mpxX6eecitmOdN7Yt0YH9UmxPiW1LyCEbLwduMR2tfyGfrbZALiGzlKJize38shGC1qYSMvZFAkEA0m6psWWiTUWtaOKMxkTkcUdigalZ9xFSEl6jXFB94AD+dlPS3J5gNzTEmbPLc14VIWJFkO+UOrpl77w5uF2dKwJAaMpslhnsicvKMkv31FtBut5iK6GWeEafhdPfD94/bnidpP362yJl8Gmya4cI1GXvwH3pfj8S9hJVA5EFvgTB3QJBAJP1O1uAGp46X7Nfl5vQ1M7RYnHIoXkWtJ417Kb78YWPLVwFlD2LHhuy/okT4fk8LZ9LeZ5u1cp1RTdLIUqAiAECQC46OwOm87L35yaVfpUIjqg/1gsNwNsj8HvtXdF/9d30JIM3GwdytCvNRLqP35Ciogb9AO8ke8L6zY83nxPbClM=";

let jrebelKey: CryptoKey | null = null;

async function getJrebelKey(): Promise<CryptoKey> {
  if (jrebelKey) return jrebelKey;
  const raw = atob(JREBEL_PRIVATE_PKCS8_B64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  jrebelKey = await crypto.subtle.importKey(
    "pkcs8",
    buf,
    { name: "RSA-PKCS1-v1_5", hash: "SHA-1" },
    false,
    ["sign"],
  );
  return jrebelKey;
}

export async function jrebelLeaseSignature(
  clientRandomness: string,
  guid: string,
  offline: boolean,
  validFrom: string,
  validUntil: string,
): Promise<string> {
  const parts = offline
    ? [clientRandomness, SERVER_RANDOMNESS, guid, String(offline), validFrom, validUntil]
    : [clientRandomness, SERVER_RANDOMNESS, guid, String(offline)];
  const s2 = parts.join(";");
  const key = await getJrebelKey();
  const sig = await crypto.subtle.sign({ name: "RSA-PKCS1-v1_5" }, key, new TextEncoder().encode(s2));
  const sigBytes = new Uint8Array(sig);
  return btoa(String.fromCharCode(...sigBytes));
}

export async function jrebelLeasesJson(searchParams: URLSearchParams): Promise<Response> {
  const clientRandomness = searchParams.get("randomness");
  const username = searchParams.get("username");
  const guid = searchParams.get("guid");
  const clientTime = searchParams.get("clientTime");
  const offline = true;
  let validFrom = "";
  let validUntil = "";
  try {
    const clientTimeMillis = Number.parseInt(clientTime ?? "", 10);
    if (!Number.isNaN(clientTimeMillis)) {
      validFrom = String(clientTimeMillis);
      validUntil = String(clientTimeMillis + 180 * 24 * 60 * 60 * 1000);
    }
  } catch {
    /* ignore */
  }

  if (clientRandomness == null || username == null || guid == null) {
    return new Response("", { status: 403 });
  }

  const signature = await jrebelLeaseSignature(
    clientRandomness,
    guid,
    offline,
    validFrom,
    validUntil,
  );

  const o: Record<string, unknown> = {
    serverVersion: "3.2.4",
    serverProtocolVersion: "1.1",
    serverGuid: SERVER_GUID,
    groupType: "managed",
    id: 1,
    licenseType: 1,
    evaluationLicense: false,
    signature,
    serverRandomness: SERVER_RANDOMNESS,
    statusCode: "SUCCESS",
    offline,
    validFrom,
    validUntil,
    company: username,
    orderId: "",
    zeroIds: [],
    licenseValidFrom: validFrom,
    licenseValidUntil: validUntil,
  };

  return new Response(JSON.stringify(o), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function jrebelValidateJson(): Response {
  const o = {
    serverVersion: "3.2.4",
    serverProtocolVersion: "1.1",
    serverGuid: SERVER_GUID,
    groupType: "managed",
    statusCode: "SUCCESS",
    company: "Administrator",
    canGetLease: true,
    licenseType: 1,
    evaluationLicense: false,
    seatPoolType: "standalone",
  };
  return new Response(JSON.stringify(o), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function jrebelLeases1Json(searchParams: URLSearchParams): Response {
  const username = searchParams.get("username");
  const o: Record<string, unknown> = {
    serverVersion: "3.2.4",
    serverProtocolVersion: "1.1",
    serverGuid: SERVER_GUID,
    groupType: "managed",
    statusCode: "SUCCESS",
    msg: null,
    statusMessage: null,
  };
  if (username != null && username !== "") {
    o.company = username;
  }
  return new Response(JSON.stringify(o), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
