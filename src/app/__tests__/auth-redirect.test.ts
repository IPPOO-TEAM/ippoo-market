import { describe, it, expect } from "vitest";
import { isValidRedirectUrl } from "../auth/redirect-validator";

describe("isValidRedirectUrl", () => {
  it("allows valid relative paths", () => {
    expect(isValidRedirectUrl("/reset-password")).toBe("/reset-password");
    expect(isValidRedirectUrl("/auth/callback?code=123")).toBe("/auth/callback?code=123");
  });

  it("rejects protocol-relative and backslash relative URLs", () => {
    expect(isValidRedirectUrl("//evil.com/login")).toBeUndefined();
    expect(isValidRedirectUrl("/\\evil.com/login")).toBeUndefined();
  });

  it("allows allowed host domains", () => {
    expect(isValidRedirectUrl("https://ippoo.market/login")).toBe("https://ippoo.market/login");
    expect(isValidRedirectUrl("https://app.ippoo.market/dashboard")).toBe("https://app.ippoo.market/dashboard");
    expect(isValidRedirectUrl("http://localhost:5173/auth")).toBe("http://localhost:5173/auth");
  });

  it("allows origin matching request origin", () => {
    const origin = "https://custom-domain.com";
    expect(isValidRedirectUrl("https://custom-domain.com/reset", origin)).toBe("https://custom-domain.com/reset");
  });

  it("rejects untrusted external domains (open redirect prevention)", () => {
    expect(isValidRedirectUrl("https://evil.com/phishing")).toBeUndefined();
    expect(isValidRedirectUrl("https://ippoo.market.attacker.com")).toBeUndefined();
    expect(isValidRedirectUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("handles null, undefined, and non-string inputs safely", () => {
    expect(isValidRedirectUrl(null)).toBeUndefined();
    expect(isValidRedirectUrl(undefined)).toBeUndefined();
    expect(isValidRedirectUrl("" as any)).toBeUndefined();
  });
});
