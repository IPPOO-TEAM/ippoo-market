import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireAdmin } from "../_shared.tsx";

/* Annonces plateforme (broadcast). Stockage KV `announcement:<id>`.
   - GET public : renvoie toutes les annonces (le client filtre fenêtre/audience).
   - PUT/DELETE : réservé aux admins (requireAdmin). */
const ANN_PREFIX = "announcement:";
const ANN_ID_RE = /^ANN-[A-Za-z0-9]{3,40}$/;
const ANN_MAX_BYTES = 16 * 1024;

const AnnouncementSchema = z.object({
  value: z.object({
    id: z.string().regex(ANN_ID_RE),
    title: z.string().min(1).max(160),
    body: z.string().max(2000).default(""),
    level: z.enum(["info", "success", "warning", "critical"]).default("info"),
    audience: z.enum(["all", "buyers", "vendors", "admin"]).default("all"),
    startsAt: z.number().int().nonnegative().default(0),
    endsAt: z.number().int().nonnegative().nullable().default(null),
    active: z.boolean().default(true),
    createdAt: z.number().int().nonnegative().default(0),
  }).passthrough(),
});

export function registerAnnouncements(app: any) {
  app.get(`${PREFIX}/announcements/public`, async (c: any) => {
    try {
      const items = await kv.getByPrefix(ANN_PREFIX);
      return c.json({ items: items ?? [] });
    } catch (e) {
      console.log(`announcements GET error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.put(`${PREFIX}/announcements/:id`, async (c: any) => {
    try {
      const auth = await requireAdmin(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!ANN_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const parsed = AnnouncementSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Annonce invalide", details: parsed.error.flatten() }, 400);
      if (parsed.data.value.id !== id) return c.json({ error: "Identifiant incohérent" }, 400);
      const json = JSON.stringify(parsed.data.value);
      if (json.length > ANN_MAX_BYTES) return c.json({ error: "Annonce trop volumineuse" }, 413);
      await kv.set(`${ANN_PREFIX}${id}`, parsed.data.value);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`announcements PUT error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });

  app.delete(`${PREFIX}/announcements/:id`, async (c: any) => {
    try {
      const auth = await requireAdmin(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!ANN_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      await kv.del(`${ANN_PREFIX}${id}`);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`announcements DELETE error: ${e}`);
      return c.json({ error: "Erreur" }, 500);
    }
  });
}
