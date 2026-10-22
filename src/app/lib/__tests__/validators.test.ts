import { describe, it, expect } from "vitest";
import { validateURL } from "../validators";

describe("validateURL", () => {
  it("allows empty or blank string", () => {
    expect(validateURL("")).toBeNull();
    expect(validateURL("   ")).toBeNull();
  });

  it("allows valid http and https URLs", () => {
    expect(validateURL("https://example.com")).toBeNull();
    expect(validateURL("http://example.com/path?query=1")).toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(validateURL("not-a-url")).toBe("URL invalide.");
  });

  it("rejects non-http/https URL schemes (XSS prevention)", () => {
    expect(validateURL("javascript:alert(1)")).toBe("URL invalide (seuls http:// et https:// sont autorisés).");
    expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe("URL invalide (seuls http:// et https:// sont autorisés).");
    expect(validateURL("vbscript:msgbox(1)")).toBe("URL invalide (seuls http:// et https:// sont autorisés).");
    expect(validateURL("file:///etc/passwd")).toBe("URL invalide (seuls http:// et https:// sont autorisés).");
  });
});
