import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "../../../../supabase/functions/server/_shared";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("secret123", "secret123")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false for strings of same length but different content", () => {
    expect(timingSafeEqual("secret123", "secret124")).toBe(false);
    expect(timingSafeEqual("abc", "xyz")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeEqual("secret", "secret123")).toBe(false);
    expect(timingSafeEqual("secret123", "secret")).toBe(false);
    expect(timingSafeEqual("", "a")).toBe(false);
  });

  it("handles unicode characters correctly", () => {
    expect(timingSafeEqual("café", "café")).toBe(true);
    expect(timingSafeEqual("café", "cafe")).toBe(false);
  });
});
