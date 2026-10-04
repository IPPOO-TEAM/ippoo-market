import { describe, it, expect } from "vitest";
import {
  randomSaltHex,
  derivePin,
  pinMatches,
  legacyHashPin,
  bytesToHex,
  hexToBytes,
} from "../pin-crypto";

describe("PIN Crypto Security", () => {
  it("generates a random salt with CSPRNG", () => {
    const salt1 = randomSaltHex(16);
    const salt2 = randomSaltHex(16);

    expect(salt1).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(salt2).toHaveLength(32);
    expect(salt1).not.toBe(salt2);
  });

  it("derives PIN hash with PBKDF2", async () => {
    const pin = "1234";
    const salt = randomSaltHex(16);

    const hash = await derivePin(pin, salt);
    expect(hash).toMatch(/^v2:[0-9a-f]+$/);

    const matches = await pinMatches(pin, hash, salt);
    expect(matches).toBe(true);

    const wrongMatches = await pinMatches("9999", hash, salt);
    expect(wrongMatches).toBe(false);
  });

  it("verifies legacy hash pin fallback", async () => {
    const pin = "1234";
    const legacyHash = legacyHashPin(pin);

    expect(legacyHash).toBe("h1509442");

    const matches = await pinMatches(pin, legacyHash, "");
    expect(matches).toBe(true);

    const wrongMatches = await pinMatches("4321", legacyHash, "");
    expect(wrongMatches).toBe(false);
  });

  it("correctly converts bytes to hex and hex to bytes", () => {
    const originalBytes = new Uint8Array([1, 15, 255, 128]);
    const hex = bytesToHex(originalBytes);
    expect(hex).toBe("010fff80");

    const convertedBytes = hexToBytes(hex);
    expect(Array.from(convertedBytes)).toEqual(Array.from(originalBytes));
  });
});
