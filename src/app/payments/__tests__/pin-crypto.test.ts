import { describe, it, expect, vi } from "vitest";
import { randomSaltHex, derivePin, pinMatches, legacyHashPin } from "../pin-crypto";

describe("pin-crypto", () => {
  it("generates a random salt hex string of expected length", () => {
    const salt = randomSaltHex(16);
    expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it("throws an error if crypto.getRandomValues is not available", () => {
    const originalCrypto = globalThis.crypto;
    try {
      // @ts-ignore
      delete globalThis.crypto;
      expect(() => randomSaltHex(16)).toThrow("Cryptographically secure random number generation");
    } finally {
      globalThis.crypto = originalCrypto;
    }
  });

  it("derives PIN and verifies matching PINs", async () => {
    const salt = randomSaltHex(16);
    const pin = "1234";
    const derived = await derivePin(pin, salt);

    expect(derived.startsWith("v2:")).toBe(true);

    const isMatch = await pinMatches(pin, derived, salt);
    expect(isMatch).toBe(true);

    const isWrongMatch = await pinMatches("0000", derived, salt);
    expect(isWrongMatch).toBe(false);
  });

  it("verifies legacy PIN hashes", async () => {
    const pin = "1234";
    const legacyHash = legacyHashPin(pin);

    expect(await pinMatches(pin, legacyHash, "salt")).toBe(true);
    expect(await pinMatches("9999", legacyHash, "salt")).toBe(false);
  });
});
