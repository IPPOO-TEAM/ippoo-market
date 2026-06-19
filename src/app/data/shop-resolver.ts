/* ═══════════════════════════════════════════
   IPPOO — Résolveur unifié des visuels de boutique
   Source unique de vérité pour logo / bannière / nom /
   description, fusionnée dans cet ordre de priorité :
     1. shop-assets (upload local sur ce device)
     2. public-vendors (registre serveur, ownerId/name)
     3. UserProfile (si propriétaire connecté)
     4. NICHE_COVERS (fallback Unsplash par niche)
     5. Dégradé + initiales (dernier recours)
   ═══════════════════════════════════════════ */

import { getShopAssets, slugifyShopName } from "./shop-assets";
import { getPublicVendors, type PublicVendor } from "./public-vendors";
import { getUserProfile, type UserProfile } from "../auth/user-profile";

export type ShopVisuals = {
  slug: string;
  name: string;
  logo?: string;
  banner?: string;
  avatar?: string;
  niche?: string;
  city?: string;
  description?: string;
  shopStatus?: "open" | "vacation" | "closed";
  initials: string;
  /** Couleurs de fallback dérivées du slug (déterministe). */
  gradient: string;
};

const NICHE_COVERS: Record<string, string> = {
  alimentaire:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70",
  cosmetique:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=70",
  mode:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=70",
  artisanat:
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=70",
  electronique:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=70",
  default:
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=70",
};

const GRADIENTS = [
  "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
  "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
  "linear-gradient(135deg, #16A34A 0%, #65A30D 100%)",
  "linear-gradient(135deg, #DB2777 0%, #F59E0B 100%)",
  "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #E11D2E 100%)",
];

function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";
}

function nicheKey(n?: string): string {
  if (!n) return "default";
  const k = slugifyShopName(n);
  if (NICHE_COVERS[k]) return k;
  if (k.includes("aliment") || k.includes("food")) return "alimentaire";
  if (k.includes("cosm") || k.includes("beaut")) return "cosmetique";
  if (k.includes("mode") || k.includes("textile") || k.includes("vetement")) return "mode";
  if (k.includes("artisan") || k.includes("art")) return "artisanat";
  if (k.includes("elec") || k.includes("tech")) return "electronique";
  return "default";
}

function findPublicBy(key: string, name?: string): PublicVendor | undefined {
  const all = getPublicVendors();
  const slug = slugifyShopName(name ?? key);
  return all.find((v) =>
    v.ownerId === key ||
    slugifyShopName(v.name) === slug ||
    slugifyShopName(v.name) === key,
  );
}

/**
 * Résout les visuels d'une boutique à partir d'un identifiant flexible :
 * peut être un slug, un ownerId, ou directement un nom de boutique.
 * `nameHint` accélère la résolution si déjà connu côté appelant.
 */
export function resolveShopVisuals(
  identifier: string,
  nameHint?: string,
): ShopVisuals {
  const profile: UserProfile | null = getUserProfile();
  const givenSlug = slugifyShopName(identifier || nameHint || "");
  const publicVendor = findPublicBy(identifier, nameHint);

  const name =
    nameHint ||
    publicVendor?.name ||
    (profile?.businessName && slugifyShopName(profile.businessName) === givenSlug ? profile.businessName : undefined) ||
    identifier;

  const slug = slugifyShopName(name);
  const assets = getShopAssets(slug, name);

  const isOwner = !!profile?.businessName && slugifyShopName(profile.businessName) === slug;

  const logo =
    assets.logo ||
    publicVendor?.logo ||
    (isOwner ? profile?.logo || profile?.avatar : undefined);

  const bannerFallback = NICHE_COVERS[nicheKey(publicVendor?.niche ?? (isOwner ? profile?.niche : undefined))];
  const banner =
    assets.banner ||
    publicVendor?.shopPhoto ||
    (isOwner ? profile?.shopPhoto : undefined) ||
    bannerFallback;

  const niche = publicVendor?.niche ?? (isOwner ? profile?.niche : undefined);
  const city = publicVendor?.city ?? (isOwner ? profile?.city : undefined);
  const description = publicVendor?.description ?? (isOwner ? profile?.description : undefined);
  const shopStatus = publicVendor?.shopStatus ?? (isOwner ? profile?.shopStatus : undefined);
  const avatar = publicVendor?.avatar ?? (isOwner ? profile?.avatar : undefined);

  const gradient = GRADIENTS[hashSlug(slug) % GRADIENTS.length];

  return {
    slug,
    name,
    logo,
    banner,
    avatar,
    niche,
    city,
    description,
    shopStatus,
    initials: initialsFor(name),
    gradient,
  };
}

/** Version batch pour les listes (vendors-page, home-page). */
export function resolveManyShops(items: Array<{ id?: string; ownerId?: string; name: string }>): ShopVisuals[] {
  return items.map((it) => resolveShopVisuals(it.ownerId || it.id || it.name, it.name));
}
