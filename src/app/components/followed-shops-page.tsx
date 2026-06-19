/* ═══════════════════════════════════════════
   IPPOO — Boutiques suivies (vue acheteur)
   ═══════════════════════════════════════════ */

import { useEffect, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Heart, Store } from "lucide-react";
import {
  hydrateFollowedShops,
  subscribe,
  getFollowedSnapshot,
  SERVER_SNAPSHOT,
  listFollowedShops,
  unfollowShop,
} from "../data/followed-shops";
import { resolveShopVisuals } from "../data/shop-resolver";

export function FollowedShopsPage() {
  useEffect(() => { hydrateFollowedShops(); }, []);
  useSyncExternalStore(subscribe, getFollowedSnapshot, () => SERVER_SNAPSHOT);
  const navigate = useNavigate();
  const items = listFollowedShops();

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
          Boutiques suivies
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            Aucune boutique suivie
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Suivez vos boutiques préférées pour retrouver leurs nouveautés rapidement.
          </p>
          <Link
            to="/vendeurs"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
            }}
          >
            <Store className="w-4 h-4" />
            Découvrir des boutiques
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((e) => {
            const v = resolveShopVisuals(e.slug, e.name);
            return (
              <div key={e.slug} className="bg-white rounded-2xl border border-border overflow-hidden">
                <Link to={`/boutique/${e.slug}`} className="block">
                  <div
                    className="aspect-[16/9] bg-[#F3F4F6] relative"
                    style={{
                      background: v.banner ? `url(${v.banner}) center/cover` : v.gradient,
                    }}
                  >
                    <div className="absolute bottom-2 left-2 w-12 h-12 rounded-xl bg-white shadow-md overflow-hidden flex items-center justify-center">
                      {v.logo ? (
                        <img src={v.logo} alt={v.name} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#E11D2E" }}>
                          {v.initials}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                      {v.name}
                    </div>
                    <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                      {[v.niche, v.city].filter(Boolean).join(" · ") || "Boutique"}
                    </div>
                  </div>
                </Link>
                <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                  <Link
                    to={`/boutique/${e.slug}`}
                    className="text-[#E11D2E]"
                    style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
                  >
                    Voir la boutique
                  </Link>
                  <button
                    onClick={() => unfollowShop(e.slug)}
                    className="text-muted-foreground hover:text-[#E11D2E]"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    Ne plus suivre
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
