import { describe, it, expect, beforeEach } from "vitest";
import { loginAdmin, changeAdminPin, logoutAdmin, isAdminPinAuthed, verifyAdminPin } from "../auth";
import { safeGetItem, safeRemoveItem } from "../../lib/safe-storage";

describe("Admin PIN Auth", () => {
  beforeEach(() => {
    logoutAdmin();
    safeRemoveItem("ippoo:admin-pin");
    safeRemoveItem("ippoo:admin-pin-salt");
    safeRemoveItem("ippoo:admin-lockout");
  });

  it("authenticates correctly with default PIN and migrates to hashed PIN", async () => {
    expect(isAdminPinAuthed()).toBe(false);

    // Default PIN is '1234'
    const res = await loginAdmin("1234");
    expect(res.ok).toBe(true);
    expect(isAdminPinAuthed()).toBe(true);

    // Verify stored PIN is now hashed with PBKDF2 (starts with v2:)
    const stored = safeGetItem("ippoo:admin-pin");
    expect(stored).toBeDefined();
    expect(stored?.startsWith("v2:")).toBe(true);
  });

  it("rejects invalid PIN", async () => {
    const res = await loginAdmin("9999");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/PIN incorrect/);
    }
  });

  it("allows changing PIN and authenticates with new PIN", async () => {
    // First log in or verify with default PIN
    const changeRes = await changeAdminPin("1234", "5678");
    expect(changeRes.ok).toBe(true);

    // Old PIN fails
    const oldRes = await loginAdmin("1234");
    expect(oldRes.ok).toBe(false);

    // New PIN succeeds
    const newRes = await loginAdmin("5678");
    expect(newRes.ok).toBe(true);
    expect(isAdminPinAuthed()).toBe(true);
  });

  it("verifies admin PIN correctly without mutating session", async () => {
    const ok = await verifyAdminPin("1234");
    expect(ok).toBe(true);
    const bad = await verifyAdminPin("0000");
    expect(bad).toBe(false);
  });
});
