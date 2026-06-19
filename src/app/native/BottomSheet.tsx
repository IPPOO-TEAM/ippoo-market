import { useEffect, useRef, useState } from "react";
import { haptic } from "./haptics";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
};

export function BottomSheet({ open, onClose, title, children, snapPoints = [0.6, 0.95], initialSnap = 0 }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const startTranslate = useRef(0);
  const [translate, setTranslate] = useState(0);
  const [snap, setSnap] = useState(initialSnap);

  useEffect(() => {
    if (open) {
      haptic("light");
      setSnap(initialSnap);
      setTranslate(0);
    }
  }, [open, initialSnap]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handle = (clientY: number, end?: boolean) => {
    if (dragStart.current == null) { dragStart.current = clientY; startTranslate.current = translate; return; }
    const dy = clientY - dragStart.current;
    if (!end) { setTranslate(Math.max(0, startTranslate.current + dy)); return; }
    const sheetH = sheetRef.current?.clientHeight ?? 1;
    if (translate > sheetH * 0.32) {
      haptic("medium");
      onClose();
    } else {
      setTranslate(0);
      haptic("selection");
    }
    dragStart.current = null;
  };

  if (!open) return null;
  const heightPct = Math.round((snapPoints[snap] ?? 0.6) * 100);

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/40"
        style={{ opacity: 1 - translate / 600 }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl sheet-enter flex flex-col"
        style={{
          height: `${heightPct}%`,
          transform: `translateY(${translate}px)`,
          transition: dragStart.current ? "none" : "transform 220ms cubic-bezier(.32,.72,0,1)",
          paddingBottom: "var(--safe-bottom)",
        }}
      >
        <div
          className="pt-3 pb-2 cursor-grab touch-none"
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); handle(e.clientY); }}
          onPointerMove={(e) => dragStart.current != null && handle(e.clientY)}
          onPointerUp={(e) => handle(e.clientY, true)}
          onPointerCancel={(e) => handle(e.clientY, true)}
        >
          <div className="mx-auto w-10 h-1.5 rounded-full bg-[#D1D5DB]" />
        </div>
        {title && (
          <div className="px-5 pb-2 flex items-center justify-between">
            <h3 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 17 }}>{title}</h3>
            {snapPoints.length > 1 && (
              <button
                onClick={() => { setSnap((s) => (s + 1) % snapPoints.length); haptic("selection"); }}
                className="px-2 py-1 rounded-lg text-muted-foreground"
                style={{ fontSize: 11 }}
                aria-label="Changer la taille"
              >
                {snap === snapPoints.length - 1 ? "−" : "+"}
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto native-scroll px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
