type Intensity = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

const PATTERNS: Record<Intensity, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: 28,
  selection: 5,
  success: [10, 40, 18],
  warning: [12, 60, 12],
  error: [20, 80, 20, 80, 20],
};

export function haptic(kind: Intensity = "light") {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(PATTERNS[kind]);
  } catch { /* noop */ }
}

export function bindHapticClicks() {
  if (typeof document === "undefined") return;
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const el = t.closest<HTMLElement>("[data-haptic]");
    if (!el) return;
    const kind = (el.dataset.haptic || "light") as Intensity;
    haptic(kind);
  }, { passive: true });
}
