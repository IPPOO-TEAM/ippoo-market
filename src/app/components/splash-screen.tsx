import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ippooLogoUrl from "../../imports/ippo_market.png";

/**
 * IPPOO Market - Splash Screen Animé
 * Affiché au premier chargement avec animation du logo et tagline
 * Palette : Rouge #E11D2E, fond chaud #FFF7ED
 */

const SPLASH_DURATION = 2400; // ms

type SplashScreenProps = {
  onComplete: () => void;
};

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState<"logo" | "tagline" | "fade">("logo");

  useEffect(() => {
    // S'assure que l'animation démarre immédiatement
    const t1 = setTimeout(() => setStage("tagline"), 800);
    const t2 = setTimeout(() => setStage("fade"), 1800);
    const t3 = setTimeout(() => {
      onComplete();
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {stage !== "fade" ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FFF7ED 100%)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Logo animé */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1], // spring-like easing
            }}
            className="relative mb-6"
          >
            <motion.img
              src={ippooLogoUrl}
              alt="IPPOO Market"
              className="w-28 h-28 object-contain drop-shadow-lg"
              animate={{
                rotate: [0, -5, 5, -5, 0],
              }}
              transition={{
                duration: 1.2,
                delay: 0.4,
                ease: "easeInOut",
              }}
            />
            {/* Pulse glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(225,29,46,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl font-bold mb-2"
            style={{ color: "#E11D2E", fontFamily: "Poppins, sans-serif" }}
          >
            IPPOO Market
          </motion.h1>

          {/* Tagline avec animation de typing */}
          <AnimatePresence>
            {stage === "tagline" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-base text-center px-6"
                style={{ color: "#78716C", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
              >
                Le grossiste africain de confiance
              </motion.p>
            )}
          </AnimatePresence>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex gap-1.5 mt-8"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#E11D2E" }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top right accent */}
            <motion.div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10"
              style={{ background: "#E11D2E" }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            {/* Bottom left accent */}
            <motion.div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10"
              style={{ background: "#16A34A" }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Hook pour gérer l'affichage du splash screen (une seule fois par session)
 */
export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = "ippoo:splash-shown";
    const shown = sessionStorage.getItem(key);
    return !shown;
  });

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ippoo:splash-shown", "1");
    }
    setShowSplash(false);
  };

  return { showSplash, handleComplete };
}
