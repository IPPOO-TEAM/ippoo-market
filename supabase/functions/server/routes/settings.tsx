import { z } from "npm:zod@3.23.8";
import {
  PREFIX, requireAdmin, auditLog,
  getPlatformSettings, setPlatformSettings, DEFAULT_PLATFORM_SETTINGS,
} from "../_shared.tsx";

// Sous-ensemble public des réglages (lisible sans auth, pour checkout/factures).
function publicView(s: any) {
  return {
    commission: s.commission,
    vatRate: s.vatRate,
    shippingStd: s.shippingStd,
    shippingExpress: s.shippingExpress,
    freeShippingThreshold: s.freeShippingThreshold,
    defaultCurrency: s.defaultCurrency,
    refundWindowDays: s.refundWindowDays,
  };
}

const SettingsPatchSchema = z.object({
  commission: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  shippingStd: z.number().min(0).max(10_000_000).optional(),
  shippingExpress: z.number().min(0).max(10_000_000).optional(),
  freeShippingThreshold: z.number().min(0).max(100_000_000).optional(),
  defaultCurrency: z.string().max(8).optional(),
  refundWindowDays: z.number().int().min(0).max(365).optional(),
}).strip();

export function registerSettings(app: any) {
  // Réglages publics (commission/TVA/livraison) — utilisés par le frontend
  // pour les factures et l'affichage checkout. Lecture anonyme autorisée.
  app.get(`${PREFIX}/settings/public`, async (c: any) => {
    const s = await getPlatformSettings();
    return c.json({ settings: publicView(s) });
  });

  app.get(`${PREFIX}/admin/settings`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    return c.json({ settings: await getPlatformSettings(true), defaults: DEFAULT_PLATFORM_SETTINGS });
  });

  app.put(`${PREFIX}/admin/settings`, async (c: any) => {
    const auth = await requireAdmin(c);
    if ("error" in auth) return c.json({ error: auth.error }, auth.status);
    const parsed = SettingsPatchSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "Réglages invalides", details: parsed.error.flatten() }, 400);
    const next = await setPlatformSettings(parsed.data);
    await auditLog(auth.id, auth.email ?? null, "settings.update", { fields: Object.keys(parsed.data).join(",") });
    return c.json({ ok: true, settings: next });
  });
}
