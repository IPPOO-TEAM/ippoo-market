import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "../validators";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("hello123world", "hello123world")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("a", "a")).toBe(true);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeEqual("hello", "hello1")).toBe(false);
    expect(timingSafeEqual("hello1", "hello")).toBe(false);
    expect(timingSafeEqual("", "a")).toBe(false);
    expect(timingSafeEqual("a", "")).toBe(false);
  });

  it("returns false for strings of same length but different contents", () => {
    expect(timingSafeEqual("hello123world", "hello123worle")).toBe(false);
    expect(timingSafeEqual("a", "b")).toBe(false);
    expect(timingSafeEqual("abc", "xyz")).toBe(false);
  });

  it("returns false if arguments are not strings", () => {
    expect(timingSafeEqual(null as any, "hello")).toBe(false);
    expect(timingSafeEqual("hello", undefined as any)).toBe(false);
  });
});
