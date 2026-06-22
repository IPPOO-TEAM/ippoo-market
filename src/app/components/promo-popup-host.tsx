/* ═══════════════════════════════════════════
   IPPOO - PromoPopupHost
   Affiche le popup courant émis par notifications/popups.ts.
   Inspiré des popups "rewards" Tokopedia / Temu : header dégradé,
   tickets coupon en grille, CTA principal + secondaire.
   ═══════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, ChevronRight, Gift, Crown, Gamepad2, Info, Megaphone, BadgePercent } from "lucide-react";
import { dismissCurrent, getCurrentPopup, subscribePopups, type Popup } from "../notifications/popups";

const KIND_ICON: Record<NonNullable<Popup["kind"]>, React.ComponentType<any>> = {
  welcome: Gift,
  bonus: BadgePercent,
  promo: Megaphone,
  vip: Crown,
  game: Gamepad2,
  info: Info,
  system: Info,
};

const TONE_BG: Record<NonNullable<NonNullable<Popup["tickets"]>[number]["tone"]>, { bg: string; chip: string; text: string }> = {
  gold:   { bg: "#FFF7E0", chip: "#F0B429", text: "#92410E" },
  red:    { bg: "#FFE4E6", chip: "#E11D2E", text: "#9F0F1F" },
  violet: { bg: "#F1ECFE", chip: "#7C3AED", text: "#4C1D95" },
  green:  { bg: "#DCFCE7", chip: "#16A34A", text: "#14532D" },
};

export function PromoPopupHost() {
  const [popup, setPopup] = useState<Popup | null>(getCurrentPopup());

  useEffect(() => {
    const sync = () => setPopup(getCurrentPopup());
    sync();
    return subscribePopups(sync);
  }, []);

  const close = () => {
    dismissCurrent();
  };

  const onCta = (link?: string) => {
    dismissCurrent();
    if (link) {
      // Émet un event que le routeur intercepte (PromoPopupHost vit hors
      // RouterProvider). Fallback : hashchange/pushState manuel.
      window.dispatchEvent(new CustomEvent("ippoo:navigate", { detail: link }));
    }
  };

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          key={popup.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xl p-4"
          onClick={close}
        >
          <motion.div
            initial={{ y: 40, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 22, mass: 0.9 }}
            className="w-full max-w-sm bg-white rounded-[28px] overflow-hidden relative"
            style={{ boxShadow: "0 30px 80px -20px rgba(15,23,42,0.45), 0 8px 24px -8px rgba(15,23,42,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring derrière l'icône */}
            <motion.div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${popup.gradient?.[0] ?? "#E11D2E"}55 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.85, 0.6] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Header dégradé */}
            <div
              className="relative px-5 pt-7 pb-8 text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${popup.gradient?.[0] ?? "#E11D2E"} 0%, ${popup.gradient?.[1] ?? "#F97316"} 100%)`,
              }}
            >
              {/* Halo lumineux animé */}
              <motion.div
                className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/15 blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full bg-white/10 blur-2xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.8 }}
              />

              <button
                onClick={close}
                aria-label="Fermer"
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 backdrop-blur flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" strokeWidth={2.6} />
              </button>

              {/* Sparkles flottants */}
              {[
                { x: "12%", y: "20%", size: 14, delay: 0, dur: 2.8 },
                { x: "85%", y: "30%", size: 10, delay: 0.6, dur: 2.4 },
                { x: "20%", y: "75%", size: 12, delay: 1.1, dur: 3 },
                { x: "78%", y: "82%", size: 9, delay: 0.3, dur: 2.6 },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none text-white"
                  style={{ left: s.x, top: s.y }}
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 1, 0.4],
                    rotate: [0, 25, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles style={{ width: s.size, height: s.size }} strokeWidth={2.4} />
                </motion.div>
              ))}

              <div className="relative text-center">
                {(() => {
                  const Icon = KIND_ICON[popup.kind] ?? Gift;
                  return (
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                      className="relative mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 border border-white/30"
                      style={{ boxShadow: "0 8px 24px -6px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.08)" }}
                    >
                      <motion.div
                        animate={{ rotate: [0, -6, 6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon className="w-8 h-8" strokeWidth={2.2} />
                      </motion.div>
                      <motion.span
                        className="absolute -top-1.5 -right-1.5"
                        animate={{ rotate: [0, 18, -18, 0], scale: [1, 1.25, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-200" strokeWidth={2.4} />
                      </motion.span>
                    </motion.div>
                  );
                })()}
                <h2 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22, lineHeight: "26px", letterSpacing: -0.2 }}>
                  {popup.title}
                </h2>
                {popup.subtitle && (
                  <p className="opacity-95 mt-1.5 mx-auto max-w-xs" style={{ fontSize: 12.5, lineHeight: "17px" }}>
                    {popup.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Tickets */}
            {popup.tickets && popup.tickets.length > 0 && (
              <div className="px-4 -mt-3 mb-2">
                <div className="rounded-2xl bg-white border border-border shadow-sm p-3 grid grid-cols-2 gap-2.5">
                  {popup.tickets.slice(0, 4).map((t, i) => {
                    const tone = TONE_BG[t.tone ?? "gold"];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 14, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.18 + i * 0.07, type: "spring", damping: 18, stiffness: 240 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        className="relative rounded-xl p-2.5"
                        style={{ background: tone.bg }}
                      >
                        {t.tag && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-white mb-1"
                            style={{ background: tone.chip, fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}
                          >
                            {t.tag.toUpperCase()}
                          </span>
                        )}
                        <p
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 900,
                            fontSize: 16,
                            lineHeight: "20px",
                            color: tone.text,
                          }}
                        >
                          {t.value}
                        </p>
                        {t.caption && (
                          <p className="opacity-80 mt-0.5" style={{ fontSize: 10, color: tone.text }}>
                            {t.caption}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="p-4 pt-2 space-y-2">
              {(popup.ctas ?? [{ label: "OK", variant: "primary" }]).map((cta, i) => (
                <button
                  key={i}
                  onClick={() => onCta(cta.link)}
                  className={
                    cta.variant === "secondary"
                      ? "w-full py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted"
                      : "w-full py-3.5 rounded-xl text-white inline-flex items-center justify-center gap-1.5 shadow-sm"
                  }
                  style={
                    cta.variant === "secondary"
                      ? { fontSize: 13, fontWeight: 600 }
                      : {
                          fontFamily: "Poppins",
                          fontWeight: 800,
                          fontSize: 14,
                          background: `linear-gradient(90deg, ${popup.gradient?.[0] ?? "#E11D2E"}, ${popup.gradient?.[1] ?? "#F97316"})`,
                        }
                  }
                >
                  {cta.label}
                  {cta.variant !== "secondary" && cta.link && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
