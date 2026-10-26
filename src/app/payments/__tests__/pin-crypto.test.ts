import { describe, it, expect, vi } from "vitest";
import {
  randomSaltHex,
  derivePin,
  pinMatches,
  legacyHashPin,
  bytesToHex,
  hexToBytes,
} from "../pin-crypto";

describe("pin-crypto", () => {
  it("generates randomSaltHex of correct length using CSPRNG", () => {
    const salt16 = randomSaltHex(16);
    expect(salt16).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(salt16).toMatch(/^[0-9a-f]{32}$/);

    const salt32 = randomSaltHex(32);
    expect(salt32).toHaveLength(64);

    const salt1 = randomSaltHex(16);
    const salt2 = randomSaltHex(16);
    expect(salt1).not.toBe(salt2);
  });

  it("throws error when CSPRNG is unavailable in randomSaltHex", () => {
    const originalCrypto = globalThis.crypto;
    try {
      // @ts-expect-error simulating missing CSPRNG
      delete globalThis.crypto;
      expect(() => randomSaltHex()).toThrow("Environnement cryptographique sécurisé indisponible");
    } finally {
      globalThis.crypto = originalCrypto;
    }
  });

  it("converts bytes to hex and hex to bytes accurately", () => {
    const bytes = new Uint8Array([0, 15, 255, 128]);
    const hex = bytesToHex(bytes);
    expect(hex).toBe("000fff80");
    expect(Array.from(hexToBytes(hex))).toEqual([0, 15, 255, 128]);
  });

  it("derives PIN hash and verifies PIN match correctly", async () => {
    const pin = "1234";
    const salt = randomSaltHex(16);

    const hash = await derivePin(pin, salt);
    expect(hash.startsWith("v2:")).toBe(true);

    const isMatch = await pinMatches(pin, hash, salt);
    expect(isMatch).toBe(true);

    const isWrongMatch = await pinMatches("9999", hash, salt);
    expect(isWrongMatch).toBe(false);
  });

  it("supports legacy PIN hash compatibility", async () => {
    const pin = "5678";
    const legacyHash = legacyHashPin(pin);
    expect(legacyHash).toBe(`h${legacyHashPin(pin).slice(1)}`);

    const isMatch = await pinMatches(pin, legacyHash, "somesalt");
    expect(isMatch).toBe(true);

    const isWrongMatch = await pinMatches("0000", legacyHash, "somesalt");
    expect(isWrongMatch).toBe(false);
  });
});
