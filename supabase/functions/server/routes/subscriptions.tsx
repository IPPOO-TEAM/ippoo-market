import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser } from "../_shared.tsx";

/* Abonnement utilisateur (VIP). Stocké à `subscription:<userId>` afin que
   l'admin (GET /admin/subscriptions, qui balaie le préfixe `subscription:`)
   voie l'ensemble des abonnés. Source unique de vérité serveur. */

const SubSchema = z.object({
  planId: z.string().min(1).max(40),
  label: z.string().max(120).optional(),
  price: z.number().nonnegative(),
  startedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().nonnegative(),
  autoRenew: z.boolean().optional(),
});

// Activation côté serveur : durée fournie en jours, le serveur calcule
// startedAt/expiresAt à partir de l'horloge serveur (source de vérité).
const ActivateSchema = z.object({
  planId: z.string().min(1).max(40),
  label: z.string().max(120).optional(),
  price: z.number().nonnegative(),
  days: z.number().int().min(1).max(3650),
  autoRenew: z.boolean().optional(),
});

export function registerSubscriptions(app: any) {
  app.get(`${PREFIX}/subscriptions/me`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const rec = await kv.get(`subscription:${auth.id}`);
    return c.json({ subscription: rec ?? null });
  });

  app.put(`${PREFIX}/subscriptions/me`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = SubSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Abonnement invalide", details: parsed.error.flatten() }, 400);
    const rec = {
      ...parsed.data,
      userId: auth.id,
      userEmail: auth.email ?? null,
      autoRenew: parsed.data.autoRenew ?? true,
      updatedAt: Date.now(),
    };
    await kv.set(`subscription:${auth.id}`, rec);
    return c.json({ ok: true, subscription: rec });
  });

  // Activation : seul moyen recommandé. Le client envoie `days`, jamais des dates.
  app.post(`${PREFIX}/subscriptions/activate`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = ActivateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Activation invalide", details: parsed.error.flatten() }, 400);
    const now = Date.now();
    const prev: any = await kv.get(`subscription:${auth.id}`);
    // Si abonnement actif: prolonger depuis expiresAt, sinon démarrer maintenant.
    const baseAt = prev?.expiresAt && prev.expiresAt > now ? Number(prev.expiresAt) : now;
    const expiresAt = baseAt + parsed.data.days * 24 * 60 * 60 * 1000;
    const rec = {
      planId: parsed.data.planId,
      label: parsed.data.label ?? prev?.label,
      price: parsed.data.price,
      autoRenew: parsed.data.autoRenew ?? prev?.autoRenew ?? true,
      startedAt: prev?.startedAt && prev.expiresAt > now ? prev.startedAt : now,
      expiresAt,
      userId: auth.id,
      userEmail: auth.email ?? null,
      updatedAt: now,
    };
    await kv.set(`subscription:${auth.id}`, rec);
    return c.json({ ok: true, subscription: rec });
  });

  app.delete(`${PREFIX}/subscriptions/me`, async (c: any) => {
    const auth = await requireUser(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    // Annulation = on coupe l'auto-renouvellement, l'abonnement reste actif
    // jusqu'à expiresAt (cohérent avec l'UX profil).
    const rec: any = await kv.get(`subscription:${auth.id}`);
    if (!rec) return c.json({ ok: true });
    rec.autoRenew = false;
    rec.updatedAt = Date.now();
    await kv.set(`subscription:${auth.id}`, rec);
    return c.json({ ok: true, subscription: rec });
  });
}
