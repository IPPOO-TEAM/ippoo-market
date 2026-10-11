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
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/**
 * Comparaison de chaînes en temps constant pour éviter les attaques par canal auxiliaire (timing attacks).
 */
export function safeCompareStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const lenA = a.length;
  const lenB = b.length;
  let diff = lenA ^ lenB;
  const maxLen = Math.max(lenA, lenB);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < lenA ? a.charCodeAt(i) : 0;
    const charB = i < lenB ? b.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }
  return diff === 0;
}

export function randomSaltHex(byteLen = 16): string {
  const arr = new Uint8Array(byteLen);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    throw new Error("Cryptographically secure PRNG unavailable");
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
    return safeCompareStrings(derived, storedHash);
  }
  return safeCompareStrings(legacyHashPin(pin), storedHash);
}
