import { useRef, useState } from "react";
import { Save, Plus, Trash2, RotateCcw, Eye, FileText, Megaphone, MessageCircle, Mail, Sparkles, Phone, Globe, Search, Menu as MenuIcon, Quote, Download, Upload, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { Switch } from "../components/ui-kit/Switch";
import { useMedia, deleteMedia, renameMedia } from "./media";
import { toast } from "sonner";
import {
  useContent,
  updateContent,
  upsertBanner,
  deleteBanner,
  upsertFaq,
  deleteFaq,
  resetContent,
  resetSection,
  exportContent,
  importContent,
  reorderNav,
  Banner,
  FaqItem,
  NavItem,
  FooterColumn,
  Testimonial,
  ContentState,
} from "./content";
import { Field, Card, inputClass, inputStyle } from "./content-shared";
import {
  BannersEditor, NavigationEditor, FooterEditor,
  TestimonialsEditor, FaqEditor, MediaLibrary,
} from "./content-editors";

type TabId =
  | "brand"
  | "hero"
  | "announcement"
  | "banners"
  | "faq"
  | "contact"
  | "social"
  | "legal"
  | "emails"
  | "seo"
  | "navigation"
  | "footer"
  | "testimonials"
  | "media";

const TABS: { id: TabId; label: string; Icon: typeof FileText }[] = [
  { id: "brand", label: "Marque", Icon: Sparkles },
  { id: "media", label: "Médiathèque", Icon: ImageIcon },
  { id: "seo", label: "SEO & métadonnées", Icon: Search },
  { id: "hero", label: "Page d'accueil", Icon: Eye },
  { id: "announcement", label: "Bandeau annonce", Icon: Megaphone },
  { id: "banners", label: "Bannières promo", Icon: Megaphone },
  { id: "navigation", label: "Navigation", Icon: MenuIcon },
  { id: "footer", label: "Pied de page", Icon: FileText },
  { id: "testimonials", label: "Témoignages", Icon: Quote },
  { id: "faq", label: "FAQ", Icon: MessageCircle },
  { id: "contact", label: "Contact", Icon: Phone },
  { id: "social", label: "Réseaux sociaux", Icon: Globe },
  { id: "legal", label: "Mentions légales", Icon: FileText },
  { id: "emails", label: "E-mails transactionnels", Icon: Mail },
];


export function AdminContentPage() {
  const content = useContent();
  const [tab, setTab] = useState<TabId>("brand");
  const [draft, setDraft] = useState<ContentState>(content);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  const save = () => {
    (Object.keys(draft) as (keyof ContentState)[]).forEach((k) => {
      if (k === "meta") return;
      updateContent(k, draft[k]);
    });
    toast.success("Contenus enregistrés");
  };

  const reset = () => {
    if (confirm("Réinitialiser tous les contenus aux valeurs par défaut ? Cette action est irréversible.")) {
      resetContent();
      toast.success("Contenus réinitialisés");
    }
  };

  const resetCurrentSection = () => {
    if (tab === "media") {
      if (!confirm("Vider la médiathèque ?")) return;
      import("./media").then((m) => { m.clearMedia(); toast.success("Médiathèque vidée"); });
      return;
    }
    if (!confirm(`Réinitialiser la section « ${tab} » ?`)) return;
    const map: Partial<Record<TabId, keyof ContentState>> = {
      brand: "brand", seo: "seo", hero: "hero", announcement: "announcement",
      banners: "banners", navigation: "navigation", footer: "footer",
      testimonials: "testimonials", faq: "faq", contact: "contact",
      social: "social", legal: "legal", emails: "emails",
    };
    const key = map[tab];
    if (key) {
      resetSection(key);
      toast.success("Section réinitialisée");
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportContent()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-content-v${content.meta?.version ?? 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contenus exportés");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importContent(String(reader.result));
      if (res.ok) toast.success("Contenus importés");
      else toast.error(res.error);
    };
    reader.readAsText(file);
  };

  const lastUpdated = content.meta?.lastUpdated
    ? new Date(content.meta.lastUpdated).toLocaleString("fr-FR")
    : "—";

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>Contenus éditoriaux</h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>
            Modifier les textes, bannières et e-mails de la marketplace. Dernière modif : <strong>{lastUpdated}</strong> · v{content.meta?.version ?? 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <Upload className="w-4 h-4" /> Importer
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button
            onClick={resetCurrentSection}
            className="px-3 py-2 rounded-xl bg-white border border-border flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <RotateCcw className="w-4 h-4" /> Section
          </button>
          <button
            onClick={reset}
            className="px-3 py-2 rounded-xl bg-white border border-border text-[#E11D2E] flex items-center gap-1.5"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <RotateCcw className="w-4 h-4" /> Tout
          </button>
          <button
            onClick={save}
            disabled={!dirty}
            className="px-3 py-2 rounded-xl bg-[#16A34A] text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <nav className="bg-white rounded-2xl border border-border p-2 h-fit lg:sticky lg:top-20">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  active ? "bg-[#FEF2F2] text-[#E11D2E]" : "hover:bg-muted"
                }`}
                style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}
              >
                <t.Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {tab === "brand" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Identité de marque</h3>
              <div className="space-y-3">
                <Field label="Nom de la marque">
                  <input className={inputClass} style={inputStyle} value={draft.brand.name} onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, name: e.target.value } })} />
                </Field>
                <Field label="Slogan" hint="Affiché dans le header et le pied de page.">
                  <input className={inputClass} style={inputStyle} value={draft.brand.tagline} onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, tagline: e.target.value } })} />
                </Field>
                <Field label="Description courte">
                  <textarea rows={3} className={inputClass} style={inputStyle} value={draft.brand.description} onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, description: e.target.value } })} />
                </Field>
                <ImagePicker
                  label="Logo de la marque"
                  hint="Laisser vide pour utiliser le logo par défaut."
                  aspectRatio="1/1"
                  value={draft.brand.logoUrl}
                  onChange={(url) => setDraft({ ...draft, brand: { ...draft.brand, logoUrl: url } })}
                />
              </div>
            </Card>
          )}

          {tab === "hero" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Bloc principal de la page d'accueil</h3>
              <div className="space-y-3">
                <Field label="Titre">
                  <input className={inputClass} style={inputStyle} value={draft.hero.title} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })} />
                </Field>
                <Field label="Sous-titre">
                  <textarea rows={2} className={inputClass} style={inputStyle} value={draft.hero.subtitle} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Bouton principal">
                    <input className={inputClass} style={inputStyle} value={draft.hero.ctaPrimary} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaPrimary: e.target.value } })} />
                  </Field>
                  <Field label="Bouton secondaire">
                    <input className={inputClass} style={inputStyle} value={draft.hero.ctaSecondary} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaSecondary: e.target.value } })} />
                  </Field>
                </div>
                <Field label="Dégradé de fond (CSS)">
                  <input className={inputClass} style={inputStyle} value={draft.hero.bgGradient} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, bgGradient: e.target.value } })} />
                </Field>
                <ImagePicker
                  label="Image illustrative (optionnelle)"
                  hint="S'affiche par-dessus le dégradé pour personnaliser le bloc."
                  aspectRatio="16/9"
                  value={draft.hero.imageUrl || ""}
                  onChange={(url) => setDraft({ ...draft, hero: { ...draft.hero, imageUrl: url } })}
                />
                <div className="relative rounded-xl p-6 text-white overflow-hidden" style={{ background: draft.hero.bgGradient }}>
                  {draft.hero.imageUrl && (
                    <img src={draft.hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  )}
                  <div className="relative">
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>{draft.hero.title}</p>
                    <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>{draft.hero.subtitle}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {tab === "announcement" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Bandeau d'annonce</h3>
              <div className="space-y-3">
                <Field label="Activer le bandeau">
                  <Switch
                    checked={draft.announcement.active}
                    onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, active: v } })}
                    label="Activer le bandeau"
                  />
                </Field>
                <Field label="Message">
                  <input className={inputClass} style={inputStyle} value={draft.announcement.message} onChange={(e) => setDraft({ ...draft, announcement: { ...draft.announcement, message: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Couleur de fond">
                    <input type="color" className="w-full h-10 rounded-xl border border-border" value={draft.announcement.bgColor} onChange={(e) => setDraft({ ...draft, announcement: { ...draft.announcement, bgColor: e.target.value } })} />
                  </Field>
                  <Field label="Couleur du texte">
                    <input type="color" className="w-full h-10 rounded-xl border border-border" value={draft.announcement.textColor} onChange={(e) => setDraft({ ...draft, announcement: { ...draft.announcement, textColor: e.target.value } })} />
                  </Field>
                  <Field label="Lien">
                    <input className={inputClass} style={inputStyle} value={draft.announcement.link} onChange={(e) => setDraft({ ...draft, announcement: { ...draft.announcement, link: e.target.value } })} placeholder="/promos" />
                  </Field>
                </div>
                <div className="rounded-xl py-3 px-4 text-center" style={{ background: draft.announcement.bgColor, color: draft.announcement.textColor, fontSize: 13 }}>
                  {draft.announcement.message || "Aperçu du bandeau"}
                </div>
              </div>
            </Card>
          )}

          {tab === "banners" && (
            <BannersEditor banners={draft.banners} onChange={(banners) => setDraft({ ...draft, banners })} />
          )}

          {tab === "faq" && (
            <FaqEditor faq={draft.faq} onChange={(faq) => setDraft({ ...draft, faq })} />
          )}

          {tab === "contact" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Coordonnées</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="E-mail"><input className={inputClass} style={inputStyle} value={draft.contact.email} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })} /></Field>
                <Field label="Téléphone"><input className={inputClass} style={inputStyle} value={draft.contact.phone} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })} /></Field>
                <Field label="WhatsApp"><input className={inputClass} style={inputStyle} value={draft.contact.whatsapp} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, whatsapp: e.target.value } })} /></Field>
                <Field label="Adresse"><input className={inputClass} style={inputStyle} value={draft.contact.address} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })} /></Field>
                <Field label="Horaires"><input className={inputClass} style={inputStyle} value={draft.contact.hours} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, hours: e.target.value } })} /></Field>
              </div>
            </Card>
          )}

          {tab === "social" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Réseaux sociaux</h3>
              <div className="space-y-3">
                {(["facebook", "instagram", "linkedin", "youtube", "tiktok"] as const).map((k) => (
                  <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                    <input className={inputClass} style={inputStyle} placeholder="https://…" value={draft.social[k]} onChange={(e) => setDraft({ ...draft, social: { ...draft.social, [k]: e.target.value } })} />
                  </Field>
                ))}
              </div>
            </Card>
          )}

          {tab === "legal" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Mentions légales</h3>
              <div className="space-y-3">
                <Field label="Titre CGU"><input className={inputClass} style={inputStyle} value={draft.legal.termsTitle} onChange={(e) => setDraft({ ...draft, legal: { ...draft.legal, termsTitle: e.target.value } })} /></Field>
                <Field label="Contenu CGU" hint="Markdown supporté."><textarea rows={8} className={inputClass} style={inputStyle} value={draft.legal.termsBody} onChange={(e) => setDraft({ ...draft, legal: { ...draft.legal, termsBody: e.target.value } })} /></Field>
                <Field label="Titre confidentialité"><input className={inputClass} style={inputStyle} value={draft.legal.privacyTitle} onChange={(e) => setDraft({ ...draft, legal: { ...draft.legal, privacyTitle: e.target.value } })} /></Field>
                <Field label="Contenu confidentialité"><textarea rows={8} className={inputClass} style={inputStyle} value={draft.legal.privacyBody} onChange={(e) => setDraft({ ...draft, legal: { ...draft.legal, privacyBody: e.target.value } })} /></Field>
              </div>
            </Card>
          )}

          {tab === "seo" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>SEO &amp; métadonnées</h3>
              <div className="space-y-3">
                <Field label="Titre de la page (≤ 60 car.)">
                  <input className={inputClass} style={inputStyle} maxLength={70} value={draft.seo.title} onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, title: e.target.value } })} />
                </Field>
                <Field label="Description (≤ 160 car.)" hint={`${draft.seo.description.length}/160`}>
                  <textarea rows={3} className={inputClass} style={inputStyle} value={draft.seo.description} onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, description: e.target.value } })} />
                </Field>
                <Field label="Mots-clés" hint="Séparés par des virgules">
                  <input className={inputClass} style={inputStyle} value={draft.seo.keywords} onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, keywords: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="URL canonique"><input className={inputClass} style={inputStyle} value={draft.seo.canonicalUrl} onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, canonicalUrl: e.target.value } })} /></Field>
                  <Field label="Compte Twitter"><input className={inputClass} style={inputStyle} value={draft.seo.twitterHandle} onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, twitterHandle: e.target.value } })} /></Field>
                </div>
                <ImagePicker
                  label="Image Open Graph"
                  hint="1200×630 px recommandé. Affichée lors du partage sur les réseaux sociaux."
                  aspectRatio="1200/630"
                  value={draft.seo.ogImageUrl}
                  onChange={(url) => setDraft({ ...draft, seo: { ...draft.seo, ogImageUrl: url } })}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.seo.indexable}
                    onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, indexable: e.target.checked } })}
                    className="w-4 h-4 accent-[#E11D2E]"
                  />
                  <span style={{ fontSize: 13 }}>Indexable par les moteurs de recherche (robots)</span>
                </label>

                <div className="rounded-xl border border-border p-4 mt-3">
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>Aperçu Google</p>
                  <p className="text-[#1a0dab] truncate" style={{ fontSize: 16 }}>{draft.seo.title || "Titre"}</p>
                  <p className="text-[#006621] truncate" style={{ fontSize: 12 }}>{draft.seo.canonicalUrl || "https://ippoo.market"}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{draft.seo.description || "Description"}</p>
                </div>
              </div>
            </Card>
          )}

          {tab === "navigation" && (
            <NavigationEditor
              items={draft.navigation}
              onChange={(navigation) => setDraft({ ...draft, navigation })}
            />
          )}

          {tab === "footer" && (
            <FooterEditor
              footer={draft.footer}
              onChange={(footer) => setDraft({ ...draft, footer })}
            />
          )}

          {tab === "testimonials" && (
            <TestimonialsEditor
              items={draft.testimonials}
              onChange={(testimonials) => setDraft({ ...draft, testimonials })}
            />
          )}

          {tab === "media" && <MediaLibrary />}

          {tab === "emails" && (
            <Card>
              <h3 className="mb-4" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Modèles d'e-mails</h3>
              <p className="text-muted-foreground mb-4" style={{ fontSize: 12 }}>
                Variables disponibles : <code className="px-1 rounded bg-muted">{"{{nom}}"}</code>, <code className="px-1 rounded bg-muted">{"{{orderId}}"}</code>, <code className="px-1 rounded bg-muted">{"{{total}}"}</code>.
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2" style={{ fontWeight: 700, fontSize: 13 }}>E-mail de bienvenue</h4>
                  <div className="space-y-2">
                    <Field label="Sujet"><input className={inputClass} style={inputStyle} value={draft.emails.welcomeSubject} onChange={(e) => setDraft({ ...draft, emails: { ...draft.emails, welcomeSubject: e.target.value } })} /></Field>
                    <Field label="Corps"><textarea rows={5} className={inputClass} style={inputStyle} value={draft.emails.welcomeBody} onChange={(e) => setDraft({ ...draft, emails: { ...draft.emails, welcomeBody: e.target.value } })} /></Field>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2" style={{ fontWeight: 700, fontSize: 13 }}>Confirmation de commande</h4>
                  <div className="space-y-2">
                    <Field label="Sujet"><input className={inputClass} style={inputStyle} value={draft.emails.orderConfirmSubject} onChange={(e) => setDraft({ ...draft, emails: { ...draft.emails, orderConfirmSubject: e.target.value } })} /></Field>
                    <Field label="Corps"><textarea rows={6} className={inputClass} style={inputStyle} value={draft.emails.orderConfirmBody} onChange={(e) => setDraft({ ...draft, emails: { ...draft.emails, orderConfirmBody: e.target.value } })} /></Field>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

