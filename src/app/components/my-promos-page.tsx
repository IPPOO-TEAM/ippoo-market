/* ═══════════════════════════════════════════
   IPPOO — Promotions vendeur
   CRUD des codes promo applicables à la boutique active.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  ArrowLeft, Plus, Tag, X, Edit2, Trash2, Calendar, Percent, BadgePercent, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  hydrateMyPromos,
  subscribe as subscribePromos,
  getMyPromosSnapshot,
  SERVER_SNAPSHOT as PROMOS_SNAPSHOT,
  listMyPromos,
  addMyPromo,
  updateMyPromo,
  deleteMyPromo,
  isPromoActive,
  type MyPromo,
  type PromoType,
} from "../data/my-promos";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";

export function MyPromosPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateMyPromos(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribePromos, getMyPromosSnapshot, () => PROMOS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const navigate = useNavigate();
  const [editing, setEditing] = useState<MyPromo | "new" | null>(null);

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug);
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  if (!isSeller(profile) || !slug) {
    return <Navigate to="/boutique" replace />;
  }

  const promos = listMyPromos(slug);
  const activeCount = promos.filter(isPromoActive).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Promotions
          </h1>
          {allShops.length > 1 && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              Boutique : {activeShopName}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: 13,
            boxShadow: "0 6px 14px rgba(232,32,42,.3)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground" style={{ fontSize: 11 }}>Codes actifs</div>
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "#16A34A" }}>
            <AnimatedNumber value={activeCount} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground" style={{ fontSize: 11 }}>Total créé</div>
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22 }}>
            <AnimatedNumber value={promos.length} />
          </div>
        </div>
      </div>

      {promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            Aucune promotion
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Créez un code promo pour stimuler vos ventes.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Plus className="w-4 h-4" />
            Créer mon premier code
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <PromoRow
              key={p.id}
              promo={p}
              onEdit={() => setEditing(p)}
              onToggle={() => {
                updateMyPromo(p.id, { active: !p.active });
                toast.success(p.active ? "Code désactivé" : "Code activé");
              }}
              onDelete={() => {
                if (confirm(`Supprimer le code "${p.code}" ?`)) {
                  deleteMyPromo(p.id);
                  toast.success("Code supprimé");
                }
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <PromoEditor
          shopSlug={slug}
          promo={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PromoRow({
  promo, onEdit, onToggle, onDelete,
}: { promo: MyPromo; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const active = isPromoActive(promo);
  const valueLabel = promo.type === "percent" ? `-${promo.value}%` : `-${formatPrice(promo.value)} FCFA`;
  const period = [
    promo.startsAt ? `du ${promo.startsAt}` : null,
    promo.endsAt ? `au ${promo.endsAt}` : null,
  ].filter(Boolean).join(" ");

  return (
    <div className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ background: active ? "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)" : "#9CA3AF" }}
      >
        <BadgePercent className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{promo.code}</span>
          <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: "#E11D2E" }}>
            {valueLabel}
          </span>
          {active ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white" style={{ background: "#16A34A", fontSize: 9, fontWeight: 700 }}>
              <CheckCircle2 className="w-2.5 h-2.5" />
              Actif
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: "#9CA3AF", fontSize: 9, fontWeight: 700 }}>
              Inactif
            </span>
          )}
        </div>
        <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
          {promo.label || "—"}
          {period && ` · ${period}`}
          {promo.maxUses != null && ` · ${promo.usedCount}/${promo.maxUses}`}
        </div>
      </div>
      <button onClick={onToggle} className="p-2 rounded-lg border border-border hover:bg-muted" title={promo.active ? "Désactiver" : "Activer"}>
        {promo.active ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>
      <button onClick={onEdit} className="p-2 rounded-lg border border-border hover:bg-muted">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} className="p-2 rounded-lg border border-border hover:bg-[#FEF2F2] hover:border-[#E11D2E] hover:text-[#E11D2E]">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PromoEditor({
  shopSlug, promo, onClose,
}: { shopSlug: string; promo: MyPromo | null; onClose: () => void }) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [label, setLabel] = useState(promo?.label ?? "");
  const [type, setType] = useState<PromoType>(promo?.type ?? "percent");
  const [value, setValue] = useState<string>(promo ? String(promo.value) : "10");
  const [minOrder, setMinOrder] = useState<string>(promo?.minOrder ? String(promo.minOrder) : "");
  const [startsAt, setStartsAt] = useState(promo?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(promo?.endsAt ?? "");
  const [maxUses, setMaxUses] = useState<string>(promo?.maxUses ? String(promo.maxUses) : "");
  const [active, setActive] = useState(promo?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const c = code.trim();
    if (c.length < 3) { setError("Le code doit faire au moins 3 caractères."); return; }
    const v = parseFloat(value.replace(",", "."));
    if (isNaN(v) || v <= 0) { setError("Valeur invalide."); return; }
    if (type === "percent" && v > 100) { setError("Le pourcentage ne peut pas dépasser 100."); return; }
    if (startsAt && endsAt && endsAt < startsAt) { setError("La date de fin doit être après la date de début."); return; }

    const payload = {
      shopSlug, code: c, label: label.trim() || undefined,
      type, value: v,
      minOrder: minOrder ? parseFloat(minOrder.replace(",", ".")) : undefined,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      active,
    };

    if (promo) {
      updateMyPromo(promo.id, payload);
      toast.success("Code mis à jour");
    } else {
      addMyPromo(payload);
      toast.success("Code créé");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            {promo ? "Modifier le code" : "Nouveau code promo"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Code (sera mis en majuscules)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SOLDES10"
              className="w-full px-3 py-2 rounded-xl border border-border uppercase"
              style={{ fontSize: 14, fontFamily: "Poppins", fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Libellé (interne)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Soldes de fin d'année"
              className="w-full px-3 py-2 rounded-xl border border-border"
              style={{ fontSize: 13 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Type de remise</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PromoType)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white"
                style={{ fontSize: 13 }}
              >
                <option value="percent">Pourcentage</option>
                <option value="amount">Montant fixe</option>
              </select>
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                Valeur {type === "percent" ? "(%)" : "(FCFA)"}
              </label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                className="w-full px-3 py-2 rounded-xl border border-border"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Commande minimum (FCFA, optionnel)</label>
            <input
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              inputMode="numeric"
              className="w-full px-3 py-2 rounded-xl border border-border"
              style={{ fontSize: 13 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Début</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Fin</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Usage maximum (optionnel)</label>
            <input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              inputMode="numeric"
              placeholder="ex: 100"
              className="w-full px-3 py-2 rounded-xl border border-border"
              style={{ fontSize: 13 }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Code actif</span>
          </label>

          {error && (
            <div className="flex items-start gap-1.5 text-[#E11D2E] bg-[#FEF2F2] rounded-lg p-2" style={{ fontSize: 12 }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins", fontWeight: 700, fontSize: 14,
            }}
          >
            {promo ? "Enregistrer" : "Créer le code"}
          </button>
        </div>
      </div>
    </div>
  );
}
