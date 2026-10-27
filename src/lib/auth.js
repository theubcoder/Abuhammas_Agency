// Web Crypto API compatible (runs in both Edge Middleware and Node.js App Router)

const COOKIE_NAME = "ah_session";
const DEFAULT_SECRET = "raza_agency_abuhammas_secure_secret_key_2026";

export function getSecret() {
  const username = (process.env.ADMIN_USERNAME || "Raza").trim();
  const password = (process.env.ADMIN_PASSWORD || "828282").trim();
  const baseSecret = (process.env.SESSION_SECRET || DEFAULT_SECRET).trim();
  // Secret is cryptographically bound to the current ADMIN_PASSWORD and ADMIN_USERNAME.
  // The moment username or password changes in .env.local, any token generated with the old
  // password/username immediately fails HMAC verification, thereby LOGGING OUT ALL DEVICES!
  return `${baseSecret}:::${username}:::${password}`;
}

// Helper: base64url encoding/decoding
function toBase64Url(uint8Array) {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secretStr) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secretStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(payload, expiresInSeconds = 7 * 24 * 3600) {
  const enc = new TextEncoder();
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    iat: Math.floor(Date.now() / 1000),
  };
  const payloadStr = JSON.stringify(data);
  const payloadB64 = toBase64Url(enc.encode(payloadStr));

  const key = await getHmacKey(getSecret());
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const signatureB64 = toBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  try {
    const enc = new TextEncoder();
    const key = await getHmacKey(getSecret());
    const sigBytes = fromBase64Url(signatureB64);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(payloadB64)
    );
    if (!valid) return null;

    const payloadBytes = fromBase64Url(payloadB64);
    const dec = new TextDecoder();
    const data = JSON.parse(dec.decode(payloadBytes));

    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return null; // Expired
    }

    return data;
  } catch (err) {
    return null;
  }
}

export { COOKIE_NAME };
