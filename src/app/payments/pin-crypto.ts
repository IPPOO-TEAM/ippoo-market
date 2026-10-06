/**
 * Ancien algorithme de hachage (multiplication par 31). Conservé uniquement pour
 * vérifier les PIN persistés avant la migration v2, puis re-hacher en PBKDF2.
 */
export function legacyHashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = (h * 31 + pin.charCodeAt(i)) | 0;
  return `h${h}`;
}

export const PIN_PBKDF2_ITER = 120_000;

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Generates a cryptographically secure random salt in hexadecimal format.
 * Using Math.random() is insecure for cryptographic operations as PRNGs are predictable.
 */
export function randomSaltHex(byteLen = 16): string {
  const arr = new Uint8Array(byteLen);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    // SECURITY: Fail closed if Web Crypto CSPRNG is unavailable rather than falling back to Math.random()
    throw new Error("Cryptographically secure random number generator is unavailable.");
  }
  return bytesToHex(arr);
}

/**
 * Dérive un hash PIN robuste (PBKDF2-SHA256, 120k itérations) avec salt par
 * appareil. Bien plus résistant au brute-force qu'un hash multiplicatif.
 */
export async function derivePin(pin: string, saltHex: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return "v2:legacy:" + legacyHashPin(pin + ":" + saltHex);
  }
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: PIN_PBKDF2_ITER,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return "v2:" + bytesToHex(new Uint8Array(bits));
}

export async function pinMatches(pin: string, storedHash: string, saltHex: string): Promise<boolean> {
  if (storedHash.startsWith("v2:")) {
    const derived = await derivePin(pin, saltHex);
    return derived === storedHash;
  }
  return legacyHashPin(pin) === storedHash;
}
