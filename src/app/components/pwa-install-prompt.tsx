import { useEffect, useState } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ippooLogo from "../../imports/MARKET.png";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "ippoo:pwa-install-dismissed";
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 4000;

let deferredEvent: BeforeInstallPromptEvent | null = null;
const openListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredEvent = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    deferredEvent = null;
    safeSetItem(DISMISS_KEY, String(Date.now()));
  });
}

export function triggerInstallPrompt() {
  safeRemoveItem(DISMISS_KEY);
  openListeners.forEach((fn) => fn());
}

export function isPwaInstallable(): boolean {
  if (isStandalone()) return false;
  return true;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
  } catch { /* ignore */ }
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

function isRecentlyDismissed(): boolean {
  const raw = safeGetItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_TTL_MS;
}

function markDismissed() {
  safeSetItem(DISMISS_KEY, String(Date.now()));
}

export function PWAInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const onForce = () => { setOpen(true); force((x) => x + 1); };
    openListeners.add(onForce);

    if (!isStandalone() && !isRecentlyDismissed()) {
      const t = window.setTimeout(() => {
        if (!isStandalone() && (isIos() || deferredEvent)) setOpen(true);
      }, SHOW_AFTER_MS);
      return () => {
        window.clearTimeout(t);
        openListeners.delete(onForce);
      };
    }
    return () => { openListeners.delete(onForce); };
  }, []);

  const ios = isIos();
  const standalone = isStandalone();

  const dismiss = () => {
    setOpen(false);
    markDismissed();
  };

  const install = async () => {
    if (!deferredEvent) return;
    setInstalling(true);
    try {
      await deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      if (choice.outcome === "accepted") {
        setOpen(false);
        deferredEvent = null;
      }
    } catch {
      /* ignore */
    } finally {
      setInstalling(false);
    }
  };

  const canAutoInstall = !!deferredEvent && !ios;

  return (
    <AnimatePresence>
      {open && !standalone && (
        <motion.div
          key="pwa-install"
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed inset-x-3 bottom-[calc(70px+env(safe-area-inset-bottom))] sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] z-[80]"
        >
      <div className="bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-border overflow-hidden flex items-center justify-center">
            <img src={ippooLogo} alt="IPPOO" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>
              Installer IPPOO Market
            </p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
              {ios
                ? "Ajoutez l'app à votre écran d'accueil."
                : canAutoInstall
                  ? "Accès en un tap, hors-ligne et notifications."
                  : "Suivez les étapes ci-dessous pour installer."}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="p-1 -m-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ios ? (
          <div className="px-4 pb-4">
            <ol className="space-y-2 mb-3" style={{ fontSize: 12 }}>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>1</span>
                Touchez <Share className="inline w-3.5 h-3.5 mx-0.5" /> Partager dans Safari.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>2</span>
                Choisissez <strong>« Sur l'écran d'accueil »</strong> <Plus className="inline w-3.5 h-3.5 ml-0.5" />
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>3</span>
                Confirmez avec <strong>« Ajouter »</strong>.
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              J'ai compris
            </button>
          </div>
        ) : canAutoInstall ? (
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl border border-border"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              Plus tard
            </button>
            <button
              onClick={install}
              disabled={installing}
              className="flex-1 py-2.5 rounded-xl bg-[#E11D2E] text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              <Download className="w-4 h-4" />
              {installing ? "Installation..." : "Installer"}
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <ol className="space-y-2 mb-3" style={{ fontSize: 12 }}>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>1</span>
                Ouvrez le menu <strong>⋮</strong> de votre navigateur.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>2</span>
                Choisissez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>3</span>
                Confirmez avec <strong>« Installer »</strong>.
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white"
              style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
            >
              J'ai compris
            </button>
          </div>
        )}
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
