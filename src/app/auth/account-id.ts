/* ═══════════════════════════════════════════
   IPPOO — Identifiant utilisateur unique + payload QR signé
   - Chaque utilisateur reçoit un ID 12 chiffres unique sur cet appareil
     (en backend réel, l'unicité serait garantie côté serveur).
   - Le QR encode un payload signé HMAC-like avec une clé statique :
       IPPOO-LOGIN|<id>|<sig>
     ce qui rend le QR difficile à forger sans connaître la clé.
   - Le scan vérifie la signature ; la connexion finale exige la biométrie.
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";

const ACCOUNT_KEY = "ippoo:account-id";
const REGISTRY_KEY = "ippoo:id-registry";
const SIGNING_KEY = "IPPOO-CASH-AUTH-v1"; // statique app-wide ; un vrai backend signerait côté serveur

function loadRegistry(): Set<string> {
  try {
    const raw = safeGetItem(REGISTRY_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveRegistry(set: Set<string>) {
  safeSetItem(REGISTRY_KEY, JSON.stringify([...set]));
}

function rand12Digits(): string {
  const buf = new Uint32Array(3);
  crypto.getRandomValues(buf);
  const big = `${buf[0]}${buf[1]}${buf[2]}`;
  // 12 chiffres ; on évite que ça commence par 0
  const slice = big.slice(0, 12).padEnd(12, "0");
  return slice[0] === "0" ? `1${slice.slice(1)}` : slice;
}

/** djb2-like 32-bit hash, suffit ici (le vrai HMAC vivrait côté serveur). */
function sig(payload: string): string {
  const data = `${SIGNING_KEY}|${payload}`;
  let h = 5381 >>> 0;
  for (let i = 0; i < data.length; i++) h = (((h << 5) + h) ^ data.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().padStart(7, "0");
}

export type AccountId = {
  id: string;        // 12 chiffres
  pretty: string;    // formaté "XXXX-XXXX-XXXX"
  qrPayload: string; // chaîne encodée dans le QR
};

function format(id: string): string {
  return `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8, 12)}`;
}

function buildPayload(id: string): string {
  return `IPPOO-LOGIN|${id}|${sig(id)}`;
}

export function hasAccountId(): boolean {
  return !!safeGetItem(ACCOUNT_KEY);
}

export function getAccountId(): AccountId | null {
  const id = safeGetItem(ACCOUNT_KEY);
  if (!id) return null;
  return { id, pretty: format(id), qrPayload: buildPayload(id) };
}

export function ensureAccountId(): AccountId {
  const existing = getAccountId();
  if (existing) return existing;
  const registry = loadRegistry();
  let id = rand12Digits();
  let guard = 0;
  while (registry.has(id) && guard++ < 50) id = rand12Digits();
  registry.add(id);
  saveRegistry(registry);
  safeSetItem(ACCOUNT_KEY, id);
  return { id, pretty: format(id), qrPayload: buildPayload(id) };
}

export function resetAccountId(): AccountId {
  const old = safeGetItem(ACCOUNT_KEY);
  if (old) {
    const registry = loadRegistry();
    registry.delete(old);
    saveRegistry(registry);
  }
  safeRemoveItem(ACCOUNT_KEY);
  return ensureAccountId();
}

/** Vérifie un payload scanné. Retourne l'ID si valide, sinon null. */
export function verifyLoginPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("IPPOO-LOGIN|")) return null;
  const parts = trimmed.split("|");
  if (parts.length !== 3) return null;
  const [, id, signature] = parts;
  if (!/^\d{12}$/.test(id)) return null;
  if (sig(id) !== signature) return null;
  return id;
}

/** L'ID scanné correspond-il à l'utilisateur actuel de cet appareil ? */
export function isOwnAccount(id: string): boolean {
  return safeGetItem(ACCOUNT_KEY) === id;
}
