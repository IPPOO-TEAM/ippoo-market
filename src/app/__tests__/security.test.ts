import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "../../../supabase/functions/server/crypto_utils";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("hello-world-123", "hello-world-123")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(timingSafeEqual("hello-world-123", "hello-world-124")).toBe(false);
    expect(timingSafeEqual("abc", "xyz")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeEqual("hello", "hello-world")).toBe(false);
    expect(timingSafeEqual("hello-world", "hello")).toBe(false);
  });

  it("returns false if inputs are not strings", () => {
    expect(timingSafeEqual(null as any, "test")).toBe(false);
    expect(timingSafeEqual("test", undefined as any)).toBe(false);
  });
});
