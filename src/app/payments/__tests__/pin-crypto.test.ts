import { describe, it, expect } from "vitest";
import {
  safeCompareStrings,
  derivePin,
  pinMatches,
  randomSaltHex,
  legacyHashPin,
} from "../pin-crypto";

describe("pin-crypto security module", () => {
  describe("safeCompareStrings", () => {
    it("returns true for identical strings", () => {
      expect(safeCompareStrings("secret123", "secret123")).toBe(true);
      expect(safeCompareStrings("", "")).toBe(true);
      expect(safeCompareStrings("a", "a")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(safeCompareStrings("secret123", "secret124")).toBe(false);
      expect(safeCompareStrings("abcdefgh", "12345678")).toBe(false);
    });

    it("returns false for strings of different lengths", () => {
      expect(safeCompareStrings("secret", "secret123")).toBe(false);
      expect(safeCompareStrings("secret123", "secret")).toBe(false);
      expect(safeCompareStrings("", "a")).toBe(false);
    });

    it("handles non-string inputs safely", () => {
      expect(safeCompareStrings(null as any, "secret")).toBe(false);
      expect(safeCompareStrings("secret", undefined as any)).toBe(false);
    });
  });

  describe("randomSaltHex", () => {
    it("generates a hex string of specified byte length", () => {
      const salt16 = randomSaltHex(16);
      expect(salt16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(salt16).toMatch(/^[0-9a-f]{32}$/);

      const salt32 = randomSaltHex(32);
      expect(salt32).toHaveLength(64);
    });

    it("generates different salts on consecutive calls", () => {
      const s1 = randomSaltHex();
      const s2 = randomSaltHex();
      expect(s1).not.toBe(s2);
    });
  });

  describe("derivePin & pinMatches", () => {
    it("verifies matching PIN using v2 PBKDF2 hash", async () => {
      const salt = randomSaltHex(16);
      const hash = await derivePin("1234", salt);

      expect(hash.startsWith("v2:")).toBe(true);

      const matches = await pinMatches("1234", hash, salt);
      expect(matches).toBe(true);

      const wrongPinMatches = await pinMatches("9999", hash, salt);
      expect(wrongPinMatches).toBe(false);
    });

    it("verifies legacy multiplicative hash correctly", async () => {
      const pin = "5678";
      const legacyHash = legacyHashPin(pin);

      const matches = await pinMatches(pin, legacyHash, "somesalt");
      expect(matches).toBe(true);

      const wrongMatches = await pinMatches("0000", legacyHash, "somesalt");
      expect(wrongMatches).toBe(false);
    });
  });
});
