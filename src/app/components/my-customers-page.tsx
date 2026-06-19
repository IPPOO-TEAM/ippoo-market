/* ═══════════════════════════════════════════
   IPPOO — CRM léger vendeur · Mes clients
   Agrège les commandes du vendeur par acheteur
   (userId + nom de livraison) pour produire des
   fiches client avec total dépensé, nb commandes,
   panier moyen et date du dernier achat.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Navigate, useNavigate } from "react-router";
import { ArrowLeft, Users, Search, Phone, MapPin, Package } from "lucide-react";
import {
  getUserProfile,
  subscribe as subscribeProfile,
  SERVER_SNAPSHOT as PROFILE_SNAPSHOT,
  isSeller,
} from "../auth/user-profile";
import {
  hydrateMyShops,
  subscribe as subscribeShops,
  getMyShopsSnapshot,
  SERVER_SNAPSHOT as SHOPS_SNAPSHOT,
  listAllShops,
  getActiveShopSlug,
} from "../data/my-shops";
import { listOrders, type OrderRecord } from "../data/orders-server";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";

type Customer = {
  key: string;
  name: string;
  phone?: string;
  city?: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: number;
};

export function MyCustomersPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug);
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  useEffect(() => {
    if (!isSeller(profile)) { setLoading(false); return; }
    let alive = true;
    listOrders()
      .then((all) => {
        if (!alive) return;
        const mine = all.filter((o) =>
          o.items.some((it) => it.vendorId === slug || it.vendorId === activeShopName),
        );
        setOrders(mine);
      })
      .catch(() => { if (alive) setOrders([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [profile, slug, activeShopName]);

  if (!isSeller(profile) || !slug) {
    return <Navigate to="/boutique" replace />;
  }

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      const name = o.shippingAddress?.name?.trim() || "Client";
      const key = (o.userId || name).toLowerCase();
      const mine = o.items.filter((it) => it.vendorId === slug || it.vendorId === activeShopName);
      const subtotal = mine.reduce((s, it) => s + it.unitPrice * it.qty, 0);
      const c = map.get(key) ?? {
        key, name, phone: o.shippingAddress?.phone, city: o.shippingAddress?.city,
        orders: 0, totalSpent: 0, lastOrderAt: 0,
      };
      c.orders += 1;
      c.totalSpent += subtotal;
      if (o.createdAt > c.lastOrderAt) c.lastOrderAt = o.createdAt;
      if (!c.phone && o.shippingAddress?.phone) c.phone = o.shippingAddress.phone;
      if (!c.city && o.shippingAddress?.city) c.city = o.shippingAddress.city;
      map.set(key, c);
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, slug, activeShopName]);

  const filtered = search.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? "").includes(search) ||
        (c.city ?? "").toLowerCase().includes(search.toLowerCase()))
    : customers;

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgBasket = customers.length > 0 ? totalRevenue / customers.reduce((s, c) => s + c.orders, 0) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Mes clients
          </h1>
          {allShops.length > 1 && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              Boutique : {activeShopName}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Clients" value={customers.length} />
        <Stat label="CA total" value={totalRevenue} format={(n) => formatPrice(n)} suffix=" FCFA" />
        <Stat label="Panier moyen" value={Math.round(avgBasket)} format={(n) => formatPrice(n)} suffix=" FCFA" />
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, téléphone, ville)…"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-white"
          style={{ fontSize: 13 }}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            {customers.length === 0 ? "Aucun client pour le moment" : "Aucun résultat"}
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Les clients apparaîtront ici après leurs premières commandes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.key} className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#E11D2E" }}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
                  {c.name}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: 11 }}>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-[#E11D2E]">
                      <Phone className="w-3 h-3" />{c.phone}
                    </a>
                  )}
                  {c.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{c.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <AnimatedNumber value={c.orders} /> cmd
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#16A34A" }}>
                  <AnimatedNumber value={c.totalSpent} format={(n) => formatPrice(n)} suffix=" FCFA" />
                </div>
                <div className="text-muted-foreground" style={{ fontSize: 10 }}>
                  {new Date(c.lastOrderAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, format, suffix }: { label: string; value: number; format?: (n: number) => string; suffix?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-3">
      <div className="text-muted-foreground" style={{ fontSize: 11 }}>{label}</div>
      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
        <AnimatedNumber value={value} format={format} suffix={suffix} />
      </div>
    </div>
  );
}
