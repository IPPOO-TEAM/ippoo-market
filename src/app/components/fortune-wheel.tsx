import { useState, useRef, useCallback, useEffect } from "react";
import {
  Gift,
  Star,
  Ticket,
  Crown,
  Sparkles,
  Coins,
  Truck,
  RotateCcw,
  Percent,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ═══════════════════════════════════════════════════
   FORTUNE WHEEL, Shared premium component
   ═══════════════════════════════════════════════════ */

export interface WheelSegment {
  label: string;
  subLabel: string;
  color: string;
  icon: LucideIcon;
  type: string;
  textColor?: string;
}

/* ─── Default 12 segments ─── */
export const DEFAULT_SEGMENTS: WheelSegment[] = [
  { label: "5 000 FCFA", subLabel: "Cashback", color: "#E11D2E", icon: Coins, type: "cash" },
  { label: "Livraison", subLabel: "Offerte", color: "#FFCC00", icon: Truck, type: "delivery", textColor: "#1A1025" },
  { label: "2 000 FCFA", subLabel: "Bon d'achat", color: "#16A34A", icon: Gift, type: "voucher" },
  { label: "-10%", subLabel: "Prochain achat", color: "#FF5733", icon: Percent, type: "discount" },
  { label: "500 Pts", subLabel: "Fidélité", color: "#3B82F6", icon: Star, type: "points" },
  { label: "Réessayez", subLabel: "Prochaine fois", color: "#FFCC00", icon: RotateCcw, type: "retry", textColor: "#1A1025" },
  { label: "10 000 FCFA", subLabel: "Jackpot!", color: "#9333EA", icon: Crown, type: "jackpot" },
  { label: "1 000 FCFA", subLabel: "Cashback", color: "#FF5733", icon: Coins, type: "cash" },
  { label: "-15%", subLabel: "Textile", color: "#E11D2E", icon: Percent, type: "discount" },
  { label: "Livraison", subLabel: "Express", color: "#16A34A", icon: Truck, type: "delivery" },
  { label: "3 000 Pts", subLabel: "Fidélité", color: "#3B82F6", icon: Star, type: "points" },
  { label: "Réessayez", subLabel: "Bonne chance!", color: "#FFCC00", icon: RotateCcw, type: "retry", textColor: "#1A1025" },
];

/* ─── Tick Sound Generator (Web Audio API) ─── */
function useTickSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Silent fallback
    }
  }, []);

  const playWin = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      [0, 0.1, 0.2, 0.35].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const freq = [523, 659, 784, 1047][i];
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch {
      // Silent fallback
    }
  }, []);

  return { playTick, playWin };
}

/* ─── SVG Wheel Visual ─── */
interface WheelVisualProps {
  size: number;
  segments: WheelSegment[];
  rotation: number;
  spinning: boolean;
  uniqueId: string;
}

function WheelVisual({ size, segments, rotation, spinning, uniqueId }: WheelVisualProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerPad = size >= 200 ? 10 : 6;
  const radius = size / 2 - outerPad;
  const innerRadius = size >= 200 ? size * 0.13 : size * 0.15;
  const numSegments = segments.length;
  const segAngle = 360 / numSegments;
  const showSubLabel = size >= 200;
  const fontSize = size >= 280 ? 11 : size >= 180 ? 9 : 7;
  const subFontSize = size >= 280 ? 7 : 5;
  const ledCount = size >= 200 ? 24 : 16;
  const ledSize = size >= 200 ? 5 : 3;

  const getSegmentPath = (i: number) => {
    const s = (i * segAngle - 90) * (Math.PI / 180);
    const e = ((i + 1) * segAngle - 90) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy + radius * Math.sin(e);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const getTextPos = (i: number, rFactor: number) => {
    const mid = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
    const r = radius * rFactor;
    return { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid), angle: (i + 0.5) * segAngle };
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer decorative ring with rainbow gradient */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -3,
          background: "conic-gradient(from 0deg, #E11D2E, #FF5733, #FFCC00, #16A34A, #3B82F6, #9333EA, #EC4899, #E11D2E)",
          opacity: 0.85,
          filter: spinning ? "blur(1.5px)" : "none",
          transition: "filter 0.3s",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "#1A1025", margin: 3 }}
        />
      </div>

      {/* LED lights */}
      {Array.from({ length: ledCount }).map((_, i) => {
        const angle = (i * (360 / ledCount)) * (Math.PI / 180);
        const r = size / 2 + 1;
        const lx = cx + r * Math.cos(angle);
        const ly = cy + r * Math.sin(angle);
        const colors = ["#FBBF24", "#E11D2E", "#fff"];
        return (
          <motion.div
            key={`led-${uniqueId}-${i}`}
            animate={{
              opacity: spinning ? [0.3, 1, 0.3] : [0.4, 1, 0.4],
              scale: spinning ? [0.8, 1.3, 0.8] : [0.9, 1.15, 0.9],
            }}
            transition={{
              duration: spinning ? 0.25 : 1.8,
              repeat: Infinity,
              delay: i * (spinning ? 0.015 : 0.07),
            }}
            className="absolute rounded-full"
            style={{
              width: ledSize * 2,
              height: ledSize * 2,
              left: lx - ledSize,
              top: ly - ledSize,
              background: colors[i % 3],
              boxShadow: `0 0 ${ledSize + 2}px ${colors[i % 3]}`,
            }}
          />
        );
      })}

      {/* SVG Wheel */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 5.5s cubic-bezier(0.15, 0.60, 0.08, 1.00)"
            : "none",
        }}
      >
        <defs>
          <filter id={`shadow-${uniqueId}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#000" floodOpacity="0.2" />
          </filter>
          <radialGradient id={`centerGrad-${uniqueId}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor="#3B1D5E" />
            <stop offset="100%" stopColor="#1A1025" />
          </radialGradient>
          <clipPath id={`clip-${uniqueId}`}>
            <circle cx={cx} cy={cy} r={radius} />
          </clipPath>
        </defs>

        <g clipPath={`url(#clip-${uniqueId})`}>
          {segments.map((seg, i) => {
            const textPos = getTextPos(i, 0.62);
            const iconPos = getTextPos(i, 0.86);
            const textCol = seg.textColor || "#fff";
            return (
              <g key={i}>
                {/* Segment fill */}
                <path d={getSegmentPath(i)} fill={seg.color} />
                {/* White separator lines */}
                <path d={getSegmentPath(i)} fill="none" stroke="#fff" strokeWidth={size >= 200 ? 1.5 : 1} />
                {/* Inner highlight */}
                <path d={getSegmentPath(i)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

                {/* Icon background circle */}
                <circle
                  cx={iconPos.x}
                  cy={iconPos.y}
                  r={size >= 200 ? 10 : 6}
                  fill="rgba(255,255,255,0.25)"
                />

                {/* Text labels */}
                <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textPos.angle})`}>
                  <text
                    textAnchor="middle"
                    dy={showSubLabel ? "-3" : "1"}
                    fill={textCol}
                    style={{
                      fontSize,
                      fontWeight: 800,
                      fontFamily: "Poppins, sans-serif",
                    }}
                    filter={`url(#shadow-${uniqueId})`}
                  >
                    {seg.label}
                  </text>
                  {showSubLabel && (
                    <text
                      textAnchor="middle"
                      dy="9"
                      fill={textCol}
                      opacity={0.7}
                      style={{
                        fontSize: subFontSize,
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {seg.subLabel}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* Center decorative rings */}
        <circle cx={cx} cy={cy} r={innerRadius + (size >= 200 ? 8 : 4)} fill="none" stroke="#E8A817" strokeWidth={size >= 200 ? 3 : 1.5} opacity="0.5" />
        <circle cx={cx} cy={cy} r={innerRadius + (size >= 200 ? 3 : 2)} fill="none" stroke="#FBBF24" strokeWidth={size >= 200 ? 1.5 : 1} opacity="0.35" />
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={innerRadius} fill={`url(#centerGrad-${uniqueId})`} stroke="#fff" strokeWidth={size >= 200 ? 2.5 : 1.5} />
      </svg>

      {/* Center logo overlay */}
      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{
          left: cx - innerRadius,
          top: cy - innerRadius,
          width: innerRadius * 2,
          height: innerRadius * 2,
          borderRadius: "50%",
        }}
      >
        <motion.div
          animate={spinning ? { rotate: [0, 360] } : {}}
          transition={spinning ? { duration: 1.2, repeat: Infinity, ease: "linear" } : {}}
        >
          <Sparkles className="text-[#FBBF24]" style={{ width: size >= 200 ? 18 : 10, height: size >= 200 ? 18 : 10 }} />
        </motion.div>
        {size >= 180 && (
          <>
            <span
              className="text-white"
              style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: size >= 280 ? 10 : 7, letterSpacing: 1, marginTop: 1 }}
            >
              IPPOO
            </span>
            <span className="text-[#FBBF24]" style={{ fontSize: size >= 280 ? 7 : 5, fontWeight: 700 }}>
              FORTUNE
            </span>
          </>
        )}
      </div>

      {/* Pointer at top */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: size >= 200 ? -8 : -4 }}>
        <svg
          width={size >= 200 ? 36 : 20}
          height={size >= 200 ? 42 : 24}
          viewBox="0 0 36 42"
        >
          <defs>
            <filter id={`pGlow-${uniqueId}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#E8A817" floodOpacity="0.7" />
            </filter>
            <linearGradient id={`pGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#E8A817" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <path
            d="M18 40 L3 10 Q1 4 7 2 L29 2 Q35 4 33 10 Z"
            fill={`url(#pGrad-${uniqueId})`}
            stroke="#fff"
            strokeWidth="2"
            filter={`url(#pGlow-${uniqueId})`}
          />
          <circle cx="18" cy="12" r="3.5" fill="#fff" opacity="0.55" />
          {/* Diamond highlight */}
          <path d="M18 6 L20 9 L18 12 L16 9 Z" fill="#fff" opacity="0.3" />
        </svg>
        {/* Pulsating glow when spinning */}
        {spinning && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#FBBF24]"
            style={{
              top: size >= 200 ? 6 : 3,
              width: size >= 200 ? 14 : 8,
              height: size >= 200 ? 14 : 8,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FULL FORTUNE WHEEL (for jeux-page, promos-page)
   ═══════════════════════════════════════════ */
export interface FortuneWheelFullProps {
  /** Wheel diameter in px */
  size?: number;
  segments?: WheelSegment[];
  /** Unique ID prefix for SVG filters (avoid collisions) */
  id?: string;
  /** Whether to show prize legend below */
  showLegend?: boolean;
  /** Whether to show stats bar */
  showStats?: boolean;
  /** Layout: stacked (mobile) or side (desktop) */
  layout?: "stacked" | "side";
}

export function FortuneWheelFull({
  size = 310,
  segments = DEFAULT_SEGMENTS,
  id = "fw",
  showLegend = true,
  showStats = false,
  layout = "stacked",
}: FortuneWheelFullProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [resultSegment, setResultSegment] = useState<WheelSegment | null>(null);
  const [tours, setTours] = useState(2);
  const [showConfetti, setShowConfetti] = useState(false);
  const { playTick, playWin } = useTickSound();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const numSegments = segments.length;
  const segAngle = 360 / numSegments;

  /* Tick sound during spin */
  useEffect(() => {
    if (spinning) {
      // Play ticks at varying speed (fast → slow)
      let tickDelay = 60;
      const scheduleTick = () => {
        tickIntervalRef.current = setTimeout(() => {
          playTick();
          tickDelay = Math.min(tickDelay * 1.07, 400);
          if (spinning) scheduleTick();
        }, tickDelay) as unknown as ReturnType<typeof setInterval>;
      };
      scheduleTick();
    }
    return () => {
      if (tickIntervalRef.current) clearTimeout(tickIntervalRef.current);
    };
  }, [spinning, playTick]);

  const spinWheel = useCallback(() => {
    if (tours <= 0 || spinning) return;

    setSpinning(true);
    setWheelResult(null);
    setResultSegment(null);
    setShowConfetti(false);

    const winIndex = Math.floor(Math.random() * numSegments);
    const winSeg = segments[winIndex];
    const segCenter = winIndex * segAngle + segAngle / 2;
    const targetAngle = 360 - segCenter;
    const offset = (Math.random() - 0.5) * (segAngle * 0.55);
    const totalRotation = rotation + 360 * 7 + targetAngle + offset;

    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWheelResult(`${winSeg.label} ${winSeg.subLabel}`);
      setResultSegment(winSeg);
      setTours((t) => t - 1);

      if (winSeg.type !== "retry") {
        playWin();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
    }, 5600);
  }, [spinning, tours, rotation, segments, numSegments, segAngle, playWin]);

  const isSide = layout === "side";

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Dark galaxy background */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 20%, #2D1B4E, #1A1025 65%, #0F0A18)" }}
      />
      {/* Floating stars */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={`s-${i}`}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 2.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          className="absolute w-1 h-1 rounded-full bg-white"
          style={{ left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%` }}
        />
      ))}

      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-5">
          <h2
            className="text-white flex items-center justify-center gap-2"
            style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20 }}
          >
            <Sparkles className="w-5 h-5 text-[#FBBF24]" />
            ROUE DE LA FORTUNE
            <Sparkles className="w-5 h-5 text-[#FBBF24]" />
          </h2>
          <p className="text-white/45 mt-1" style={{ fontSize: 11 }}>
            Tournez la roue et tentez de gagner des récompenses !
          </p>
        </div>

        {/* Main content */}
        <div className={`flex ${isSide ? "flex-row items-start gap-8" : "flex-col items-center gap-5"}`}>
          {/* Wheel */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="shrink-0"
          >
            <WheelVisual
              size={size}
              segments={segments}
              rotation={rotation}
              spinning={spinning}
              uniqueId={id}
            />
          </motion.div>

          {/* Confetti */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                {Array.from({ length: 35 }).map((_, i) => (
                  <motion.div
                    key={`c-${i}`}
                    initial={{ x: "50%", y: "35%", scale: 0, opacity: 1 }}
                    animate={{
                      x: `${Math.random() * 100}%`,
                      y: `${75 + Math.random() * 35}%`,
                      scale: [0, 1, 0.6],
                      opacity: [1, 1, 0],
                      rotate: Math.random() * 720,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8 + Math.random(), delay: Math.random() * 0.4 }}
                    className="absolute rounded-sm"
                    style={{
                      width: 6 + Math.random() * 4,
                      height: 6 + Math.random() * 4,
                      background: ["#FBBF24", "#E11D2E", "#16A34A", "#EC4899", "#3B82F6", "#FF5733", "#fff"][i % 7],
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className={`flex flex-col items-center gap-3 ${isSide ? "flex-1 items-start" : ""}`}>
            {/* Tours badge */}
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 w-full max-w-xs">
              <Ticket className="w-4 h-4 text-[#FBBF24]" />
              <div className="flex-1">
                <p className="text-white" style={{ fontSize: 12, fontWeight: 700 }}>Tours disponibles</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>1 tour offert par commande +50 000 FCFA</p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 900,
                  fontSize: 15,
                  color: tours > 0 ? "#FBBF24" : "#EF4444",
                  background: tours > 0 ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
                }}
              >
                {tours}
              </span>
            </div>

            {/* Spin button */}
            <motion.button
              onClick={spinWheel}
              disabled={spinning || tours <= 0}
              className="relative w-full max-w-xs py-3.5 rounded-2xl overflow-hidden disabled:opacity-40 transition-all"
              style={{
                background: spinning
                  ? "rgba(255,255,255,0.08)"
                  : "linear-gradient(135deg, #FBBF24, #F97316)",
                fontFamily: "Poppins",
                fontWeight: 800,
                fontSize: 15,
                color: spinning ? "#fff" : "#1A1025",
              }}
            >
              {/* Shine sweep */}
              {!spinning && tours > 0 && (
                <motion.div
                  animate={{ x: [-120, 280] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8 }}
                  className="absolute top-0 w-16 h-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                    transform: "skewX(-18deg)",
                  }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {spinning ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    LA ROUE TOURNE...
                  </>
                ) : tours <= 0 ? (
                  "PLUS DE TOURS"
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    TOURNER LA ROUE !
                  </>
                )}
              </span>
            </motion.button>

            {/* Result display */}
            <AnimatePresence>
              {wheelResult && resultSegment && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="w-full max-w-xs"
                >
                  <div
                    className="rounded-2xl p-4 text-center border"
                    style={{
                      background:
                        resultSegment.type === "retry"
                          ? "rgba(107,114,128,0.12)"
                          : resultSegment.type === "jackpot"
                          ? "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.12))"
                          : "rgba(255,255,255,0.08)",
                      borderColor:
                        resultSegment.type === "jackpot"
                          ? "rgba(251,191,36,0.4)"
                          : resultSegment.type === "retry"
                          ? "rgba(107,114,128,0.25)"
                          : "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {resultSegment.type === "jackpot" && (
                      <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                        <Crown className="w-7 h-7 text-[#FBBF24] mx-auto mb-1.5" />
                      </motion.div>
                    )}
                    <p className="text-white/55" style={{ fontSize: 10 }}>
                      {resultSegment.type === "retry" ? "Dommage !" : "Félicitations !"}
                    </p>
                    <p
                      className="mt-0.5"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 900,
                        fontSize: resultSegment.type === "jackpot" ? 20 : 17,
                        color:
                          resultSegment.type === "jackpot"
                            ? "#FBBF24"
                            : resultSegment.type === "retry"
                            ? "#9CA3AF"
                            : "#fff",
                      }}
                    >
                      {wheelResult}
                    </p>
                    {resultSegment.type !== "retry" && (
                      <p className="text-[#16A34A] mt-1.5" style={{ fontSize: 10, fontWeight: 600 }}>
                        ✓ Ajouté à votre IPPOO CASH
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Prize legend */}
        {showLegend && (
          <div className="mt-6 px-1">
            <p className="text-white/35 text-center mb-2.5" style={{ fontSize: 10, fontWeight: 700, fontFamily: "Poppins", letterSpacing: 1 }}>
              LOTS À GAGNER
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {segments
                .filter((s, i, arr) => arr.findIndex((x) => x.label === s.label && x.subLabel === s.subLabel) === i)
                .map((seg, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-white/65 truncate" style={{ fontSize: 9, fontWeight: 600 }}>
                      {seg.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MINI WHEEL TEASER (for SpinWheelTeaser)
   ═══════════════════════════════════════════ */
export function MiniWheelVisual({ size = 52 }: { size?: number }) {
  const [rot, setRot] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRot((r) => r + 2), 50);
    return () => clearInterval(id);
  }, []);

  const segments = DEFAULT_SEGMENTS;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const segAngle = 360 / segments.length;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 12px rgba(251,191,36,0.4)" }}
      />
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        animate={{ rotate: rot }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {segments.map((seg, i) => {
          const s = (i * segAngle - 90) * (Math.PI / 180);
          const e = ((i + 1) * segAngle - 90) * (Math.PI / 180);
          const x1 = cx + radius * Math.cos(s);
          const y1 = cy + radius * Math.sin(s);
          const x2 = cx + radius * Math.cos(e);
          const y2 = cy + radius * Math.sin(e);
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
          return <path key={i} d={d} fill={seg.color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />;
        })}
        <circle cx={cx} cy={cy} r={size * 0.18} fill="#1A1025" stroke="#E8A817" strokeWidth="1.5" />
      </motion.svg>
      {/* Center sparkle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Sparkles className="text-[#FBBF24]" style={{ width: size * 0.22, height: size * 0.22 }} />
      </div>
      {/* Mini pointer */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -2 }}>
        <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "8px solid #FBBF24", filter: "drop-shadow(0 0 2px #E8A817)" }} />
      </div>
    </div>
  );
}