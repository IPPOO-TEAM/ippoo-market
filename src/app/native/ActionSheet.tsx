import { haptic } from "./haptics";

type Action = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: Action[];
};

export function ActionSheet({ open, onClose, title, message, actions }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1100] flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full px-3 sheet-enter"
        style={{ paddingBottom: `calc(8px + var(--safe-bottom))` }}
      >
        <div className="bg-white/95 backdrop-blur rounded-2xl overflow-hidden shadow-2xl">
          {(title || message) && (
            <div className="px-5 py-3 text-center border-b border-border">
              {title && <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{title}</p>}
              {message && <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>{message}</p>}
            </div>
          )}
          {actions.map((a, i) => (
            <button
              key={i}
              disabled={a.disabled}
              onClick={() => { haptic(a.destructive ? "warning" : "selection"); a.onClick(); onClose(); }}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 press-feedback ${i < actions.length - 1 ? "border-b border-border" : ""} ${a.destructive ? "text-[#E11D2E]" : "text-[#0F172A]"} ${a.disabled ? "opacity-40" : "hover:bg-muted/40"}`}
              style={{ fontSize: 15, fontWeight: a.destructive ? 700 : 500 }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full px-5 py-3.5 rounded-2xl bg-white/95 backdrop-blur shadow-2xl press-feedback"
          style={{ fontSize: 15, fontWeight: 700 }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
