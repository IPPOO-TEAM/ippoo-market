import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser } from "../_shared.tsx";

const ALLOWED_USER_KV = new Set(["addresses", "team", "preferences", "security", "follows", "my-shops", "my-promos"]);
const KvPutSchema = z.object({ value: z.unknown() });

export function registerUserKv(app: any) {
  app.get(`${PREFIX}/user-kv/:key`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const key = c.req.param("key");
      if (!ALLOWED_USER_KV.has(key)) return c.json({ error: "Clé non autorisée" }, 400);
      const value = await kv.get(`user-kv:${auth.id}:${key}`);
      return c.json({ value: value ?? null });
    } catch (e) {
      console.log(`user-kv GET error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.put(`${PREFIX}/user-kv/:key`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const key = c.req.param("key");
      if (!ALLOWED_USER_KV.has(key)) return c.json({ error: "Clé non autorisée" }, 400);
      const parsed = KvPutSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "value manquant" }, 400);
      const json = JSON.stringify(parsed.data.value);
      if (json.length > 256 * 1024) return c.json({ error: "Trop volumineux (>256Ko)" }, 413);
      await kv.set(`user-kv:${auth.id}:${key}`, parsed.data.value);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`user-kv PUT error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });
}
