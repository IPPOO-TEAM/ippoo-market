import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser, rateLimit } from "../_shared.tsx";

const PinSetSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });
const PinVerifySchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

async function hashPin(pin: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function registerPin(app: any) {
  app.get(`${PREFIX}/pin/status`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const rec = await kv.get(`pin:${auth.id}`);
    return c.json({ hasPin: !!rec?.hash, lockedUntil: rec?.lockedUntil ?? 0 });
  });

  app.put(`${PREFIX}/pin`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = PinSetSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "PIN invalide (4 à 6 chiffres)" }, 400);
    const salt = crypto.randomUUID();
    const hash = await hashPin(parsed.data.pin, salt);
    await kv.set(`pin:${auth.id}`, { salt, hash, failures: 0, lockedUntil: 0, updatedAt: Date.now() });
    return c.json({ ok: true });
  });

  app.post(`${PREFIX}/pin/verify`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(`pin:${auth.id}`, 10, 60_000)) return c.json({ error: "Trop de tentatives" }, 429);
    const parsed = PinVerifySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "PIN invalide" }, 400);
    const rec = await kv.get(`pin:${auth.id}`);
    if (!rec?.hash) return c.json({ error: "Aucun PIN configuré" }, 404);
    const now = Date.now();
    if (rec.lockedUntil && rec.lockedUntil > now) {
      return c.json({ error: "PIN verrouillé", lockedUntil: rec.lockedUntil }, 423);
    }
    const hash = await hashPin(parsed.data.pin, rec.salt);
    if (hash !== rec.hash) {
      const failures = (rec.failures ?? 0) + 1;
      const lockedUntil = failures >= 5 ? now + 15 * 60_000 : 0;
      await kv.set(`pin:${auth.id}`, { ...rec, failures, lockedUntil });
      return c.json({ error: "PIN incorrect", remaining: Math.max(0, 5 - failures), lockedUntil }, 401);
    }
    await kv.set(`pin:${auth.id}`, { ...rec, failures: 0, lockedUntil: 0 });
    return c.json({ ok: true });
  });
}
