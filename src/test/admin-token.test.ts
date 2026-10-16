import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "../../supabase/functions/server/_security";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("abc123secret", "abc123secret")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("abcd", "abc")).toBe(false);
  });

  it("returns false for strings of same length but different content", () => {
    expect(timingSafeEqual("abc123secret", "abc123secreX")).toBe(false);
    expect(timingSafeEqual("Xbc123secret", "abc123secret")).toBe(false);
    expect(timingSafeEqual("a", "b")).toBe(false);
  });
});
