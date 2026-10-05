import { describe, it, expect } from "vitest";
import { validateURL, validateEmail, validatePhone, validatePassword } from "../validators";

describe("validateURL", () => {
  it("allows empty or whitespace input (optional field)", () => {
    expect(validateURL("")).toBeNull();
    expect(validateURL("   ")).toBeNull();
  });

  it("allows valid http and https URLs", () => {
    expect(validateURL("https://example.com")).toBeNull();
    expect(validateURL("http://example.com/path?query=1")).toBeNull();
    expect(validateURL("https://sub.domain.org:8080/test")).toBeNull();
  });

  it("rejects non-http/https URL schemes like javascript:, data:, ftp:, file:", () => {
    expect(validateURL("javascript:alert(1)")).toBe("Seules les URL HTTP/HTTPS sont autorisées.");
    expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe("Seules les URL HTTP/HTTPS sont autorisées.");
    expect(validateURL("ftp://files.example.com")).toBe("Seules les URL HTTP/HTTPS sont autorisées.");
    expect(validateURL("file:///etc/passwd")).toBe("Seules les URL HTTP/HTTPS sont autorisées.");
  });

  it("rejects malformed URLs", () => {
    expect(validateURL("not-a-url")).toBe("URL invalide.");
    expect(validateURL("http://")).toBe("URL invalide.");
  });
});
