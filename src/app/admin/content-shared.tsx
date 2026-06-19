import type { ReactNode } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1" style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      {children}
      {hint && <span className="text-muted-foreground block mt-1" style={{ fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

export const inputClass = "w-full px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30";
export const inputStyle = { fontSize: 13 } as const;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-border p-5 ${className}`}>{children}</div>;
}
