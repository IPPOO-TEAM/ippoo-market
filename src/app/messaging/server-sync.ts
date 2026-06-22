/* ═══════════════════════════════════════════
   IPPOO - Messagerie : mirroring vers le serveur
   ─────────────────────────────────────────
   La UI de messagerie reste pilotée par le store local (mock + UX
   instantanée). En arrière-plan on persiste les messages sortants
   "moi" dans le KV serveur pour assurer un historique partagé entre
   appareils. La résolution d'un identifiant serveur stable pour
   chaque conversation locale (numeric id) se fait via un mapping
   stocké dans localStorage et indexé par le nom de l'interlocuteur.
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import {
  upsertServerConversation,
  sendServerMessage,
} from "../data/messaging-server";

const MAP_KEY = "ippoo:messaging:server-map";

type Mapping = Record<string, { convId: string; otherId: string }>;

function readMap(): Mapping {
  try {
    const raw = safeGetItem(MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Mapping;
  } catch { /* ignore */ }
  return {};
}

function writeMap(m: Mapping) {
  try { safeSetItem(MAP_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/**
 * Associe le numericId local à un convId serveur et le crée si besoin.
 * Le "otherId" est dérivé du slug du nom - pas un vrai user id Supabase,
 * mais suffisant pour conserver une conversation cohérente côté KV.
 */
export async function mirrorOutgoingMessage(input: {
  convNumericId: number;
  otherName: string;
  otherAvatar?: string;
  text: string;
}): Promise<void> {
  const key = `local:${input.convNumericId}`;
  const map = readMap();
  let entry = map[key];
  try {
    if (!entry) {
      const otherId = `peer-${slugify(input.otherName || "inconnu") || input.convNumericId}`;
      const conv = await upsertServerConversation({
        otherId,
        title: input.otherName,
        avatar: input.otherAvatar,
      });
      entry = { convId: conv.id, otherId };
      map[key] = entry;
      writeMap(map);
    }
    await sendServerMessage({
      convId: entry.convId,
      text: input.text,
      type: "text",
    });
  } catch (e) {
    // Le mirroring est silencieux : l'UI reste fonctionnelle.
    console.log(`[messaging-sync] mirror failed for conv ${input.convNumericId}:`, e);
  }
}
