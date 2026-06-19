/* ═══════════════════════════════════════════
   IPPOO — Étiquettes QR pour produits physiques
   Génère une planche imprimable d'étiquettes QR
   à coller sur chaque unité physique en stock,
   pour synchroniser l'inventaire physique et
   virtuel via le scan IPPOO.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore, useRef } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, Printer, Download, QrCode as QrIcon, Package, CheckSquare, Square,
  Sparkles, Minus, Plus,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  hydrateMyProducts,
  subscribe as subscribeProducts,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as PRODUCTS_SNAPSHOT,
  listMyProducts,
  type MyProduct,
} from "../data/my-products";
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
import { productUid, productScanUrl } from "../lib/product-uid";
import { formatPrice } from "./mock-data";

type LabelSize = "small" | "medium" | "large";

const LABEL_PRESETS: Record<LabelSize, { label: string; widthMm: number; heightMm: number; qrPx: number; perRow: number }> = {
  small:  { label: "Petites (40×30 mm)",   widthMm: 40, heightMm: 30, qrPx: 80,  perRow: 5 },
  medium: { label: "Moyennes (60×40 mm)",  widthMm: 60, heightMm: 40, qrPx: 110, perRow: 3 },
  large:  { label: "Grandes (90×60 mm)",   widthMm: 90, heightMm: 60, qrPx: 160, perRow: 2 },
};

export function MyProductLabelsPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateMyProducts(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeProducts, getMyProductsSnapshot, () => PRODUCTS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const slug = getActiveShopSlug(profile?.businessName);
  const shops = listAllShops(profile?.businessName);
  const shop = shops.find((s) => s.slug === slug);
  const shopName = shop?.name ?? profile?.businessName ?? "";

  const products = useMemo(
    () => (slug ? listMyProducts(slug) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, useSyncExternalStore(subscribeProducts, getMyProductsSnapshot, () => PRODUCTS_SNAPSHOT)],
  );

  const initialId = sp.get("product");
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (initialId && products.some((p) => p.id === initialId)) {
      const p = products.find((x) => x.id === initialId)!;
      map[p.id] = Math.max(1, p.stockQty || 1);
    } else {
      for (const p of products) {
        if (p.status === "published" && p.stockQty > 0) map[p.id] = p.stockQty;
      }
    }
    return map;
  });
  const [size, setSize] = useState<LabelSize>("medium");
  const [showPrice, setShowPrice] = useState(true);
  const [showShop, setShowShop] = useState(true);

  if (!isSeller(profile) || !slug) return <Navigate to="/boutique" replace />;

  const preset = LABEL_PRESETS[size];
  const totalLabels = Object.values(selected).reduce((s, n) => s + (n || 0), 0);

  const toggle = (p: MyProduct) => {
    setSelected((cur) => {
      const next = { ...cur };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = Math.max(1, p.stockQty || 1);
      return next;
    });
  };
  const setQty = (id: string, qty: number) => {
    setSelected((cur) => {
      const next = { ...cur };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 999);
      return next;
    });
  };

  const selectAll = () => {
    const map: Record<string, number> = {};
    for (const p of products) {
      if (p.stockQty > 0) map[p.id] = p.stockQty;
      else map[p.id] = 1;
    }
    setSelected(map);
  };
  const clearAll = () => setSelected({});

  const downloadOne = (p: MyProduct) => {
    const id = `qr-dl-${p.id}`;
    const canvas = document.getElementById(id) as HTMLCanvasElement | null;
    if (!canvas) { toast.error("QR non prêt"); return; }
    const a = document.createElement("a");
    a.download = `qr-${productUid({ id: p.id, reference: p.reference })}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast.success(`QR de "${p.name}" téléchargé`);
  };

  const handlePrint = () => {
    if (totalLabels === 0) { toast.error("Sélectionnez au moins 1 produit"); return; }
    window.print();
  };

  const labelRows: { product: MyProduct; index: number }[] = [];
  for (const p of products) {
    const n = selected[p.id] || 0;
    for (let i = 0; i < n; i++) labelRows.push({ product: p, index: i });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 pb-32 lg:pb-8 print:p-0 print:max-w-none">
      <PrintStyles preset={preset} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <button onClick={() => navigate("/boutique/produits")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Étiquettes QR
          </h1>
          <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
            Imprimez & collez sur vos produits physiques pour synchroniser l'inventaire
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={totalLabels === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
            fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
            boxShadow: "0 6px 14px rgba(232,32,42,.3)",
          }}
        >
          <Printer className="w-4 h-4" />
          Imprimer ({totalLabels})
        </button>
      </div>

      {/* Pédagogie */}
      <div className="print:hidden mb-4 bg-gradient-to-br from-[#FEF2F2] to-[#FFF7ED] rounded-2xl border border-[#FECACA] p-4">
        <div className="flex items-center gap-2 mb-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#E11D2E" }}>
          <Sparkles className="w-3.5 h-3.5" />
          Comment ça marche
        </div>
        <ul className="text-[#7C2D12] space-y-0.5" style={{ fontSize: 12, lineHeight: 1.55 }}>
          <li>• Sélectionnez les produits + le nombre d'étiquettes (par défaut = stock disponible).</li>
          <li>• Imprimez sur des planches autocollantes ou du papier classique.</li>
          <li>• Collez 1 étiquette sur chaque unité physique : son QR pointe vers la fiche en ligne.</li>
          <li>• Vos clients scannent → ils consultent la fiche, vérifient l'origine ou règlent via IPPOO CASH.</li>
        </ul>
      </div>

      {/* Options */}
      <div className="print:hidden grid sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>Taille des étiquettes</div>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(LABEL_PRESETS) as LabelSize[]).map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className="px-1.5 py-1.5 rounded-lg border text-center transition"
                  style={{
                    borderColor: active ? "#E11D2E" : "#E5E7EB",
                    background: active ? "#FEF2F2" : "white",
                    color: active ? "#E11D2E" : "#374151",
                    fontFamily: "Poppins", fontWeight: 600, fontSize: 10,
                  }}
                >
                  {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                  <div style={{ fontSize: 9, opacity: 0.7 }}>{LABEL_PRESETS[s].widthMm}×{LABEL_PRESETS[s].heightMm}mm</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>Affichage</div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12 }}>
              <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-[#E11D2E]" />
              Afficher le prix
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12 }}>
              <input type="checkbox" checked={showShop} onChange={(e) => setShowShop(e.target.checked)} className="accent-[#E11D2E]" />
              Afficher le nom de la boutique
            </label>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3">
          <div className="text-muted-foreground mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>Sélection rapide</div>
          <div className="flex gap-1.5">
            <button onClick={selectAll} className="flex-1 px-2 py-1.5 rounded-lg border border-border hover:bg-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              Tout cocher
            </button>
            <button onClick={clearAll} className="flex-1 px-2 py-1.5 rounded-lg border border-border hover:bg-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              Tout décocher
            </button>
          </div>
          <div className="mt-2 text-center" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#E11D2E" }}>
            {totalLabels} étiquette{totalLabels > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Liste produits */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center print:hidden">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            Aucun produit dans cette boutique
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Ajoutez d'abord des produits pour générer leurs étiquettes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4 print:hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
            Produits ({products.length})
          </div>
          <div className="divide-y divide-border">
            {products.map((p) => {
              const checked = !!selected[p.id];
              const qty = selected[p.id] || 0;
              const uid = productUid({ id: p.id, reference: p.reference });
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <button onClick={() => toggle(p)} className="flex-shrink-0 text-[#E11D2E]">
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] overflow-hidden flex-shrink-0">
                    {p.images?.[0] || p.image ? (
                      <img src={p.images?.[0] || p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 11 }}>
                      <span className="font-mono">{uid}</span>
                      <span>· Stock {p.stockQty} {p.unit}</span>
                    </div>
                  </div>
                  {checked && (
                    <div className="flex items-center bg-[#F3F4F6] rounded-lg flex-shrink-0">
                      <button onClick={() => setQty(p.id, qty - 1)} className="p-1.5 hover:bg-[#E5E7EB] rounded-l-lg">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(p.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-12 text-center bg-transparent" style={{ fontSize: 12, fontWeight: 700 }}
                      />
                      <button onClick={() => setQty(p.id, qty + 1)} className="p-1.5 hover:bg-[#E5E7EB] rounded-r-lg">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => downloadOne(p)}
                    className="p-2 rounded-lg border border-border hover:bg-muted flex-shrink-0"
                    title="Télécharger ce QR en PNG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {/* Canvas masqué pour le téléchargement PNG */}
                  <QRCodeCanvas
                    id={`qr-dl-${p.id}`}
                    value={productScanUrl(uid)}
                    size={512}
                    level="H"
                    includeMargin
                    className="hidden"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aperçu / planche d'impression */}
      {totalLabels > 0 && (
        <div className="bg-white rounded-2xl border border-border p-4 print:p-0 print:border-0 print:rounded-none">
          <div className="flex items-center justify-between mb-3 print:hidden">
            <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
              Aperçu d'impression
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>
              Format {preset.widthMm}×{preset.heightMm} mm · {preset.perRow} colonnes
            </div>
          </div>
          <div
            className="print-sheet"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${preset.perRow}, ${preset.widthMm}mm)`,
              gap: "2mm",
              justifyContent: "center",
            }}
          >
            {labelRows.map(({ product, index }, k) => (
              <Label
                key={`${product.id}-${index}-${k}`}
                product={product}
                shopName={shopName}
                preset={preset}
                showPrice={showPrice}
                showShop={showShop}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Label({
  product, shopName, preset, showPrice, showShop,
}: {
  product: MyProduct;
  shopName: string;
  preset: typeof LABEL_PRESETS[LabelSize];
  showPrice: boolean;
  showShop: boolean;
}) {
  const uid = productUid({ id: product.id, reference: product.reference });
  const url = productScanUrl(uid);
  return (
    <div
      className="label-cell"
      style={{
        width: `${preset.widthMm}mm`,
        height: `${preset.heightMm}mm`,
        border: "1px dashed #D1D5DB",
        borderRadius: "1.5mm",
        padding: "1.5mm",
        display: "flex",
        gap: "1.5mm",
        alignItems: "center",
        background: "white",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <QRCodeSVG value={url} size={preset.qrPx} level="H" includeMargin={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
        {showShop && shopName && (
          <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: preset.widthMm <= 40 ? 6 : 7, color: "#E11D2E", letterSpacing: ".05em", textTransform: "uppercase", lineHeight: 1.1 }}>
            {shopName}
          </div>
        )}
        <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: preset.widthMm <= 40 ? 7 : preset.widthMm <= 60 ? 8 : 10, lineHeight: 1.15, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
          {product.name}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: preset.widthMm <= 40 ? 5 : 6, color: "#6B7280", letterSpacing: ".02em" }}>
          {uid}
        </div>
        {showPrice && (
          <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: preset.widthMm <= 40 ? 7 : preset.widthMm <= 60 ? 9 : 11, color: "#1A1A2E" }}>
            {formatPrice(product.price)} <span style={{ fontWeight: 500, fontSize: "0.7em", color: "#6B7280" }}>FCFA</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PrintStyles({ preset }: { preset: typeof LABEL_PRESETS[LabelSize] }) {
  return (
    <style>{`
      @media print {
        @page { size: A4; margin: 8mm; }
        body { background: white !important; }
        nav, header, footer, .print\\:hidden { display: none !important; }
        .print-sheet { gap: 1.5mm !important; justify-content: flex-start !important; }
        .label-cell { border-style: dotted !important; page-break-inside: avoid; }
      }
    `}</style>
  );
}

export default MyProductLabelsPage;
