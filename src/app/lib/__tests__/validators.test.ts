import { describe, it, expect } from "vitest";
import { validatePassword } from "../validators";

describe("validatePassword", () => {
  it("returns error if password is less than 8 characters", () => {
    expect(validatePassword("Ab1")).toBe("Au moins 8 caractères.");
    expect(validatePassword("Short12")).toBe("Au moins 8 caractères.");
  });

  it("returns error if password lacks letters or digits", () => {
    expect(validatePassword("12345678")).toBe("Doit contenir lettres et chiffres.");
    expect(validatePassword("abcdefgh")).toBe("Doit contenir lettres et chiffres.");
  });

  it("returns null for a valid password containing letters and digits and >= 8 chars", () => {
    expect(validatePassword("Password123")).toBeNull();
    expect(validatePassword("secUr3P@ss")).toBeNull();
  });
});
