import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePayments } from "../payments/usePayments";
import { applyPromo, clearPromo } from "../payments/store";
import { formatPrice } from "./mock-data";

type Props = {
  title?: string;
  placeholder?: string;
  className?: string;
  /** Compact variant for tight spaces (cart sidebar). */
  compact?: boolean;
};

export function CouponInput({
  title = "Code promo / Bon d'achat",
  placeholder = "Entrez votre code…",
  className,
  compact = false,
}: Props) {
  const state = usePayments();
  const [input, setInput] = useState(state.promoCode || "");
  const [shake, setShake] = useState(0);

  const active = state.promoCode;
  const discount = state.promoDiscount;

  const onApply = () => {
    const r = applyPromo(input);
    if (!r.ok) {
      setShake((s) => s + 1);
      toast.error(r.error || "Code invalide");
      return;
    }
    const label = r.rate != null
      ? `-${Math.round(r.rate * 100)} %`
      : r.amount != null
        ? `-${formatPrice(r.amount)} FCFA`
        : "remise appliquée";
    toast.success(`Code appliqué · ${label}`);
  };

  const onClear = () => {
    clearPromo();
    setInput("");
    toast.success("Code retiré");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onApply();
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-border ${compact ? "p-3" : "p-4"} ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] flex items-center justify-center">
          <Tag className="w-3.5 h-3.5 text-[#16A34A]" strokeWidth={2.6} />
        </div>
        <h4 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>
          {title}
        </h4>
      </div>

      <motion.div
        key={shake}
        animate={{ x: shake ? [0, -6, 6, -4, 4, 0] : 0 }}
        transition={{ duration: 0.32 }}
        className="relative"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={onKey}
              disabled={!!active}
              aria-label="Code promo"
              className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-[#F5F0EB] border border-transparent focus:bg-white focus:border-[#16A34A]/40 outline-none uppercase disabled:opacity-70 transition-all"
              style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, color: "#0F172A" }}
            />
            {active && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16A34A]" strokeWidth={3} />
            )}
          </div>
          {active ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onClear}
              className="px-3.5 py-2.5 rounded-xl bg-[#FEE2E2] text-[#B91C1C] inline-flex items-center gap-1 hover:bg-[#FECACA] transition-colors"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.6} /> Retirer
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onApply}
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl text-white inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                fontSize: 12,
                fontWeight: 800,
                background: "linear-gradient(90deg, #16A34A, #22C55E)",
                boxShadow: "0 6px 14px -6px rgba(22,163,74,0.55)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.6} /> Appliquer
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {active && discount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: "linear-gradient(90deg, #DCFCE7, #FEF3C7)" }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D" }}>
                Code <strong>{active}</strong> actif
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 900, color: "#15803D" }}>
                −{formatPrice(discount)} FCFA
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
