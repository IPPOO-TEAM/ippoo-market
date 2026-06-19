/* Injects the meta tags + dynamic manifest + service worker needed to make the PWA installable. */

let iconUrl: string = "/icons/icon-192.png";

export function setManifestIcon(url: string) {
  iconUrl = url;
}

type Tag =
  | { type: "meta"; name?: string; property?: string; content: string }
  | { type: "link"; rel: string; href: string; sizes?: string };

function tags(): Tag[] {
  return [
    { type: "meta", name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1" },
    { type: "meta", name: "mobile-web-app-capable", content: "yes" },
    { type: "meta", name: "apple-mobile-web-app-capable", content: "yes" },
    { type: "meta", name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { type: "meta", name: "apple-mobile-web-app-title", content: "IPPOO" },
    { type: "meta", name: "format-detection", content: "telephone=no" },
    { type: "meta", name: "theme-color", content: "#E11D2E" },
    { type: "meta", name: "color-scheme", content: "light" },
    { type: "meta", name: "application-name", content: "IPPOO Market" },
    { type: "meta", name: "description", content: "Marketplace B2B de gros pour l'Afrique de l'Ouest — commandez en gros, payez en mobile money, suivez vos livraisons." },
    { type: "meta", name: "msapplication-TileColor", content: "#E11D2E" },
    { type: "meta", name: "msapplication-TileImage", content: "/icons/ippoo-logo.png" },
    { type: "meta", name: "msapplication-tap-highlight", content: "no" },
    { type: "meta", name: "msapplication-config", content: "none" },
    { type: "meta", property: "og:title", content: "IPPOO Market" },
    { type: "meta", property: "og:description", content: "Marketplace B2B de gros pour l'Afrique de l'Ouest." },
    { type: "meta", property: "og:image", content: "/icons/ippoo-logo.png" },
    { type: "meta", property: "og:type", content: "website" },
    { type: "meta", name: "twitter:card", content: "summary_large_image" },
    { type: "link", rel: "apple-touch-icon", href: iconUrl, sizes: "192x192" },
    { type: "link", rel: "apple-touch-icon", href: iconUrl, sizes: "512x512" },
    { type: "link", rel: "icon", href: iconUrl, sizes: "any" },
    { type: "link", rel: "shortcut icon", href: iconUrl },
    { type: "link", rel: "mask-icon", href: "/icons/ippoo-logo-maskable.png" },
  ];
}

const STATIC_MANIFEST_URL = "/manifest.webmanifest";

function buildManifestBlobUrl(): string {
  const maskable = "/icons/ippoo-logo-maskable.png";
  const manifest = {
    name: "IPPOO Market",
    short_name: "IPPOO",
    description: "Marketplace B2B de gros pour l'Afrique de l'Ouest — commandez en gros, payez en mobile money, suivez vos livraisons.",
    id: "/?source=pwa",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: "#FFFFFF",
    theme_color: "#E11D2E",
    lang: "fr",
    dir: "ltr",
    categories: ["shopping", "business", "marketplace", "finance"],
    iarc_rating_id: "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
    prefer_related_applications: false,
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    handle_links: "preferred",
    edge_side_panel: { preferred_width: 480 },
    icons: [
      { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: maskable, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/icons/screenshot-narrow.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Accueil IPPOO Market sur mobile" },
      { src: "/icons/screenshot-wide.png", sizes: "1920x1080", type: "image/png", form_factor: "wide", label: "Tableau de bord IPPOO sur ordinateur" },
    ],
    shortcuts: [
      { name: "Mes commandes", short_name: "Commandes", description: "Consulter vos commandes en cours", url: "/commandes", icons: [{ src: iconUrl, sizes: "192x192" }] },
      { name: "Panier", short_name: "Panier", description: "Finaliser votre commande", url: "/panier", icons: [{ src: iconUrl, sizes: "192x192" }] },
      { name: "Catalogue", short_name: "Catalogue", description: "Parcourir toutes les catégories", url: "/catalogue", icons: [{ src: iconUrl, sizes: "192x192" }] },
    ],
    share_target: {
      action: "/partage-recu",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["image/*"] }],
      },
    },
    protocol_handlers: [{ protocol: "web+ippoo", url: "/?deeplink=%s" }],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  return URL.createObjectURL(blob);
}

function installManifest() {
  // Toujours pointer vers le fichier statique /manifest.webmanifest pour que
  // PWABuilder, Lighthouse et le store puissent le trouver via le HTML servi.
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "manifest";
    document.head.appendChild(el);
  }
  el.href = STATIC_MANIFEST_URL;
  // Garde la fonction Blob pour debug local mais ne l'utilise plus.
  void buildManifestBlobUrl;
}

function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname;
  const secure = window.location.protocol === "https:" || host === "localhost" || host === "127.0.0.1";
  if (!secure) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* ignore */ });
  });
  navigator.serviceWorker.addEventListener("message", (ev) => {
    if (ev.data?.type === "ippoo:navigate" && ev.data.url) {
      window.dispatchEvent(new CustomEvent("ippoo:navigate", { detail: ev.data.url }));
    }
  });
}

export function installNativeMeta() {
  if (typeof document === "undefined") return;
  try {
    for (const t of tags()) {
      if (t.type === "meta") {
        const key = t.name ? `meta[name="${t.name}"]` : `meta[property="${t.property}"]`;
        let el = document.head.querySelector<HTMLMetaElement>(key);
        if (!el) {
          el = document.createElement("meta");
          if (t.name) el.name = t.name;
          if (t.property) el.setAttribute("property", t.property);
          document.head.appendChild(el);
        }
        el.content = t.content;
      } else {
        const sel = `link[rel="${t.rel}"]${t.sizes ? `[sizes="${t.sizes}"]` : ""}`;
        let el = document.head.querySelector<HTMLLinkElement>(sel);
        if (!el) {
          el = document.createElement("link");
          el.rel = t.rel;
          if (t.sizes) el.setAttribute("sizes", t.sizes);
          document.head.appendChild(el);
        }
        el.href = t.href;
      }
    }
    try { installManifest(); } catch { /* ignore */ }
    try { registerServiceWorker(); } catch { /* ignore */ }
  } catch {
    /* never block render on PWA wiring */
  }
}
