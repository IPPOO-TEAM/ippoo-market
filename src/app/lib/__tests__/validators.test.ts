import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequired,
  validateMinLen,
  validateRCCM,
  validateIFU,
  validateURL,
  validateDateRange,
  safeCompare,
  compose,
  validateForm,
} from "../validators";

describe("Validators - Security & Logic", () => {
  describe("validateURL (Security: Scheme validation)", () => {
    it("should accept valid http and https URLs", () => {
      expect(validateURL("https://example.com")).toBeNull();
      expect(validateURL("http://example.com/api?foo=bar")).toBeNull();
      expect(validateURL("https://ippoo.market/produits/123")).toBeNull();
    });

    it("should allow empty or null input since URL is optional", () => {
      expect(validateURL("")).toBeNull();
      expect(validateURL("   ")).toBeNull();
      expect(validateURL(null as any)).toBeNull();
      expect(validateURL(undefined as any)).toBeNull();
    });

    it("should reject invalid URLs", () => {
      expect(validateURL("not-a-valid-url")).toBe("URL invalide.");
      expect(validateURL("ht tp://broken")).toBe("URL invalide.");
    });

    it("should reject dangerous schemes (XSS prevention)", () => {
      expect(validateURL("javascript:alert(1)")).toBe(
        "Protocole URL non sécurisé (http ou https requis).",
      );
      expect(validateURL("javascript:window.location='https://attacker.com'")).toBe(
        "Protocole URL non sécurisé (http ou https requis).",
      );
      expect(validateURL("data:text/html,<script>alert(1)</script>")).toBe(
        "Protocole URL non sécurisé (http ou https requis).",
      );
      expect(validateURL("vbscript:msgbox(1)")).toBe(
        "Protocole URL non sécurisé (http ou https requis).",
      );
      expect(validateURL("file:///etc/passwd")).toBe(
        "Protocole URL non sécurisé (http ou https requis).",
      );
    });
  });

  describe("safeCompare (Security: Timing attack mitigation)", () => {
    it("should return true for identical strings", () => {
      expect(safeCompare("123456", "123456")).toBe(true);
      expect(safeCompare("secret_token_abc_123", "secret_token_abc_123")).toBe(true);
      expect(safeCompare("", "")).toBe(true);
    });

    it("should return false for different strings of same length", () => {
      expect(safeCompare("123456", "123457")).toBe(false);
      expect(safeCompare("abcdef", "abcdeg")).toBe(false);
    });

    it("should return false for strings of different length", () => {
      expect(safeCompare("12345", "123456")).toBe(false);
      expect(safeCompare("123456", "12345")).toBe(false);
      expect(safeCompare("", "a")).toBe(false);
      expect(safeCompare("a", "")).toBe(false);
    });

    it("should handle non-string types safely", () => {
      expect(safeCompare(null as any, "test")).toBe(false);
      expect(safeCompare("test", undefined as any)).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("validates correct emails", () => {
      expect(validateEmail("user@example.com")).toBeNull();
      expect(validateEmail("admin@ippoo.market")).toBeNull();
    });

    it("rejects invalid emails", () => {
      expect(validateEmail("")).toBe("L'email est requis.");
      expect(validateEmail("invalid-email")).toBe("Format d'email invalide.");
      expect(validateEmail("test@domain")).toBe("Format d'email invalide.");
    });
  });

  describe("validatePhone", () => {
    it("validates phone numbers with at least 8 digits", () => {
      expect(validatePhone("+229 01 97 00 00 00")).toBeNull();
      expect(validatePhone("01970000")).toBeNull();
    });

    it("rejects invalid phone numbers", () => {
      expect(validatePhone("")).toBe("Le numéro de téléphone est requis.");
      expect(validatePhone("123")).toBe("Numéro invalide (ex: +229 01 97 00 00 00).");
    });
  });

  describe("validatePassword", () => {
    it("accepts valid passwords (>= 8 chars with letters & digits)", () => {
      expect(validatePassword("SecurePass123")).toBeNull();
    });

    it("rejects weak passwords", () => {
      expect(validatePassword("short1")).toBe("Au moins 8 caractères.");
      expect(validatePassword("lettersalllowercase")).toBe("Doit contenir lettres et chiffres.");
      expect(validatePassword("1234567890")).toBe("Doit contenir lettres et chiffres.");
    });
  });

  describe("validateRequired and validateMinLen", () => {
    it("validates required fields", () => {
      expect(validateRequired("Nom")("John")).toBeNull();
      expect(validateRequired("Nom")("")).toBe("Nom est requis.");
    });

    it("validates minimum length", () => {
      expect(validateMinLen(3, "Titre")("Abc")).toBeNull();
      expect(validateMinLen(3, "Titre")("Ab")).toBe("Titre doit faire au moins 3 caractères.");
    });
  });

  describe("compose and validateForm", () => {
    it("composes validators correctly", () => {
      const validator = compose(validateRequired("Email"), validateEmail);
      expect(validator("")).toBe("Email est requis.");
      expect(validator("bad")).toBe("Format d'email invalide.");
      expect(validator("test@example.com")).toBeNull();
    });

    it("validates form object", () => {
      const errors = validateForm(
        { email: "not-an-email", phone: "123" },
        { email: validateEmail, phone: validatePhone },
      );
      expect(errors.email).toBe("Format d'email invalide.");
      expect(errors.phone).toBe("Numéro invalide (ex: +229 01 97 00 00 00).");
    });
  });
});
