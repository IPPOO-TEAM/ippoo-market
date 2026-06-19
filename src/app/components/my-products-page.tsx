/* ═══════════════════════════════════════════
   IPPOO — Gestion des produits (vendeur)
   Liste, recherche, statut, CRUD complet via
   un store local. Accessible aux vendeurs depuis
   le dashboard `/boutique`.
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, Plus, Search, Edit2, Trash2, Package, X, ImagePlus, Eye, EyeOff, AlertCircle,
  Upload, Download, Video, Sparkles, ExternalLink, QrCode,
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
  hydrateMyProducts,
  subscribe as subscribeProducts,
  getMyProductsSnapshot,
  SERVER_SNAPSHOT as PRODUCTS_SNAPSHOT,
  listMyProducts,
  getMyProduct,
  addMyProduct,
  updateMyProduct,
  deleteMyProduct,
  type MyProduct,
  type MyProductStatus,
} from "../data/my-products";
import { formatPrice } from "./mock-data";
import { AnimatedNumber } from "./animated-number";
import { ProductEditor } from "./my-products/product-editor";

const STATUS_LABELS: Record<MyProductStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  out_of_stock: "Rupture",
};
const STATUS_COLORS: Record<MyProductStatus, string> = {
  draft: "#9CA3AF",
  published: "#16A34A",
  out_of_stock: "#F59E0B",
};

export function MyProductsPage() {
  const profile = useSyncExternalStore(subscribeProfile, getUserProfile, () => PROFILE_SNAPSHOT);
  useEffect(() => { hydrateMyProducts(); hydrateMyShops(); }, []);
  useSyncExternalStore(subscribeProducts, getMyProductsSnapshot, () => PRODUCTS_SNAPSHOT);
  useSyncExternalStore(subscribeShops, getMyShopsSnapshot, () => SHOPS_SNAPSHOT);

  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MyProductStatus | "all">("all");
  const [editing, setEditing] = useState<MyProduct | "new" | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  useEffect(() => {
    const editId = sp.get("edit");
    const newFlag = sp.get("new");
    if (editId) {
      const p = getMyProduct(editId);
      if (p) setEditing(p);
      const next = new URLSearchParams(sp); next.delete("edit"); setSp(next, { replace: true });
    } else if (newFlag) {
      setEditing("new");
      const next = new URLSearchParams(sp); next.delete("new"); setSp(next, { replace: true });
    }
  }, [sp, setSp]);

  const allShops = useMemo(() => listAllShops(profile?.businessName), [profile?.businessName]);
  const slug = getActiveShopSlug(profile?.businessName);
  const activeShop = allShops.find((s) => s.slug === slug);
  const activeShopName = activeShop?.name ?? profile?.businessName ?? "";

  if (!isSeller(profile) || !slug) {
    return <Navigate to="/boutique" replace />;
  }

  const products = listMyProducts(slug);
  const filtered = products.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: products.length,
    published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length,
    out_of_stock: products.filter((p) => p.status === "out_of_stock").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 pb-32 lg:pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/boutique")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
            Mes produits
          </h1>
          {allShops.length > 1 && (
            <div className="truncate text-muted-foreground" style={{ fontSize: 11 }}>
              Boutique : {activeShopName}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate("/boutique/produits/etiquettes")}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white hover:bg-muted"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
          title="Étiquettes QR à imprimer"
        >
          <QrCode className="w-4 h-4" />
          QR
        </button>
        <button
          onClick={() => setCsvOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white hover:bg-muted"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
          title="Import / Export CSV"
        >
          <Upload className="w-4 h-4" />
          CSV
        </button>
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
          Ajouter
        </button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto mb-3 -mx-1 px-1">
        {(["all", "published", "draft", "out_of_stock"] as const).map((s) => {
          const active = statusFilter === s;
          const count = counts[s];
          const label = s === "all" ? "Tous" : STATUS_LABELS[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition ${active ? "border-[#E11D2E] bg-[#FEF2F2]" : "border-border bg-white hover:bg-muted/40"}`}
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: active ? "#E11D2E" : "#374151" }}
            >
              {label} <span className="opacity-60">(<AnimatedNumber value={count} />)</span>
            </button>
          );
        })}
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-white"
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15 }}>
            {products.length === 0 ? "Aucun produit pour le moment" : "Aucun résultat"}
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            {products.length === 0
              ? "Ajoutez votre premier produit pour commencer à vendre."
              : "Essayez d'ajuster vos filtres."}
          </p>
          {products.length === 0 && (
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
              Ajouter mon premier produit
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onEdit={() => setEditing(p)}
              onDelete={() => {
                if (confirm(`Supprimer "${p.name}" ?`)) {
                  deleteMyProduct(p.id);
                  toast.success("Produit supprimé");
                }
              }}
              onToggleStatus={() => {
                const next: MyProductStatus = p.status === "published" ? "draft" : "published";
                updateMyProduct(p.id, { status: next });
                toast.success(next === "published" ? "Produit publié" : "Produit dépublié");
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <ProductEditor
          shopSlug={slug}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {csvOpen && (
        <CsvDialog
          shopSlug={slug}
          products={products}
          onClose={() => setCsvOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── CSV Import / Export ─── */

function escapeCsvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === "," || c === ";") { cur.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function CsvDialog({
  shopSlug, products, onClose,
}: { shopSlug: string; products: MyProduct[]; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  const headers = ["name", "price", "moq", "unit", "stockQty", "category", "description", "status"];

  const handleExport = () => {
    const lines = [headers.join(",")];
    for (const p of products) {
      lines.push(headers.map((h) => escapeCsvCell((p as unknown as Record<string, unknown>)[h] ?? "")).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produits-${shopSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${products.length} produit(s) exporté(s)`);
  };

  const handleTemplate = () => {
    const sample = [
      headers.join(","),
      `Tomate fraîche,500,10,kg,200,Alimentation,Tomate locale de saison,published`,
      `Savon artisanal,1500,5,pièce,80,Hygiène,Savon au karité,draft`,
    ].join("\n");
    const blob = new Blob(["﻿" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-produits.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setImported(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("Fichier vide ou sans données");
      const head = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (k: string) => head.indexOf(k);
      const iName = idx("name") >= 0 ? idx("name") : idx("nom");
      const iPrice = idx("price") >= 0 ? idx("price") : idx("prix");
      const iMoq = idx("moq");
      const iUnit = idx("unit") >= 0 ? idx("unit") : idx("unité");
      const iStock = idx("stockqty") >= 0 ? idx("stockqty") : idx("stock");
      const iCat = idx("category") >= 0 ? idx("category") : idx("catégorie");
      const iDesc = idx("description");
      const iStatus = idx("status") >= 0 ? idx("status") : idx("statut");

      if (iName < 0 || iPrice < 0) throw new Error("Colonnes obligatoires manquantes : name, price");

      let count = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const name = (row[iName] ?? "").trim();
        if (!name) continue;
        const price = parseFloat((row[iPrice] ?? "0").replace(/\s/g, "").replace(",", "."));
        if (isNaN(price)) continue;
        const moq = iMoq >= 0 ? parseInt((row[iMoq] ?? "1").trim(), 10) || 1 : 1;
        const unit = iUnit >= 0 ? (row[iUnit] ?? "pièce").trim() || "pièce" : "pièce";
        const stockQty = iStock >= 0 ? parseInt((row[iStock] ?? "0").trim(), 10) || 0 : 0;
        const category = iCat >= 0 ? (row[iCat] ?? "").trim() || undefined : undefined;
        const description = iDesc >= 0 ? (row[iDesc] ?? "").trim() || undefined : undefined;
        const rawStatus = iStatus >= 0 ? (row[iStatus] ?? "").trim().toLowerCase() : "draft";
        const status: MyProductStatus =
          rawStatus === "published" || rawStatus === "publié" ? "published" :
          rawStatus === "out_of_stock" || rawStatus === "rupture" ? "out_of_stock" :
          "draft";
        addMyProduct({ shopSlug, name, price, moq, unit, stockQty, category, description, status });
        count++;
      }
      setImported(count);
      toast.success(`${count} produit(s) importé(s)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'import");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Import / Export CSV</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
              <Download className="w-4 h-4" />
              Exporter mes produits
            </div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>
              Téléchargez tous vos {products.length} produit(s) au format CSV (compatible Excel).
            </p>
            <button
              onClick={handleExport}
              disabled={products.length === 0}
              className="px-3 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Télécharger le CSV
            </button>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
              <Upload className="w-4 h-4" />
              Importer depuis un CSV
            </div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>
              Colonnes : <code>name, price, moq, unit, stockQty, category, description, status</code>.
              <br/>Seuls <strong>name</strong> et <strong>price</strong> sont obligatoires.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={handleTemplate}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                Modèle CSV
              </button>
              <label className="px-3 py-1.5 rounded-lg text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)", fontSize: 12, fontWeight: 700 }}>
                Choisir un fichier
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {error && (
              <div className="flex items-start gap-1.5 text-[#E11D2E]" style={{ fontSize: 12 }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {imported != null && !error && (
              <div className="text-[#16A34A]" style={{ fontSize: 12 }}>
                ✓ {imported} produit(s) importé(s) avec succès.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product, onEdit, onDelete, onToggleStatus,
}: {
  product: MyProduct;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const tone = STATUS_COLORS[product.status];
  const cover = product.images?.[0] ?? product.image;
  const mediaCount = (product.images?.length ?? 0) + (product.videos?.length ?? 0);
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all">
      <Link to={`/boutique/produits/${product.id}`} className="aspect-[4/3] bg-[#F3F4F6] relative block group">
        {cover ? (
          <img src={cover} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white shadow-sm"
          style={{ background: tone, fontSize: 10, fontWeight: 700 }}
        >
          {STATUS_LABELS[product.status]}
        </span>
        {mediaCount > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white" style={{ fontSize: 10, fontWeight: 600 }}>
            <ImagePlus className="w-3 h-3" /> {product.images?.length ?? 0}
            {(product.videos?.length ?? 0) > 0 && <><Video className="w-3 h-3 ml-1" /> {product.videos?.length ?? 0}</>}
          </span>
        )}
        {product.paliers && product.paliers.length > 0 && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white shadow-sm" style={{ background: "linear-gradient(135deg,#E11D2E 0%,#F97316 100%)", fontSize: 10, fontWeight: 700 }}>
            <Sparkles className="w-3 h-3" /> Dégressif
          </span>
        )}
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/boutique/produits/${product.id}`} className="truncate hover:text-[#E11D2E]" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>{product.name}</Link>
        {product.brand && (
          <div className="truncate text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".02em" }}>{product.brand.toUpperCase()}</div>
        )}
        <div className="text-muted-foreground mb-2" style={{ fontSize: 11 }}>
          MOQ {product.moq} {product.unit} · Stock {product.stockQty}
        </div>
        <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#E11D2E" }}>
          {formatPrice(product.price)} FCFA
          <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 500 }}> / {product.unit}</span>
        </div>
        {product.stockQty <= 0 && product.status !== "out_of_stock" && (
          <div className="flex items-center gap-1 mt-1 text-[#F59E0B]" style={{ fontSize: 10 }}>
            <AlertCircle className="w-3 h-3" />
            Stock épuisé
          </div>
        )}
        <div className="flex gap-1 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:bg-muted"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={onToggleStatus}
            className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-border hover:bg-muted"
            title={product.status === "published" ? "Dépublier" : "Publier"}
          >
            {product.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-border hover:bg-[#FEF2F2] hover:border-[#E11D2E] hover:text-[#E11D2E]"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


export default MyProductsPage;
