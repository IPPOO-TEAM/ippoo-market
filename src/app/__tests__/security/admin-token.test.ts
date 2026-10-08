import { expect, test, describe, beforeAll } from "vitest";
import { issueAdminToken, verifyAdminToken, ADMIN_EMAILS } from "../../../../supabase/functions/server/_shared";

describe("Admin Token Security", () => {
  const adminEmail = "admin@ippoo.market";

  beforeAll(() => {
    ADMIN_EMAILS.add(adminEmail);
  });

  test("should issue and verify valid admin token", async () => {
    const token = await issueAdminToken(adminEmail);
    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const verifiedEmail = await verifyAdminToken(token);
    expect(verifiedEmail).toBe(adminEmail);
  });

  test("should reject token with tampered signature", async () => {
    const token = await issueAdminToken(adminEmail);
    const [payload, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === "a" ? "b" : "a");
    const tamperedToken = `${payload}.${tamperedSig}`;

    const verifiedEmail = await verifyAdminToken(tamperedToken);
    expect(verifiedEmail).toBeNull();
  });

  test("should reject token with tampered payload", async () => {
    const token = await issueAdminToken(adminEmail);
    const [payload, sig] = token.split(".");
    const tamperedPayload = payload.slice(0, -1) + (payload.slice(-1) === "a" ? "b" : "a");
    const tamperedToken = `${tamperedPayload}.${sig}`;

    const verifiedEmail = await verifyAdminToken(tamperedToken);
    expect(verifiedEmail).toBeNull();
  });

  test("should reject null or malformed tokens", async () => {
    expect(await verifyAdminToken(null)).toBeNull();
    expect(await verifyAdminToken("")).toBeNull();
    expect(await verifyAdminToken("invalid-token-no-dot")).toBeNull();
  });
});
