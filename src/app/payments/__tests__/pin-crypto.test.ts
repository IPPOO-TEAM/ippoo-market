import { describe, expect, it } from "vitest";
import {
  randomSaltHex,
  derivePin,
  pinMatches,
  bytesToHex,
  hexToBytes,
  legacyHashPin,
} from "../pin-crypto";

describe("PIN Crypto Utils", () => {
  it("should convert bytes to hex and hex to bytes correctly", () => {
    const bytes = new Uint8Array([0, 15, 16, 255]);
    const hex = bytesToHex(bytes);
    expect(hex).toBe("000f10ff");

    const decoded = hexToBytes(hex);
    expect(Array.from(decoded)).toEqual([0, 15, 16, 255]);
  });

  it("should generate random salt in hex with expected byte length", () => {
    const salt16 = randomSaltHex(16);
    expect(salt16).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(salt16).toMatch(/^[0-9a-f]{32}$/);

    const salt32 = randomSaltHex(32);
    expect(salt32).toHaveLength(64);
    expect(salt32).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should derive PIN hash using PBKDF2 and verify matching PIN", async () => {
    const pin = "123456";
    const saltHex = randomSaltHex();

    const hash = await derivePin(pin, saltHex);
    expect(hash.startsWith("v2:")).toBe(true);

    const match = await pinMatches(pin, hash, saltHex);
    expect(match).toBe(true);

    const wrongMatch = await pinMatches("654321", hash, saltHex);
    expect(wrongMatch).toBe(false);
  });

  it("should match legacy PIN hashes correctly", async () => {
    const pin = "1234";
    const legacyHash = legacyHashPin(pin);
    const saltHex = randomSaltHex();

    const match = await pinMatches(pin, legacyHash, saltHex);
    expect(match).toBe(true);

    const wrongMatch = await pinMatches("9999", legacyHash, saltHex);
    expect(wrongMatch).toBe(false);
  });
});
