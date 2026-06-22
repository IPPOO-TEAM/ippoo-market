import { Search, Check } from "lucide-react";

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22 }}>{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-white rounded-2xl border border-border ${className}`} style={style}>{children}</div>;
}

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md inline-flex items-center gap-1"
      style={{ fontSize: 11, fontWeight: 700, color, background: color + "1A" }}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    preparation: { color: "#3B82F6", label: "Préparation" },
    expedition: { color: "#9333EA", label: "Expédition" },
    livree: { color: "#16A34A", label: "Livrée" },
    cloturee: { color: "#6B7280", label: "Clôturée" },
    litige: { color: "#E11D2E", label: "Litige" },
    annulee: { color: "#9CA3AF", label: "Annulée" },
    active: { color: "#16A34A", label: "Actif" },
    suspended: { color: "#E11D2E", label: "Suspendu" },
    pending: { color: "#F0B429", label: "En attente" },
    approved: { color: "#16A34A", label: "Approuvé" },
    rejected: { color: "#E11D2E", label: "Rejeté" },
    draft: { color: "#6B7280", label: "Brouillon" },
    out_of_stock: { color: "#F0B429", label: "Rupture" },
    blocked: { color: "#E11D2E", label: "Bloqué" },
    verified: { color: "#16A34A", label: "Vérifié" },
    missing: { color: "#9CA3AF", label: "Manquant" },
    open: { color: "#E11D2E", label: "Ouvert" },
    in_progress: { color: "#3B82F6", label: "En cours" },
    resolved: { color: "#16A34A", label: "Résolu" },
    closed: { color: "#6B7280", label: "Fermé" },
    low: { color: "#6B7280", label: "Basse" },
    normal: { color: "#3B82F6", label: "Normale" },
    high: { color: "#F97316", label: "Haute" },
    urgent: { color: "#E11D2E", label: "Urgente" },
  };
  const v = map[status] ?? { color: "#6B7280", label: status };
  return <Badge color={v.color}>{v.label}</Badge>;
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-md">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-3 py-2 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-[#E11D2E]/30"
      style={{ fontSize: 13 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left px-4 py-3 text-muted-foreground border-b border-border ${className}`}
      style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "", style, colSpan }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 border-b border-[#F3F4F6] ${className}`} style={{ fontSize: 13, ...style }}>{children}</td>;
}

export function IconBtn({ icon: Icon, label, onClick, color = "#6B7280" }: { icon: typeof Check; label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1.5 rounded-lg hover:bg-muted"
      style={{ color }}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function EmptyState({ children, title, description }: { children?: React.ReactNode; title?: string; description?: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground" style={{ fontSize: 13 }}>
      {title && <div className="text-foreground" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>}
      {description && <div>{description}</div>}
      {children}
    </div>
  );
}
