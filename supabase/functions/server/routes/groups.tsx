import { z } from "npm:zod@3.23.8";
import * as kv from "../kv_store.tsx";
import { PREFIX, requireUser } from "../_shared.tsx";

// Each group is stored at `groups:public:<groupId>` so that any user can
// discover and join open groups across devices. Only the organizer (the
// owner of `value.organizerId` matching the auth user id) can upsert/delete
// a group. Participant joins are accepted as long as the caller is just
// appending themselves — full-rewrite by the organizer is also allowed.
const GROUP_PREFIX = "groups:public:";
const GROUP_MAX_BYTES = 64 * 1024;
const GROUP_ID_RE = /^GRP-[A-Z0-9-]{3,40}$/;
const GroupPublicSchema = z.object({
  value: z.object({
    id: z.string().regex(GROUP_ID_RE),
    name: z.string().min(1).max(160),
    product: z.string().min(1).max(160),
    organizerId: z.string().min(1).max(80),
    participants: z.array(z.object({ id: z.string().max(80) }).passthrough()).max(100),
  }).passthrough(),
});

export function registerGroups(app: any) {
  app.get(`${PREFIX}/groups/public`, async (c: any) => {
    try {
      const items = await kv.getByPrefix(GROUP_PREFIX);
      return c.json({ items: items ?? [] });
    } catch (e) {
      console.log(`groups/public GET error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.put(`${PREFIX}/groups/public/:id`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!GROUP_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const parsed = GroupPublicSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Groupement invalide", details: parsed.error.flatten() }, 400);
      if (parsed.data.value.id !== id) return c.json({ error: "Identifiant incohérent" }, 400);
      const json = JSON.stringify(parsed.data.value);
      if (json.length > GROUP_MAX_BYTES) return c.json({ error: "Groupement trop volumineux (>64Ko)" }, 413);
      const existing = await kv.get(`${GROUP_PREFIX}${id}`);
      const next = parsed.data.value;
      if (existing && existing.organizerId && existing.organizerId !== next.organizerId) {
        return c.json({ error: "Organisateur immuable" }, 403);
      }
      if (existing && existing.organizerId !== auth.id) {
        // Caller is not the organizer : allow only join-like changes
        // (add/update their own participant entry, leave everything else intact).
        const sameMeta =
          existing.name === next.name &&
          existing.product === next.product &&
          existing.priceNormal === next.priceNormal &&
          existing.targetQty === next.targetQty &&
          existing.maxParticipants === next.maxParticipants &&
          existing.expiresAt === next.expiresAt &&
          existing.status === next.status;
        if (!sameMeta) return c.json({ error: "Seul l'organisateur peut éditer le groupement" }, 403);
        const others = (existing.participants ?? []).filter((p: any) => p.id !== auth.id);
        const proposedOthers = (next.participants ?? []).filter((p: any) => p.id !== auth.id);
        if (JSON.stringify(others) !== JSON.stringify(proposedOthers)) {
          return c.json({ error: "Vous ne pouvez modifier que votre propre participation" }, 403);
        }
      } else if (!existing && next.organizerId !== auth.id) {
        return c.json({ error: "L'organisateur doit être l'auteur" }, 403);
      }
      await kv.set(`${GROUP_PREFIX}${id}`, next);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`groups/public PUT error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });

  app.delete(`${PREFIX}/groups/public/:id`, async (c: any) => {
    try {
      const auth = await requireUser(c);
      if ("error" in auth) return c.json({ error: auth.error }, auth.status);
      const id = c.req.param("id");
      if (!GROUP_ID_RE.test(id)) return c.json({ error: "Identifiant invalide" }, 400);
      const existing = await kv.get(`${GROUP_PREFIX}${id}`);
      if (!existing) return c.json({ ok: true });
      if (existing.organizerId !== auth.id) return c.json({ error: "Seul l'organisateur peut supprimer" }, 403);
      await kv.del(`${GROUP_PREFIX}${id}`);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`groups/public DELETE error: ${e}`);
      return c.json({ error: `Erreur` }, 500);
    }
  });
}
