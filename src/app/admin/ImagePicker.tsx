import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, X, ImagePlus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, uploadFromUrl, useMedia } from "./media";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: string;
  hint?: string;
};

export function ImagePicker({ value, onChange, label, aspectRatio = "16/9", hint }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const media = useMedia();

  const handleFile = async (file: File) => {
    setBusy(true);
    const res = await uploadMedia(file);
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    onChange(res.asset.url);
    toast.success("Image téléversée");
  };

  const handleUrl = async () => {
    const url = window.prompt("Coller l'URL de l'image (https:// ou data:)");
    if (!url) return;
    setBusy(true);
    const res = await uploadFromUrl(url.trim());
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    onChange(res.asset.url);
    toast.success("Image liée");
  };

  return (
    <div>
      {label && <p className="mb-1" style={{ fontSize: 12, fontWeight: 600 }}>{label}</p>}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="relative shrink-0 rounded-xl bg-[#F3F4F6] border-2 border-dashed border-border overflow-hidden flex items-center justify-center"
          style={{ width: 160, aspectRatio }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Retirer l'image"
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="text-center text-muted-foreground p-2">
              <ImagePlus className="w-6 h-6 mx-auto mb-1" />
              <p style={{ fontSize: 10 }}>Glisser-déposer<br />ou choisir</p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F172A] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              <Upload className="w-3.5 h-3.5" /> Téléverser
            </button>
            <button
              type="button"
              onClick={handleUrl}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              <LinkIcon className="w-3.5 h-3.5" /> URL
            </button>
            <button
              type="button"
              onClick={() => setLibOpen(true)}
              disabled={media.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Médiathèque ({media.length})
            </button>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de l'image (https:// ou data:image/…)"
            className="w-full px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
            style={{ fontSize: 12 }}
          />
          {hint && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{hint}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {libOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLibOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>Médiathèque</p>
              <button onClick={() => setLibOpen(false)} className="p-1.5 hover:bg-muted rounded-lg" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {media.length === 0 ? (
                <p className="text-center text-muted-foreground py-12" style={{ fontSize: 13 }}>Aucune image téléversée</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {media.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { onChange(a.url); setLibOpen(false); toast.success("Image sélectionnée"); }}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-[#E11D2E]"
                    >
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-white text-left truncate" style={{ fontSize: 10 }}>
                        {a.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
