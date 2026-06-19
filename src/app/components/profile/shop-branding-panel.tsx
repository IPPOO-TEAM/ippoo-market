import { logger } from "../../lib/logger";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Camera, Store as StoreIcon, Trash2, Upload } from "lucide-react";
import { fileToCompressedDataUrl, uploadShopAsset, deleteShopAsset, refreshShopAssets, getShopAssets, slugifyShopName } from "../../data/shop-assets";

export function ShopBrandingPanel({ shopName }: { shopName: string }) {
  const slug = shopName.trim() ? slugifyShopName(shopName) : "";
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => { if (slug) refreshShopAssets(slug); }, [slug]);

  const assetsJson = useSyncExternalStore(
    (cb) => { window.addEventListener("ippoo:shop-assets", cb); return () => window.removeEventListener("ippoo:shop-assets", cb); },
    () => slug ? JSON.stringify(getShopAssets(slug)) : "{}",
    () => "{}",
  );
  const { logo, banner } = JSON.parse(assetsJson) as { logo?: string; banner?: string };

  async function handle(kind: "logo" | "banner", file: File | null | undefined) {
    if (!file) return;
    if (!slug) { toast.error("Renseignez d'abord la raison sociale dans Mon activité"); return; }
    if (!/^image\//.test(file.type)) { toast.error("Choisissez une image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image trop lourde (max 8 Mo)"); return; }
    try {
      setUploading(kind);
      const dataUrl = await fileToCompressedDataUrl(file, kind === "banner" ? 1600 : 512);
      await uploadShopAsset(slug, kind, dataUrl);
      toast.success(kind === "logo" ? "Logo synchronisé ☁️" : "Bannière synchronisée ☁️");
    } catch (e) {
      logger.warn(`Profile branding upload error (${kind}): ${e}`);
      toast.error(`Erreur d'envoi : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally { setUploading(null); }
  }

  async function remove(kind: "logo" | "banner") {
    if (!slug) return;
    try { await deleteShopAsset(slug, kind); toast.success("Image supprimée"); }
    catch (e) { toast.error(`Suppression échouée : ${e instanceof Error ? e.message : "inconnue"}`); }
  }

  if (!slug) {
    return (
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>
        Renseignez la raison sociale dans <strong>Mon activité</strong> pour personnaliser votre boutique.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-border">
        <div className="relative h-28 bg-gradient-to-br from-[#E8A817] to-[#F97316]">
          {banner && <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button type="button" disabled={uploading === "banner"} onClick={() => bannerInput.current?.click()} className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur flex items-center gap-1.5 disabled:opacity-60" style={{ fontSize: 11, fontWeight: 700 }}>
            <Camera className="w-3.5 h-3.5" /> {uploading === "banner" ? "Envoi…" : banner ? "Changer" : "Bannière"}
          </button>
          {banner && (
            <button type="button" onClick={() => remove("banner")} className="absolute top-2 right-[112px] p-1.5 rounded-lg bg-white/90 hover:bg-white" aria-label="Supprimer la bannière">
              <Trash2 className="w-3.5 h-3.5 text-[#E11D2E]" />
            </button>
          )}
        </div>
        <div className="relative px-3 pb-3 -mt-8">
          <button type="button" disabled={uploading === "logo"} onClick={() => logoInput.current?.click()} className="relative w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center disabled:opacity-60" style={{ background: "linear-gradient(135deg,#E8A817,#F97316)" }}>
            {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <StoreIcon className="w-6 h-6 text-white" />}
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center border-2 border-white">
              <Camera className="w-2.5 h-2.5" />
            </span>
          </button>
          <p className="mt-2" style={{ fontSize: 13, fontWeight: 800, fontFamily: "Poppins" }}>{shopName}</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            Synchronisé sur tous vos appareils via Supabase
          </p>
        </div>
      </div>

      <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => handle("logo", e.target.files?.[0])} />
      <input ref={bannerInput} type="file" accept="image/*" hidden onChange={(e) => handle("banner", e.target.files?.[0])} />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={uploading === "logo"} onClick={() => logoInput.current?.click()} className="py-2.5 rounded-xl border border-border flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ fontSize: 12, fontWeight: 700 }}>
          <Upload className="w-3.5 h-3.5" /> {uploading === "logo" ? "Envoi…" : logo ? "Changer logo" : "Téléverser logo"}
        </button>
        <button type="button" disabled={uploading === "banner"} onClick={() => bannerInput.current?.click()} className="py-2.5 rounded-xl border border-border flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ fontSize: 12, fontWeight: 700 }}>
          <Upload className="w-3.5 h-3.5" /> {uploading === "banner" ? "Envoi…" : banner ? "Changer bannière" : "Téléverser bannière"}
        </button>
      </div>
      {logo && (
        <button type="button" onClick={() => remove("logo")} className="w-full py-2 rounded-xl border border-border text-[#E11D2E] flex items-center justify-center gap-1.5" style={{ fontSize: 11, fontWeight: 600 }}>
          <Trash2 className="w-3.5 h-3.5" /> Retirer le logo
        </button>
      )}
    </div>
  );
}
