import { useRef, useState } from "react";
import { Plus, Trash2, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "./ImagePicker";
import { useMedia, deleteMedia, renameMedia } from "./media";
import {
  upsertBanner, deleteBanner, upsertFaq, deleteFaq, reorderNav,
  type Banner, type FaqItem, type NavItem, type FooterColumn, type Testimonial,
  type ContentState,
} from "./content";
import { Field, Card, inputClass, inputStyle } from "./content-shared";

export function BannersEditor({ banners, onChange }: { banners: Banner[]; onChange: (b: Banner[]) => void }) {
  const add = () => {
    const b: Banner = { id: `b${Date.now()}`, title: "Nouvelle bannière", subtitle: "", ctaLabel: "En savoir plus", ctaUrl: "/", bgColor: "#E11D2E", active: true };
    onChange([...banners, b]);
    upsertBanner(b);
  };
  const update = (id: string, patch: Partial<Banner>) => {
    const next = banners.map((b) => (b.id === id ? { ...b, ...patch } : b));
    onChange(next);
    const updated = next.find((b) => b.id === id);
    if (updated) upsertBanner(updated);
  };
  const remove = (id: string) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    onChange(banners.filter((b) => b.id !== id));
    deleteBanner(id);
    toast.success("Bannière supprimée");
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Bannières promotionnelles</h3>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="space-y-3">
        {banners.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>Aucune bannière</p>}
        {banners.map((b) => (
          <div key={b.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg px-3 py-2 text-white" style={{ background: b.bgColor, fontSize: 12, fontWeight: 700 }}>
                {b.title || "Aperçu"} — {b.subtitle}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => update(b.id, { active: !b.active })}
                  className={`px-2 py-1 rounded-md ${b.active ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-muted text-muted-foreground"}`}
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  {b.active ? "Actif" : "Inactif"}
                </button>
                <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Titre"><input className={inputClass} style={inputStyle} value={b.title} onChange={(e) => update(b.id, { title: e.target.value })} /></Field>
              <Field label="Sous-titre"><input className={inputClass} style={inputStyle} value={b.subtitle} onChange={(e) => update(b.id, { subtitle: e.target.value })} /></Field>
              <Field label="Bouton"><input className={inputClass} style={inputStyle} value={b.ctaLabel} onChange={(e) => update(b.id, { ctaLabel: e.target.value })} /></Field>
              <Field label="URL"><input className={inputClass} style={inputStyle} value={b.ctaUrl} onChange={(e) => update(b.id, { ctaUrl: e.target.value })} /></Field>
              <Field label="Couleur de fond"><input type="color" className="w-full h-10 rounded-xl border border-border" value={b.bgColor} onChange={(e) => update(b.id, { bgColor: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <ImagePicker label="Visuel (optionnel)" aspectRatio="16/9" value={b.imageUrl || ""} onChange={(url) => update(b.id, { imageUrl: url })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NavigationEditor({ items, onChange }: { items: NavItem[]; onChange: (n: NavItem[]) => void }) {
  const add = () => {
    const n: NavItem = { id: `n${Date.now()}`, label: "Nouveau lien", url: "/", visible: true };
    const next = [...items, n];
    onChange(next);
  };
  const update = (id: string, patch: Partial<NavItem>) => {
    onChange(items.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };
  const remove = (id: string) => {
    if (!confirm("Supprimer ce lien ?")) return;
    onChange(items.filter((n) => n.id !== id));
  };
  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((n) => n.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
    reorderNav(next.map((n) => n.id));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Menu de navigation</h3>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>Aucun lien</p>}
        {items.map((n, i) => (
          <div key={n.id} className="rounded-xl border border-border p-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground w-6 text-center" style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            <input className={inputClass + " flex-1 min-w-[120px]"} style={inputStyle} placeholder="Libellé" value={n.label} onChange={(e) => update(n.id, { label: e.target.value })} />
            <input className={inputClass + " flex-1 min-w-[160px]"} style={inputStyle} placeholder="/url" value={n.url} onChange={(e) => update(n.id, { url: e.target.value })} />
            <button
              onClick={() => update(n.id, { visible: !n.visible })}
              className={`px-2 py-1 rounded-md ${n.visible ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-muted text-muted-foreground"}`}
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              {n.visible ? "Visible" : "Masqué"}
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => move(n.id, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" aria-label="Monter">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(n.id, 1)} disabled={i === items.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" aria-label="Descendre">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FooterEditor({
  footer,
  onChange,
}: {
  footer: ContentState["footer"];
  onChange: (f: ContentState["footer"]) => void;
}) {
  const addColumn = () => {
    const col: FooterColumn = { id: `fc${Date.now()}`, title: "Nouvelle colonne", links: [] };
    onChange({ ...footer, columns: [...footer.columns, col] });
  };
  const updateColumn = (id: string, patch: Partial<FooterColumn>) => {
    onChange({ ...footer, columns: footer.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };
  const removeColumn = (id: string) => {
    if (!confirm("Supprimer cette colonne ?")) return;
    onChange({ ...footer, columns: footer.columns.filter((c) => c.id !== id) });
  };
  const addLink = (colId: string) => {
    updateColumn(colId, {
      links: [
        ...(footer.columns.find((c) => c.id === colId)?.links ?? []),
        { id: `fl${Date.now()}`, label: "Nouveau lien", url: "/" },
      ],
    });
  };
  const updateLink = (colId: string, linkId: string, patch: Partial<FooterColumn["links"][number]>) => {
    const col = footer.columns.find((c) => c.id === colId);
    if (!col) return;
    updateColumn(colId, { links: col.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)) });
  };
  const removeLink = (colId: string, linkId: string) => {
    const col = footer.columns.find((c) => c.id === colId);
    if (!col) return;
    updateColumn(colId, { links: col.links.filter((l) => l.id !== linkId) });
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Pied de page</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Copyright"><input className={inputClass} style={inputStyle} value={footer.copyright} onChange={(e) => onChange({ ...footer, copyright: e.target.value })} /></Field>
          <Field label="Titre newsletter"><input className={inputClass} style={inputStyle} value={footer.newsletterTitle} onChange={(e) => onChange({ ...footer, newsletterTitle: e.target.value })} /></Field>
          <Field label="Libellé bouton newsletter"><input className={inputClass} style={inputStyle} value={footer.newsletterCta} onChange={(e) => onChange({ ...footer, newsletterCta: e.target.value })} /></Field>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Colonnes de liens</h3>
          <button onClick={addColumn} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Colonne
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {footer.columns.map((col) => (
            <div key={col.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <input className={inputClass + " flex-1"} style={inputStyle} value={col.title} onChange={(e) => updateColumn(col.id, { title: e.target.value })} />
                <button onClick={() => removeColumn(col.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer la colonne">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {col.links.map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <input className={inputClass + " flex-1"} style={inputStyle} placeholder="Libellé" value={l.label} onChange={(e) => updateLink(col.id, l.id, { label: e.target.value })} />
                    <input className={inputClass + " flex-1"} style={inputStyle} placeholder="/url" value={l.url} onChange={(e) => updateLink(col.id, l.id, { url: e.target.value })} />
                    <button onClick={() => removeLink(col.id, l.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer le lien">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addLink(col.id)} className="w-full py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted" style={{ fontSize: 12 }}>
                  + Ajouter un lien
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function TestimonialsEditor({ items, onChange }: { items: Testimonial[]; onChange: (t: Testimonial[]) => void }) {
  const add = () => {
    const t: Testimonial = { id: `t${Date.now()}`, author: "Nouveau client", role: "", quote: "", rating: 5, avatarUrl: "", active: true };
    onChange([...items, t]);
  };
  const update = (id: string, patch: Partial<Testimonial>) => {
    onChange(items.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const remove = (id: string) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    onChange(items.filter((t) => t.id !== id));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Témoignages clients</h3>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>Aucun témoignage</p>}
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => update(t.id, { active: !t.active })}
                className={`px-2 py-1 rounded-md ${t.active ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-muted text-muted-foreground"}`}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                {t.active ? "Visible" : "Masqué"}
              </button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Auteur"><input className={inputClass} style={inputStyle} value={t.author} onChange={(e) => update(t.id, { author: e.target.value })} /></Field>
              <Field label="Rôle / Ville"><input className={inputClass} style={inputStyle} value={t.role} onChange={(e) => update(t.id, { role: e.target.value })} /></Field>
              <ImagePicker label="Avatar" aspectRatio="1/1" value={t.avatarUrl} onChange={(url) => update(t.id, { avatarUrl: url })} />
              <Field label="Note (1-5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={inputClass}
                  style={inputStyle}
                  value={t.rating}
                  onChange={(e) => update(t.id, { rating: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Témoignage"><textarea rows={3} className={inputClass} style={inputStyle} value={t.quote} onChange={(e) => update(t.id, { quote: e.target.value })} /></Field>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FaqEditor({ faq, onChange }: { faq: FaqItem[]; onChange: (f: FaqItem[]) => void }) {
  const add = () => {
    const f: FaqItem = { id: `f${Date.now()}`, question: "Nouvelle question", answer: "" };
    onChange([...faq, f]);
    upsertFaq(f);
  };
  const update = (id: string, patch: Partial<FaqItem>) => {
    const next = faq.map((f) => (f.id === id ? { ...f, ...patch } : f));
    onChange(next);
    const updated = next.find((f) => f.id === id);
    if (updated) upsertFaq(updated);
  };
  const remove = (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    onChange(faq.filter((f) => f.id !== id));
    deleteFaq(id);
    toast.success("Question supprimée");
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Questions fréquentes</h3>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700 }}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="space-y-3">
        {faq.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>Aucune question</p>}
        {faq.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>Q{i + 1}</span>
              <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg hover:bg-muted text-[#E11D2E]" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <Field label="Question"><input className={inputClass} style={inputStyle} value={f.question} onChange={(e) => update(f.id, { question: e.target.value })} /></Field>
              <Field label="Réponse"><textarea rows={3} className={inputClass} style={inputStyle} value={f.answer} onChange={(e) => update(f.id, { answer: e.target.value })} /></Field>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MediaLibrary() {
  const media = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const { uploadMedia } = await import("./media");
    let ok = 0, fail = 0;
    for (const f of Array.from(files)) {
      const res = await uploadMedia(f);
      if (res.ok) ok++; else fail++;
    }
    setBusy(false);
    if (ok) toast.success(`${ok} image(s) téléversée(s)`);
    if (fail) toast.error(`${fail} échec(s)`);
  };

  const filtered = media.filter((a) => !filter.trim() || a.name.toLowerCase().includes(filter.toLowerCase()) || a.tags.join(",").toLowerCase().includes(filter.toLowerCase()));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Médiathèque</h3>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{media.length} image(s) · Stockage local navigateur (max 1,5 Mo par fichier)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom ou tag"
            className="px-3 py-2 rounded-xl bg-white border border-border outline-none"
            style={{ fontSize: 12, minWidth: 200 }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E11D2E] text-white disabled:opacity-50"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            <Upload className="w-4 h-4" /> {busy ? "Téléversement…" : "Téléverser"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      </div>

      <div
        className="rounded-xl border-2 border-dashed border-border p-4 mb-4 text-center text-muted-foreground"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        style={{ fontSize: 12 }}
      >
        Glisser-déposer des images ici, ou cliquer sur « Téléverser »
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10" style={{ fontSize: 13 }}>
          {media.length === 0 ? "Médiathèque vide" : "Aucun résultat"}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="group rounded-xl border border-border overflow-hidden bg-white">
              <div className="aspect-square bg-[#F3F4F6]">
                <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2 space-y-1.5">
                <input
                  value={a.name}
                  onChange={(e) => renameMedia(a.id, e.target.value)}
                  className="w-full px-2 py-1 rounded-md border border-transparent hover:border-border focus:border-[#E11D2E] outline-none"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
                <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: 10 }}>
                  <span>{a.width || "?"}×{a.height || "?"}</span>
                  <span>{a.size ? `${Math.round(a.size / 1024)} Ko` : "lien"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(a.url); toast.success("URL copiée"); }}
                    className="flex-1 px-2 py-1 rounded-md border border-border hover:bg-muted"
                    style={{ fontSize: 11 }}
                  >
                    Copier URL
                  </button>
                  <button
                    onClick={() => { if (confirm("Supprimer cette image ?")) { deleteMedia(a.id); toast.success("Image supprimée"); } }}
                    className="p-1 rounded-md hover:bg-muted text-[#E11D2E]"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
