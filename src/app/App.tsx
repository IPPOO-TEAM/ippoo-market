import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { CheckCircle2, AlertCircle, Info, Loader2, AlertTriangle } from "lucide-react";
import { I18nProvider } from "./i18n";
import { NativeShell } from "./native/NativeShell";
import { installNativeMeta, setManifestIcon } from "./native/installMeta";
import { SafeBoundary } from "./components/safe-boundary";
import { hydrateAdminSettings } from "./admin/settings-store";
import { hydrateContent } from "./admin/content";
import { hydratePayments } from "./payments/store";
import { hydrateNotifications } from "./notifications/store";
import { hydrateUserProfile } from "./auth/user-profile";
import { startSmartNotifications, stopSmartNotifications } from "./notifications/smart";
import { seedWelcomePopups } from "./notifications/popups";
import { installNotificationSoundBridge } from "./notifications/sound";
import { PromoPopupHost } from "./components/promo-popup-host";
import { SplashScreen, useSplashScreen } from "./components/splash-screen";
import ippooLogoUrl from "../imports/ippo_market.png";

export default function App() {
  const { showSplash, handleComplete } = useSplashScreen();

  useEffect(() => {
    hydrateAdminSettings();
    hydrateContent();
    hydratePayments();
    hydrateNotifications();
    hydrateUserProfile();
    startSmartNotifications();
    // Lance le popup de bienvenue après hydratation (légère temporisation pour ne
    // pas masquer le tout premier rendu).
    setTimeout(() => seedWelcomePopups(), 800);
    setManifestIcon(ippooLogoUrl);
    installNativeMeta();
    installNotificationSoundBridge();
    const onErr = (e: ErrorEvent) => {
      // eslint-disable-next-line no-console
      console.error("[IPPOO window.error]", e.message, e.error?.stack);
    };
    const onRej = (e: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
      console.error("[IPPOO unhandledrejection]", e.reason);
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      stopSmartNotifications();
    };
  }, []);

  return (
    <I18nProvider>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      <NativeShell statusBarColor="#FFFFFF" autoRequest={["persistent-storage"]}>
        <SafeBoundary>
          <RouterProvider router={router} />
          <PromoPopupHost />
        </SafeBoundary>
      </NativeShell>
        <Toaster
        position="top-center"
        closeButton
        expand
        offset="calc(70px + var(--safe-top))"
        gap={10}
        visibleToasts={5}
        duration={3500}
        toastOptions={{
          unstyled: false,
          classNames: {
            toast: "ippoo-toast",
            title: "ippoo-toast-title",
            description: "ippoo-toast-desc",
            actionButton: "ippoo-toast-action",
            cancelButton: "ippoo-toast-cancel",
            closeButton: "ippoo-toast-close",
            success: "ippoo-toast-success",
            error: "ippoo-toast-error",
            info: "ippoo-toast-info",
            warning: "ippoo-toast-warning",
            loading: "ippoo-toast-loading",
          },
        }}
        icons={{
          success: <CheckCircle2 className="w-5 h-5" strokeWidth={2.4} />,
          error: <AlertCircle className="w-5 h-5" strokeWidth={2.4} />,
          info: <Info className="w-5 h-5" strokeWidth={2.4} />,
          warning: <AlertTriangle className="w-5 h-5" strokeWidth={2.4} />,
          loading: <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.4} />,
        }}
      />
    </I18nProvider>
  );
}
