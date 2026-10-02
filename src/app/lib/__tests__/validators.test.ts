import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
} from "../validators";

describe("validators", () => {
  describe("validateURL", () => {
    it("allows valid http and https URLs", () => {
      expect(validateURL("https://ippoo.market")).toBeNull();
      expect(validateURL("http://example.com/path?query=1")).toBeNull();
      expect(validateURL("")).toBeNull(); // optional field
    });

    it("rejects invalid URLs", () => {
      expect(validateURL("not-a-url")).toBe("URL invalide.");
    });

    it("rejects unsafe URL protocols (XSS vectors)", () => {
      expect(validateURL("javascript:alert(1)")).toBe("URL invalide (seuls http et https sont autorisés).");
      expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe("URL invalide (seuls http et https sont autorisés).");
      expect(validateURL("vbscript:msgbox(1)")).toBe("URL invalide (seuls http et https sont autorisés).");
    });
  });

  describe("validateEmail", () => {
    it("validates correct email addresses", () => {
      expect(validateEmail("user@example.com")).toBeNull();
    });

    it("rejects invalid email addresses", () => {
      expect(validateEmail("invalid-email")).toBe("Format d'email invalide.");
      expect(validateEmail("")).toBe("L'email est requis.");
    });
  });

  describe("validatePhone", () => {
    it("validates phone numbers", () => {
      expect(validatePhone("+229 01 97 00 00 00")).toBeNull();
    });

    it("rejects short or empty phone numbers", () => {
      expect(validatePhone("123")).toBe("Numéro invalide (ex: +229 01 97 00 00 00).");
      expect(validatePhone("")).toBe("Le numéro de téléphone est requis.");
    });
  });

  describe("validatePassword", () => {
    it("validates complex passwords", () => {
      expect(validatePassword("SecurePass123")).toBeNull();
    });

    it("rejects weak passwords", () => {
      expect(validatePassword("short1")).toBe("Au moins 8 caractères.");
      expect(validatePassword("onlyletters")).toBe("Doit contenir lettres et chiffres.");
    });
  });
});
