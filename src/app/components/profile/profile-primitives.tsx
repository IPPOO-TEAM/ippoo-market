import { ChevronRight, X, Cloud, CloudOff, User } from "lucide-react";

export const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const validatePhone = (v: string) => /^\+?\d[\d\s]{6,}$/.test(v);

export function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-border p-5 mb-4">
      <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export function Row({ icon: Icon, label, value, onClick }: { icon: typeof User; label: string; value: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2 border-b border-[#F3F4F6] text-left">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</p>
          <p className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{value}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      />
    </label>
  );
}

export function PrimaryBtn({ children, onClick, type = "button", disabled }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white disabled:opacity-60"
      style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
    >
      {children}
    </button>
  );
}

export function SyncBadge({ online, busy, email, onConnect }: { online: boolean; busy: boolean; email?: string; onConnect: () => void }) {
  if (!online) {
    return (
      <button
        type="button"
        onClick={onConnect}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/25"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        <CloudOff className="w-3.5 h-3.5" />
        Hors-ligne · Se connecter
      </button>
    );
  }
  return (
    <div
      title={email ? `Connecté en tant que ${email}` : undefined}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#16A34A] shadow-sm"
      style={{ fontSize: 11, fontWeight: 700 }}
    >
      <Cloud className={`w-3.5 h-3.5 ${busy ? "animate-pulse" : ""}`} />
      {busy ? "Synchronisation…" : "Synchronisé"}
    </div>
  );
}
