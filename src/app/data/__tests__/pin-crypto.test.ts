import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "../../lib/validators";

describe("timingSafeEqual", () => {
  it("should return true for identical strings", () => {
    const hash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const hash2 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(timingSafeEqual(hash1, hash2)).toBe(true);
  });

  it("should return false for strings with different characters", () => {
    const hash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const hash2 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856";
    expect(timingSafeEqual(hash1, hash2)).toBe(false);
  });

  it("should return false for strings of different lengths", () => {
    const hash1 = "abc";
    const hash2 = "abcd";
    expect(timingSafeEqual(hash1, hash2)).toBe(false);
  });

  it("should return true for empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });
});
