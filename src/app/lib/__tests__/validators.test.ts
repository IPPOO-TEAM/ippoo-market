import { describe, expect, it } from "vitest";
import { validateURL } from "../validators";

describe("validateURL", () => {
  it("returns null for empty or null strings (optional field)", () => {
    expect(validateURL("")).toBeNull();
    expect(validateURL("   ")).toBeNull();
  });

  it("returns null for valid http and https URLs", () => {
    expect(validateURL("https://example.com")).toBeNull();
    expect(validateURL("http://example.com/path?query=1")).toBeNull();
  });

  it("returns error message for invalid URL structures", () => {
    expect(validateURL("not-a-url")).toBe("URL invalide.");
  });

  it("returns error message for unsafe protocols (XSS risks, local files)", () => {
    expect(validateURL("javascript:alert(1)")).toBe("URL invalide (protocole non sécurisé).");
    expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe("URL invalide (protocole non sécurisé).");
    expect(validateURL("file:///etc/passwd")).toBe("URL invalide (protocole non sécurisé).");
    expect(validateURL("ftp://example.com")).toBe("URL invalide (protocole non sécurisé).");
  });
});
