import { useEffect, useState } from "react";
import { Download, Share, Plus, X, Smartphone } from "lucide-react";
import { detectPlatform, isStandalone } from "./platform";
import { haptic } from "./haptics";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "ippoo:install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function recentlyDismissed(): boolean {
  const raw = safeGetItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_TTL_MS;
}

function markDismissed() {
  safeSetItem(DISMISS_KEY, String(Date.now()));
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const platform = detectPlatform();

    // iOS Safari - no beforeinstallprompt, show manual hint
    if (platform === "ios") {
      if (recentlyDismissed()) return;
      const t = window.setTimeout(() => { setIosHint(true); setOpen(true); }, 4000);
      return () => window.clearTimeout(t);
    }

    // Chrome / Edge / Android - capture the prompt event
    const onBIP = (e: Event) => {
      e.preventDefault();
      if (recentlyDismissed()) return;
      setDeferred(e as BIPEvent);
      setOpen(true);
    };
    const onInstalled = () => {
      setOpen(false);
      setDeferred(null);
      safeRemoveItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    haptic("light");
    setOpen(false);
    markDismissed();
  };

  const install = async () => {
    if (!deferred) return;
    haptic("medium");
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        haptic("success");
        setOpen(false);
      }
      setDeferred(null);
    } catch {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] px-3 pb-3" style={{ paddingBottom: `calc(12px + var(--safe-bottom))` }}>
      <div
        className="mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden sheet-enter"
        role="dialog"
        aria-modal="false"
        aria-labelledby="install-title"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="install-title" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}>
              Installer IPPOO Market
            </h3>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
              {iosHint
                ? "Ajoutez IPPOO à votre écran d'accueil pour un accès rapide et un mode hors-ligne."
                : "Profitez d'une expérience plus rapide, notifications push et accès hors-ligne."}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Fermer"
            className="p-1.5 -m-1 rounded-lg hover:bg-muted press-feedback"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {iosHint ? (
          <div className="px-4 pb-4">
            <ol className="space-y-2 bg-[#F3F4F6] rounded-xl p-3" style={{ fontSize: 12 }}>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white inline-flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>1</span>
                Touchez <Share className="w-4 h-4 inline -mt-0.5 text-[#3B82F6]" /> dans la barre Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white inline-flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>2</span>
                Choisissez <strong>Sur l'écran d'accueil</strong> <Plus className="w-4 h-4 inline -mt-0.5" />
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white inline-flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>3</span>
                Confirmez avec <strong>Ajouter</strong>
              </li>
            </ol>
            <button
              onClick={close}
              data-haptic="light"
              className="w-full mt-3 py-2.5 rounded-xl bg-[#0F172A] text-white press-feedback"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              J'ai compris
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={close}
              className="flex-1 py-2.5 rounded-xl border border-border press-feedback"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              Plus tard
            </button>
            <button
              onClick={install}
              data-haptic="success"
              className="flex-1 py-2.5 rounded-xl bg-[#E11D2E] text-white inline-flex items-center justify-center gap-2 press-feedback"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              <Download className="w-4 h-4" /> Installer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
