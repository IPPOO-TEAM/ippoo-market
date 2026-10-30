import { describe, it, expect } from "vitest";
import { timingSafeEqual, timingSafeEqualAsync } from "../validators";

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

describe("timingSafeEqualAsync", () => {
  it("returns true for identical strings", async () => {
    expect(await timingSafeEqualAsync("secret_password_123", "secret_password_123")).toBe(true);
    expect(await timingSafeEqualAsync("", "")).toBe(true);
  });

  it("returns false for different strings regardless of length", async () => {
    expect(await timingSafeEqualAsync("secret_password_123", "wrong_password")).toBe(false);
    expect(await timingSafeEqualAsync("short", "longer_string_here")).toBe(false);
  });

  it("returns false if arguments are not strings", async () => {
    expect(await timingSafeEqualAsync(null as any, "hello")).toBe(false);
    expect(await timingSafeEqualAsync("hello", undefined as any)).toBe(false);
  });
});
