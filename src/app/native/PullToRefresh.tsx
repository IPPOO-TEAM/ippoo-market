import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "./haptics";

type Props = {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
};

export function PullToRefresh({ onRefresh, children, threshold = 70 }: Props) {
  const startY = useRef<number | null>(null);
  const armed = useRef(false);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (busy) return;
      const scroller = document.scrollingElement || document.documentElement;
      if (scroller.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        armed.current = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!armed.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const eased = Math.min(threshold * 1.4, dy * 0.5);
        setPull(eased);
      }
    };
    const onEnd = async () => {
      if (!armed.current) return;
      armed.current = false;
      startY.current = null;
      if (pull >= threshold && !busy) {
        haptic("medium");
        setBusy(true);
        try { await onRefresh(); } finally {
          setBusy(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [onRefresh, threshold, pull, busy]);

  const ratio = Math.min(1, pull / threshold);

  return (
    <>
      {(pull > 0 || busy) && (
        <div
          className="fixed left-0 right-0 z-[60] flex items-center justify-center pointer-events-none"
          style={{
            top: `calc(var(--safe-top) + 8px)`,
            height: 40,
            opacity: busy ? 1 : ratio,
            transform: `translateY(${busy ? 0 : pull * 0.3}px)`,
            transition: busy ? "opacity 200ms ease" : "none",
          }}
        >
          <div
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <RefreshCw
              className="w-5 h-5 text-[#E11D2E]"
              style={{
                transform: busy ? undefined : `rotate(${ratio * 270}deg)`,
                animation: busy ? "spin 1s linear infinite" : undefined,
                transition: busy ? undefined : "transform 120ms ease",
              }}
            />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
