import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import {
  PREFIX, requireUser, requireAdmin, rateLimit, clientKey,
  VAPID_PUBLIC, sendToUser, pushKeyForEndpoint,
} from "../_shared.tsx";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  expirationTime: z.number().nullable().optional(),
});
const PushSendSchema = z.object({
  userId: z.string().min(1).optional(),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  link: z.string().max(300).optional(),
  tag: z.string().max(80).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export function registerPush(app: any) {
  app.get(`${PREFIX}/push/vapid-public`, (c: any) => c.json({ key: VAPID_PUBLIC }));

  app.post(`${PREFIX}/push/subscribe`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(clientKey(c, `push-sub:${auth.id}`), 20, 60_000)) {
      return c.json({ error: "Trop de requêtes" }, 429);
    }
    const parsed = SubscriptionSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Abonnement invalide" }, 400);
    const sub = parsed.data;
    const key = await pushKeyForEndpoint(auth.id, sub.endpoint);
    await kv.set(key, { ...sub, userId: auth.id, ts: Date.now() });
    return c.json({ ok: true });
  });

  app.post(`${PREFIX}/push/unsubscribe`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const body = await c.req.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) return c.json({ error: "Endpoint manquant" }, 400);
    await kv.del(await pushKeyForEndpoint(auth.id, endpoint));
    return c.json({ ok: true });
  });

  // Test perso : l'utilisateur s'envoie un push à lui-même
  app.post(`${PREFIX}/push/self`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    if (!rateLimit(clientKey(c, `push-self:${auth.id}`), 5, 60_000)) {
      return c.json({ error: "Trop de requêtes" }, 429);
    }
    const parsed = PushSendSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Payload invalide" }, 400);
    const r = await sendToUser(auth.id, parsed.data);
    return c.json({ ok: true, ...r });
  });

  // Admin : push vers n'importe quel utilisateur
  app.post(`${PREFIX}/admin/push/send`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = PushSendSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success || !parsed.data.userId) {
      return c.json({ error: "Payload invalide (userId requis)" }, 400);
    }
    const { userId, ...payload } = parsed.data;
    const r = await sendToUser(userId, payload);
    return c.json({ ok: true, ...r });
  });
}
