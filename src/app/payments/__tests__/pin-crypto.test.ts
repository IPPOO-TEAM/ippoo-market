import { describe, it, expect } from "vitest";
import { randomSaltHex, derivePin, pinMatches, legacyHashPin, bytesToHex, hexToBytes } from "../pin-crypto";

describe("pin-crypto", () => {
  it("bytesToHex and hexToBytes convert bidirectionally", () => {
    const bytes = new Uint8Array([0, 15, 255, 128]);
    const hex = bytesToHex(bytes);
    expect(hex).toBe("000fff80");
    const restored = hexToBytes(hex);
    expect(Array.from(restored)).toEqual([0, 15, 255, 128]);
  });

  it("randomSaltHex generates hex string of requested length", () => {
    const salt16 = randomSaltHex(16);
    expect(salt16).toHaveLength(32);
    const salt32 = randomSaltHex(32);
    expect(salt32).toHaveLength(64);
    expect(salt16).not.toBe(salt32);
  });

  it("derivePin and pinMatches work correctly with v2 hashes", async () => {
    const salt = randomSaltHex();
    const pin = "1234";
    const derived = await derivePin(pin, salt);
    expect(derived.startsWith("v2:")).toBe(true);

    const matches = await pinMatches("1234", derived, salt);
    expect(matches).toBe(true);

    const wrongMatches = await pinMatches("9999", derived, salt);
    expect(wrongMatches).toBe(false);
  });

  it("pinMatches handles legacy hashes", async () => {
    const pin = "5678";
    const legacyHash = legacyHashPin(pin);
    expect(legacyHash.startsWith("h")).toBe(true);

    const matches = await pinMatches("5678", legacyHash, "salt");
    expect(matches).toBe(true);

    const wrongMatches = await pinMatches("0000", legacyHash, "salt");
    expect(wrongMatches).toBe(false);
  });
});
