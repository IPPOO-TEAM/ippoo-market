import { useState } from "react";
import { toast } from "sonner";
import { X, ImagePlus, Star, GripVertical, Trash, Video, Sparkles, Plus } from "lucide-react";
import {
  addMyProduct,
  updateMyProduct,
  type MyProduct,
  type MyProductStatus,
  type PriceTier,
} from "../../data/my-products";

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

const DESCRIPTION_TEMPLATES: { label: string; body: string }[] = [
  {
    label: "Produit alimentaire",
    body:
      "Origine : \nIngrédients : \nConditionnement : \nConservation : \nDLC / DLUO : \nCertifications : ",
  },
  {
    label: "Produit cosmétique",
    body:
      "Indications : \nIngrédients clés : \nMode d'emploi : \nVolume : \nCertifications : ",
  },
  {
    label: "Produit textile",
    body:
      "Composition : \nTaille / dimensions : \nCouleurs disponibles : \nEntretien : \nOrigine : ",
  },
  {
    label: "Produit électronique / industriel",
    body:
      "Caractéristiques techniques : \nGarantie : \nTension / puissance : \nAccessoires inclus : \nNorme : ",
  },
];

export function ProductEditor({
  shopSlug, product, onClose,
}: {
  shopSlug: string;
  product: MyProduct | null;
  onClose: () => void;
}) {
  const initialImages = product?.images?.length
    ? product.images
    : (product?.image ? [product.image] : []);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [highlights, setHighlights] = useState<string>((product?.highlights ?? []).join("\n"));
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [moq, setMoq] = useState(String(product?.moq ?? "1"));
  const [unit, setUnit] = useState(product?.unit ?? "unité");
  const [stockQty, setStockQty] = useState(String(product?.stockQty ?? "0"));
  const [category, setCategory] = useState(product?.category ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [reference, setReference] = useState(product?.reference ?? "");
  const [origin, setOrigin] = useState(product?.origin ?? "");
  const [weightKg, setWeightKg] = useState(product?.weightKg ? String(product.weightKg) : "");
  const [images, setImages] = useState<string[]>(initialImages);
  const [videos, setVideos] = useState<string[]>(product?.videos ?? []);
  const [paliers, setPaliers] = useState<PriceTier[]>(product?.paliers ?? []);
  const [status, setStatus] = useState<MyProductStatus>(product?.status ?? "draft");
  const [section, setSection] = useState<"media" | "infos" | "prix" | "logistique">("media");

  const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const onImages = async (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} trop lourde (max 4 Mo)`); continue; }
      try { next.push(await readAsDataUrl(f)); } catch { /* ignore */ }
    }
    if (next.length) {
      setImages((arr) => [...arr, ...next].slice(0, 10));
      toast.success(`${next.length} image(s) ajoutée(s)`);
    }
  };

  const onVideos = async (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("video/")) continue;
      if (f.size > 15 * 1024 * 1024) { toast.error(`${f.name} trop lourde (max 15 Mo)`); continue; }
      try { next.push(await readAsDataUrl(f)); } catch { /* ignore */ }
    }
    if (next.length) {
      setVideos((arr) => [...arr, ...next].slice(0, 3));
      toast.success(`${next.length} vidéo(s) ajoutée(s)`);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    setImages((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const cp = arr.slice();
      [cp[i], cp[j]] = [cp[j], cp[i]];
      return cp;
    });
  };
  const makeCover = (i: number) => {
    if (i === 0) return;
    setImages((arr) => [arr[i], ...arr.filter((_, k) => k !== i)]);
  };
  const removeImage = (i: number) => setImages((arr) => arr.filter((_, k) => k !== i));
  const removeVideo = (i: number) => setVideos((arr) => arr.filter((_, k) => k !== i));

  const addTier = () => setPaliers((arr) => [...arr, { qty: 0, price: 0 }]);
  const removeTier = (i: number) => setPaliers((arr) => arr.filter((_, k) => k !== i));
  const updateTier = (i: number, patch: Partial<PriceTier>) =>
    setPaliers((arr) => arr.map((t, k) => k === i ? { ...t, ...patch } : t));

  const applyTemplate = (tpl: { body: string }) => {
    setDescription((d) => d.trim() ? `${d}\n\n${tpl.body}` : tpl.body);
    toast.info("Modèle inséré");
  };

  const submit = () => {
    if (!name.trim()) { toast.error("Nom requis"); setSection("infos"); return; }
    const p = Number(price);
    if (!p || p <= 0) { toast.error("Prix invalide"); setSection("prix"); return; }
    const cleanedTiers = paliers
      .filter((t) => t.qty > 0 && t.price > 0)
      .sort((a, b) => a.qty - b.qty);
    const cleanedHighlights = highlights.split("\n").map((s) => s.trim()).filter(Boolean);
    const w = weightKg ? Number(weightKg.replace(",", ".")) : undefined;
    const payload = {
      shopSlug,
      name: name.trim(),
      description: description.trim() || undefined,
      highlights: cleanedHighlights.length ? cleanedHighlights : undefined,
      price: p,
      paliers: cleanedTiers.length ? cleanedTiers : undefined,
      moq: Math.max(1, Number(moq) || 1),
      unit: unit.trim() || "unité",
      stockQty: Math.max(0, Number(stockQty) || 0),
      category: category.trim() || undefined,
      brand: brand.trim() || undefined,
      reference: reference.trim() || undefined,
      origin: origin.trim() || undefined,
      weightKg: w && !isNaN(w) && w > 0 ? w : undefined,
      images,
      videos,
      image: images[0],
      status,
    };
    if (product) {
      updateMyProduct(product.id, payload);
      toast.success("Produit mis à jour");
    } else {
      addMyProduct(payload);
      toast.success("Produit ajouté");
    }
    onClose();
  };

  const sections: Array<{ key: typeof section; label: string }> = [
    { key: "media", label: "Médias" },
    { key: "infos", label: "Infos" },
    { key: "prix", label: "Prix & stock" },
    { key: "logistique", label: "Logistique" },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
          <h3 className="flex-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-2 pt-2 border-b border-border flex gap-1 overflow-x-auto">
          {sections.map((s) => {
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className="flex-shrink-0 px-3 py-2 rounded-t-xl transition"
                style={{
                  fontFamily: "Poppins", fontWeight: 600, fontSize: 12,
                  color: active ? "#E11D2E" : "#6B7280",
                  borderBottom: active ? "2px solid #E11D2E" : "2px solid transparent",
                  background: active ? "#FEF2F2" : "transparent",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {section === "media" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                    Photos du produit
                    <span className="ml-1.5 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
                      ({images.length}/10) · La 1ʳᵉ sert de visuel principal
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted cursor-pointer" style={{ fontSize: 11, fontWeight: 600 }}>
                    <ImagePlus className="w-3.5 h-3.5" />
                    Ajouter
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onImages(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
                {images.length === 0 ? (
                  <label className="block aspect-video rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6] flex items-center justify-center cursor-pointer hover:border-[#E11D2E] transition">
                    <div className="text-center text-muted-foreground p-4">
                      <ImagePlus className="w-10 h-10 mx-auto mb-2" />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Glissez vos photos ici</div>
                      <div style={{ fontSize: 11 }}>JPG / PNG, jusqu'à 4 Mo · 10 max</div>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onImages(e.target.files); e.target.value = ""; }} />
                  </label>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-[#F3F4F6]">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-white inline-flex items-center gap-0.5" style={{ background: "linear-gradient(135deg,#E11D2E 0%,#F97316 100%)", fontSize: 9, fontWeight: 700 }}>
                            <Star className="w-2.5 h-2.5 fill-current" /> Couverture
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          {i !== 0 && (
                            <button onClick={() => makeCover(i)} title="Définir comme couverture" className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center">
                              <Star className="w-3.5 h-3.5" style={{ color: "#F97316" }} />
                            </button>
                          )}
                          <button onClick={() => moveImage(i, -1)} title="Déplacer à gauche" disabled={i === 0} className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center disabled:opacity-40">
                            <GripVertical className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeImage(i)} title="Supprimer" className="w-7 h-7 rounded-full bg-white/90 hover:bg-[#FEF2F2] flex items-center justify-center text-[#E11D2E]">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
                    Vidéos de présentation
                    <span className="ml-1.5 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
                      ({videos.length}/3) · MP4 / WebM, max 15 Mo
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted cursor-pointer" style={{ fontSize: 11, fontWeight: 600 }}>
                    <Video className="w-3.5 h-3.5" />
                    Ajouter
                    <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => { onVideos(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
                {videos.length === 0 ? (
                  <div className="text-center py-6 rounded-2xl border border-dashed border-border text-muted-foreground" style={{ fontSize: 12 }}>
                    Aucune vidéo · Une démo vidéo augmente la conversion.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {videos.map((src, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
                        <video src={src} className="w-full h-full object-cover" controls />
                        <button onClick={() => removeVideo(i)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 hover:bg-[#FF6A00] text-white flex items-center justify-center">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {section === "infos" && (
            <>
              <Field label="Nom du produit *" value={name} onChange={setName} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Marque" value={brand} onChange={setBrand} placeholder="Optionnel" />
                <Field label="Référence / SKU" value={reference} onChange={setReference} placeholder="REF-001" />
              </div>
              <Field label="Catégorie" value={category} onChange={setCategory} placeholder="Alimentation, Beauté…" />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
                    Description détaillée
                  </div>
                  <div className="flex gap-1">
                    <select
                      onChange={(e) => {
                        const tpl = DESCRIPTION_TEMPLATES.find((t) => t.label === e.target.value);
                        if (tpl) applyTemplate(tpl);
                        e.target.value = "";
                      }}
                      className="px-2 py-1 rounded-lg border border-border bg-white"
                      style={{ fontSize: 11, fontFamily: "Poppins", fontWeight: 600, color: "#6B7280" }}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Modèle</option>
                      {DESCRIPTION_TEMPLATES.map((t) => (
                        <option key={t.label} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Décrivez votre produit, ses bénéfices, ses caractéristiques techniques, ses cas d'usage…"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-white resize-none"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {description.length} caractères · Une description de 150+ caractères améliore le référencement
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: description.length >= 150 ? "#16A34A" : "#9CA3AF" }}>
                    {description.length >= 150 ? "✓ Bon" : `${Math.max(0, 150 - description.length)} restant`}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>
                  Points-clés <span className="text-muted-foreground" style={{ fontWeight: 500 }}>(1 par ligne — apparaissent en bullets sur la fiche)</span>
                </div>
                <textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={4}
                  placeholder={"100% naturel\nLivraison sous 48h\nGarantie satisfait ou remboursé"}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-white resize-none"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                />
              </div>
            </>
          )}

          {section === "prix" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Prix de base (FCFA) *" value={price} onChange={setPrice} type="number" />
                <Field label="MOQ" value={moq} onChange={setMoq} type="number" />
                <Field label="Unité" value={unit} onChange={setUnit} placeholder="kg, pièce…" />
              </div>
              <Field label="Stock disponible" value={stockQty} onChange={setStockQty} type="number" />

              <div className="bg-gradient-to-br from-[#FEF2F2] to-[#FFF7ED] rounded-2xl border border-[#FECACA] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: "#E11D2E" }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Prix dégressifs (optionnel)
                    </div>
                    <div className="text-muted-foreground" style={{ fontSize: 11 }}>
                      Tarif spécial selon la quantité commandée
                    </div>
                  </div>
                  <button
                    onClick={addTier}
                    className="px-2.5 py-1.5 rounded-lg text-white inline-flex items-center gap-1"
                    style={{ background: "linear-gradient(135deg,#E11D2E 0%,#F97316 100%)", fontSize: 11, fontWeight: 700 }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Palier
                  </button>
                </div>
                {paliers.length === 0 ? (
                  <div className="text-muted-foreground text-center py-3" style={{ fontSize: 12 }}>
                    Aucun palier · Ajoutez-en pour récompenser les gros volumes.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {paliers.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-xl border border-border px-2 py-1.5">
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>À partir de</span>
                        <input
                          type="number" value={t.qty || ""} onChange={(e) => updateTier(i, { qty: Number(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 rounded-lg border border-border" style={{ fontSize: 12 }}
                        />
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{unit} →</span>
                        <input
                          type="number" value={t.price || ""} onChange={(e) => updateTier(i, { price: Number(e.target.value) || 0 })}
                          className="flex-1 px-2 py-1 rounded-lg border border-border" style={{ fontSize: 12 }}
                          placeholder="Prix unitaire"
                        />
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>FCFA</span>
                        <button onClick={() => removeTier(i)} className="p-1 text-muted-foreground hover:text-[#E11D2E]">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>Statut</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["draft", "published", "out_of_stock"] as MyProductStatus[]).map((s) => {
                    const active = status === s;
                    const color = STATUS_COLORS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className="px-2 py-2 rounded-xl border transition"
                        style={{
                          borderColor: active ? color : "#E5E7EB",
                          background: active ? `${color}15` : "white",
                          fontFamily: "Poppins", fontWeight: 600, fontSize: 11,
                          color: active ? color : "#374151",
                        }}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {section === "logistique" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Origine" value={origin} onChange={setOrigin} placeholder="Bénin, Import…" />
                <Field label="Poids unitaire (kg)" value={weightKg} onChange={setWeightKg} type="number" placeholder="0.5" />
              </div>
              <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-3 text-[#075985]" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Ces informations alimentent la fiche produit publique (poids, origine, conditionnement, calcul des frais de livraison).
              </div>
            </>
          )}
        </div>

        <div className="bg-white border-t border-border p-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted"
            style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}
          >
            Annuler
          </button>
          <button
            onClick={submit}
            className="flex-1 px-4 py-2.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #E11D2E 0%, #F97316 100%)",
              fontFamily: "Poppins", fontWeight: 700, fontSize: 13,
              boxShadow: "0 6px 14px rgba(232,32,42,.3)",
            }}
          >
            {product ? "Enregistrer" : "Publier le produit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", multiline = false, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-border bg-white resize-none"
          style={{ fontSize: 13 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-border bg-white"
          style={{ fontSize: 13 }}
        />
      )}
    </label>
  );
}
