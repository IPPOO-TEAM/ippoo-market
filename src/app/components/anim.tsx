/* ═══════════════════════════════════════════
   IPPOO — Helpers d'animation réutilisables (Motion)
   - FadeIn          : apparition douce d'un bloc
   - StaggerList     : conteneur qui décale ses enfants
   - StaggerItem     : enfant individuel d'un StaggerList
   - TapButton       : bouton avec micro-feedback tactile
   - PulseBadge      : pastille qui pulse (notif non lue, etc.)
   ═══════════════════════════════════════════ */

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { forwardRef } from "react";

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function FadeIn({ children, delay = 0, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function StaggerList({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={itemVariants} {...rest}>
      {children}
    </motion.div>
  );
}

type TapButtonProps = HTMLMotionProps<"button"> & { soft?: boolean };

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(function TapButton(
  { soft, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: soft ? 0.97 : 0.94 }}
      whileHover={soft ? { scale: 1.01 } : { scale: 1.02 }}
      transition={{ type: "spring", damping: 18, stiffness: 380 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export function PulseBadge({ children, color = "#E11D2E" }: { children?: React.ReactNode; color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: color, opacity: 0.6 }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <span
        className="relative inline-flex items-center justify-center rounded-full text-white"
        style={{ background: color, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px" }}
      >
        {children}
      </span>
    </span>
  );
}
