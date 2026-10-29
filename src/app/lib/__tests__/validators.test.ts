import { describe, it, expect } from "vitest";
import { validateURL, validateEmail, validatePhone } from "../validators";

describe("validateURL", () => {
  it("allows valid http and https URLs", () => {
    expect(validateURL("https://example.com")).toBeNull();
    expect(validateURL("http://localhost:3000")).toBeNull();
    expect(validateURL("https://sub.domain.co.uk/path?param=1#hash")).toBeNull();
  });

  it("returns null for empty or whitespace-only input (optional field)", () => {
    expect(validateURL("")).toBeNull();
    expect(validateURL("   ")).toBeNull();
    expect(validateURL(null as any)).toBeNull();
  });

  it("rejects dangerous javascript: and data: URLs (XSS protection)", () => {
    expect(validateURL("javascript:alert(1)")).toBe("URL invalide (http ou https uniquement).");
    expect(validateURL("javascript:fetch('https://attacker.com')")).toBe("URL invalide (http ou https uniquement).");
    expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe("URL invalide (http ou https uniquement).");
    expect(validateURL("ftp://files.example.com")).toBe("URL invalide (http ou https uniquement).");
  });

  it("rejects malformed URLs", () => {
    expect(validateURL("not-a-url")).toBe("URL invalide.");
    expect(validateURL("http://")).toBe("URL invalide.");
  });
});
