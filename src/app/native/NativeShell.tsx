import { useEffect } from "react";
import { bindHapticClicks } from "./haptics";
import { detectPlatform, isStandalone, setStatusBarColor } from "./platform";
import { requestPermission } from "./permissions";

type Props = {
  children: React.ReactNode;
  statusBarColor?: string;
  autoRequest?: Array<"notifications" | "persistent-storage">;
};

export function NativeShell({ children, statusBarColor = "#FFFFFF", autoRequest }: Props) {
  useEffect(() => {
    bindHapticClicks();
    setStatusBarColor(statusBarColor);

    const platform = detectPlatform();
    document.documentElement.dataset.platform = platform;
    document.documentElement.dataset.standalone = String(isStandalone());

    // Prevent default iOS double-tap zoom and rubber-band on body
    const stop = (e: TouchEvent) => {
      if ((e as TouchEvent & { scale?: number }).scale && (e as TouchEvent & { scale?: number }).scale !== 1) e.preventDefault();
    };
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("touchmove", stop, { passive: false });

    // Persist storage silently if possible
    if (autoRequest?.includes("persistent-storage")) {
      requestPermission("persistent-storage");
    }

    return () => {
      document.removeEventListener("touchmove", stop);
    };
  }, [statusBarColor, autoRequest]);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="native-status-bar" aria-hidden />
      {children}
    </div>
  );
}
