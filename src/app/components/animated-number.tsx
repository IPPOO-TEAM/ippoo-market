/* ═══════════════════════════════════════════
   IPPOO - AnimatedNumber
   Compte-rebours animé (easeOutCubic) de 0 vers `value`.
   Respecte prefers-reduced-motion. Reformate via Intl
   ou prefix/suffix (« FCFA », « % », « ★ »…).
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;          // ms, défaut 900
  decimals?: number;          // décimales, défaut 0
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Format français par défaut avec séparateurs de milliers. */
  format?: (n: number) => string;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  style,
  format,
}: Props) {
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const fmt = format
    ? format(display)
    : decimals === 0
      ? Math.round(display).toLocaleString("fr-FR")
      : display.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <span className={className} style={style}>
      {prefix}{fmt}{suffix}
    </span>
  );
}
