import { motion } from "motion/react";
import {
  CreditCard,
  Package,
  Sparkles,
  Gift,
  Truck,
  Bell,
  Gamepad2,
  Trophy,
  Crown,
  Star,
  Coins,
  Flame,
  Cloud,
} from "lucide-react";
import type { NotifType } from "../notifications/store";

type Props = {
  type: NotifType;
  color: string;
  /** Compact = 44px tuile, Hero = 56px tuile dégradée pleine. */
  hero?: boolean;
};

/* ─────────────────────────────────────────────
   Petits effets réutilisables
   ───────────────────────────────────────────── */
function Pulse({ color, scale = 1.6 }: { color: string; scale?: number }) {
  return (
    <motion.span
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ background: color, opacity: 0.35 }}
      animate={{ scale: [1, scale, 1], opacity: [0.35, 0, 0.35] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function MiniSparkle({ x, y, delay = 0, size = 6, color = "#FBBF24" }: { x: string; y: string; delay?: number; size?: number; color?: string }) {
  return (
    <motion.span
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─────────────────────────────────────────────
   Illustration par type
   ───────────────────────────────────────────── */
function PaymentScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <CreditCard className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <motion.span
        className="absolute -top-1 -right-1"
        animate={{ y: [0, -3, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <Coins className="w-3 h-3 text-[#F0B429]" strokeWidth={2.6} />
      </motion.span>
    </>
  );
}

function OrderScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -2, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Package className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="78%" y="15%" delay={0.2} size={4} color={color} />
    </>
  );
}

function PromoScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flame className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="80%" y="20%" delay={0} color="#FB7185" />
      <MiniSparkle x="15%" y="70%" delay={0.6} color="#F97316" />
    </>
  );
}

function BonusScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <Coins className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="78%" y="25%" delay={0.1} />
      <MiniSparkle x="20%" y="68%" delay={0.7} />
    </>
  );
}

function DeliveryScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Truck className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <motion.span
        className="absolute bottom-1.5 left-1"
        animate={{ opacity: [0.2, 0.8, 0.2], x: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <Cloud className="w-2.5 h-2.5 text-current opacity-50" strokeWidth={2} />
      </motion.span>
    </>
  );
}

function GiftScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Gift className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="80%" y="20%" delay={0.1} color="#FBBF24" />
      <MiniSparkle x="15%" y="22%" delay={0.5} color="#FB7185" size={5} />
      <MiniSparkle x="50%" y="80%" delay={0.9} color="#22C55E" />
    </>
  );
}

function GameScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [-8, 8, -8], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Gamepad2 className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
    </>
  );
}

function WinScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -2, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Trophy className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="20%" y="18%" delay={0} color="#FBBF24" />
      <MiniSparkle x="80%" y="22%" delay={0.4} color="#FB7185" />
      <MiniSparkle x="78%" y="78%" delay={0.8} color="#22C55E" />
      <MiniSparkle x="20%" y="78%" delay={1.2} color="#60A5FA" />
    </>
  );
}

function VipScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Crown className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
      />
    </>
  );
}

function WelcomeScene({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <Star className="w-5 h-5 fill-current" style={{ color }} strokeWidth={2.4} />
      </motion.div>
      <MiniSparkle x="78%" y="20%" delay={0.1} />
      <MiniSparkle x="20%" y="75%" delay={0.6} color="#FB7185" />
    </>
  );
}

function SystemScene({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ rotate: [-12, 12, -12] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50% 30%" }}
    >
      <Bell className="w-5 h-5" style={{ color }} strokeWidth={2.4} />
    </motion.div>
  );
}

const SCENES: Record<NotifType, (p: { color: string }) => React.ReactNode> = {
  payment: PaymentScene,
  order: OrderScene,
  promo: PromoScene,
  bonus: BonusScene,
  delivery: DeliveryScene,
  system: SystemScene,
  gift: GiftScene,
  game: GameScene,
  win: WinScene,
  vip: VipScene,
  welcome: WelcomeScene,
};

/* Construit la tuile (44px / 56px) qui héberge la scène. */
export function NotifIllustration({ type, color, hero = false }: Props) {
  const Scene = SCENES[type] ?? SystemScene;
  const size = hero ? "w-14 h-14" : "w-11 h-11";
  const radius = hero ? "rounded-2xl" : "rounded-xl";

  if (hero) {
    return (
      <div className={`${size} ${radius} relative overflow-hidden shrink-0 flex items-center justify-center bg-white/25 backdrop-blur border border-white/30`}>
        <Pulse color="#FFFFFF" scale={1.4} />
        <div className="absolute inset-0 text-white">
          <Scene color="#FFFFFF" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${size} ${radius} relative overflow-hidden shrink-0`}
      style={{ background: `linear-gradient(135deg, ${color}18, ${color}28)` }}
    >
      <Pulse color={color} scale={1.5} />
      <Scene color={color} />
    </div>
  );
}
