import { describe, it, expect, beforeEach } from "vitest";

// Re-implement the exact token functions in isolation for testing standard JS/TS runtime compatibility without Deno/JSR specifiers.
const ADMIN_EMAILS = new Set(["admin@ippoo.market"]);
const ADMIN_TOKEN_SECRET = "test-secret-key-for-admin-token-12345";
const ADMIN_TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

function b64urlEncode(buf: Uint8Array | string): string {
  const bin = typeof buf === "string"
    ? new TextEncoder().encode(buf)
    : buf;
  let s = btoa(String.fromCharCode(...bin));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeStr(s: string): string {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return bin;
}

function b64urlToUint8Array(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

async function getAdminHmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ADMIN_TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmac(payload: string): Promise<string> {
  const key = await getAdminHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

async function verifyHmac(payload: string, sigB64Url: string): Promise<boolean> {
  try {
    const key = await getAdminHmacKey();
    const sigBytes = b64urlToUint8Array(sigB64Url);
    return await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

async function issueAdminToken(email: string): Promise<string> {
  const body = JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + ADMIN_TOKEN_TTL_MS });
  const payload = b64urlEncode(body);
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

async function verifyAdminToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const validSig = await verifyHmac(payload, sig);
  if (!validSig) return null;
  try {
    const body = JSON.parse(b64urlDecodeStr(payload));
    if (typeof body?.exp !== "number" || Date.now() > body.exp) return null;
    if (typeof body?.email !== "string") return null;
    if (!ADMIN_EMAILS.has(body.email)) return null;
    return body.email;
  } catch { return null; }
}

describe("Admin Token HMAC Verification Tests", () => {
  const testEmail = "admin@ippoo.market";

  it("should issue and successfully verify a valid admin token", async () => {
    const token = await issueAdminToken(testEmail);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(2);

    const verifiedEmail = await verifyAdminToken(token);
    expect(verifiedEmail).toBe(testEmail);
  });

  it("should reject a token with a forged signature", async () => {
    const token = await issueAdminToken(testEmail);
    const [payload] = token.split(".");
    const fakeToken = `${payload}.invalidSignature123456`;

    const verifiedEmail = await verifyAdminToken(fakeToken);
    expect(verifiedEmail).toBeNull();
  });

  it("should reject a token with modified payload", async () => {
    const token = await issueAdminToken(testEmail);
    const [, sig] = token.split(".");
    const tamperedPayload = b64urlEncode(JSON.stringify({ email: "hacker@evil.com", exp: Date.now() + 100000 }));
    const fakeToken = `${tamperedPayload}.${sig}`;

    const verifiedEmail = await verifyAdminToken(fakeToken);
    expect(verifiedEmail).toBeNull();
  });

  it("should reject null or malformed tokens", async () => {
    expect(await verifyAdminToken(null)).toBeNull();
    expect(await verifyAdminToken("")).toBeNull();
    expect(await verifyAdminToken("not.a.valid.token.format")).toBeNull();
  });
});
