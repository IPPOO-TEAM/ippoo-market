import { useEffect, useState } from "react";
import { lookupDict } from "./i18n-dictionary";
import { getStaticDict, getLanguageMeta } from "./i18n/loader";
import { safeGetItem, safeSetItem } from "./lib/safe-storage";

/* ═══════════════════════════════════════════
   IPPOO i18n  ,  100 % gratuit
   Source : Français
   Moteur : MyMemory (https://mymemory.translated.net) , gratuit, sans clé
   Cache  : localStorage (persistant), pas de re-fetch
   Adaptatif : MutationObserver traduit les nouveaux contenus
   ═══════════════════════════════════════════ */

const SOURCE = "fr";
const SETTINGS_KEY = "ippoo:settings";
const CACHE_KEY = "ippoo:i18n-cache";
const LANG_EVENT = "ippoo:lang";

/** Étiquettes UI -> codes (API-supportés ou dictionnaires statiques validés). */
const ALL_LANGUAGES: Record<string, string> = {
  "Français": "fr",
  "English": "en",
  "العربية": "ar",
  "Yoruba": "yo",
  "Haoussa (Hausa)": "ha",
  "Igbo": "ig",
  "Wolof": "wo",
  "Lingala": "ln",
  "Bambara": "bm",
  "Fon (Bénin)": "fon",
  "Peul (Pulaar/Fulfulde)": "ff",
  "Dioula (Jula)": "dyu",
  "Sénoufo": "sef",
  "Djerma (Zarma)": "dje",
};

/** Codes pris en charge par l'API MyMemory */
const API_SUPPORTED = new Set(["en", "ar", "yo", "ha", "ig", "wo", "ln", "bm"]);

/** Carte effective des langues exposées dans le sélecteur (toutes exposées). */
const LANG_TO_CODE: Record<string, string> = ALL_LANGUAGES;

export const SUPPORTED_LANGUAGES = Object.keys(LANG_TO_CODE);

export function getLangCode(label: string): string {
  return LANG_TO_CODE[label] ?? "fr";
}

export function getCurrentLangLabel(): string {
  try {
    const s = JSON.parse(safeGetItem(SETTINGS_KEY) || "{}");
    return s.langue || "Français";
  } catch {
    return "Français";
  }
}

export function setCurrentLanguage(label: string) {
  try {
    const s = JSON.parse(safeGetItem(SETTINGS_KEY) || "{}");
    s.langue = label;
    safeSetItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: label }));
}

type Cache = Record<string, Record<string, string>>; // { code: { source: translation } }

function loadCache(): Cache {
  try {
    return JSON.parse(safeGetItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(c: Cache) {
  safeSetItem(CACHE_KEY, JSON.stringify(c));
}

const cache: Cache = loadCache();
const inFlight = new Map<string, Promise<string>>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveCache(cache), 500);
}

async function translateString(text: string, code: string): Promise<string> {
  if (code === SOURCE) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Dictionnaire manuel (prioritaire, instantané, hors-ligne)
  const dict = lookupDict(trimmed, code);
  if (dict) return dict;

  // 1bis. Dictionnaire JSON statique (langues réservées contribuées)
  const staticDict = getStaticDict(code);
  if (staticDict && staticDict[trimmed]) return staticDict[trimmed];

  cache[code] = cache[code] || {};
  if (cache[code][trimmed]) return cache[code][trimmed];

  // 2. Langue sans API : pas de mélange, on retourne la source telle quelle.
  if (!API_SUPPORTED.has(code)) return text;

  const key = `${code}:${trimmed}`;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const req = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${SOURCE}|${code}`;
      const res = await fetch(url);
      const data = await res.json();
      const out = data?.responseData?.translatedText;
      if (typeof out === "string" && out.length > 0 && !/^MYMEMORY/.test(out)) {
        cache[code][trimmed] = out;
        persist();
        return out;
      }
    } catch {
      // network/quota error, fall back
    }
    return text;
  })();

  inFlight.set(key, req);
  try {
    return await req;
  } finally {
    inFlight.delete(key);
  }
}

/* ═══════ DOM walker ═══════ */
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA", "CODE", "PRE", "SVG"]);
const NUMERIC_RE = /^[\d\s.,:%/+\-€$₦₵()[\]"']+$/;
const ORIGINAL = "__ippooOrig";
const TRANSLATED = "__ippooLang";

function shouldSkipText(node: Text): boolean {
  let p: Node | null = node.parentNode;
  while (p) {
    if (p.nodeType === 1) {
      const el = p as HTMLElement;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.dataset && el.dataset.noTranslate === "true") return true;
    }
    p = p.parentNode;
  }
  return false;
}

function restoreAll() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text & Record<string, unknown>;
    const orig = t[ORIGINAL];
    if (typeof orig === "string") t.nodeValue = orig;
    delete t[ORIGINAL];
    delete t[TRANSLATED];
  }
}

function collectNodes(code: string): Text[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text & Record<string, unknown>;
    if (shouldSkipText(t)) continue;
    const orig = (typeof t[ORIGINAL] === "string" ? (t[ORIGINAL] as string) : t.nodeValue) || "";
    const trimmed = orig.trim();
    if (trimmed.length < 2) continue;
    if (NUMERIC_RE.test(trimmed)) continue;
    if (t[TRANSLATED] === code) continue;
    if (typeof t[ORIGINAL] !== "string") t[ORIGINAL] = t.nodeValue;
    out.push(t);
  }
  return out;
}

let runId = 0;
let observer: MutationObserver | null = null;

async function translateDom(code: string) {
  const myRun = ++runId;
  const nodes = collectNodes(code);
  // Apply cached results synchronously first to avoid flicker
  for (const t of nodes) {
    const orig = (t as Text & Record<string, unknown>)[ORIGINAL] as string;
    const cached = cache[code]?.[orig.trim()];
    if (cached) {
      t.nodeValue = orig.replace(orig.trim(), cached);
      (t as Text & Record<string, unknown>)[TRANSLATED] = code;
    }
  }
  // Fetch missing in parallel, with a small concurrency cap
  const missing = nodes.filter((t) => (t as Text & Record<string, unknown>)[TRANSLATED] !== code);
  const CONCURRENCY = 6;
  let i = 0;
  const worker = async () => {
    while (i < missing.length && myRun === runId) {
      const idx = i++;
      const t = missing[idx];
      const orig = (t as Text & Record<string, unknown>)[ORIGINAL] as string;
      const trimmed = orig.trim();
      const out = await translateString(trimmed, code);
      if (myRun !== runId) return;
      const currentOrig = (t as Text & Record<string, unknown>)[ORIGINAL];
      if (currentOrig === orig) {
        t.nodeValue = orig.replace(trimmed, out);
        (t as Text & Record<string, unknown>)[TRANSLATED] = code;
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

function startObserver(code: string) {
  if (observer) observer.disconnect();
  let pending: ReturnType<typeof setTimeout> | null = null;
  observer = new MutationObserver(() => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => translateDom(code), 120);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopObserver() {
  if (observer) observer.disconnect();
  observer = null;
}

/* ═══════ Provider ═══════ */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>(() => getCurrentLangLabel());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setLang(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) setLang(getCurrentLangLabel());
    };
    window.addEventListener(LANG_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LANG_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const code = LANG_TO_CODE[lang] || SOURCE;
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    setBusy(false);
  }, [lang]);

  return (
    <>
      {children}
      {busy && (
        <div
          data-no-translate="true"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-black/80 text-white px-3 py-1.5 rounded-full"
          style={{ fontSize: 12, fontFamily: "Poppins" }}
        >
          Traduction…
        </div>
      )}
    </>
  );
}
