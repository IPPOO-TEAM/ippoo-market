import { useRef, type ChangeEvent, type ReactNode, type ComponentType } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function FileUpload({
  label,
  value,
  onChange,
  icon,
  accept = "image/*",
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  icon: ReactNode;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      onChange(await readFileAsDataURL(f));
    } catch {
      toast.error("Impossible de lire le fichier");
    }
  };
  return (
    <div className="rounded-xl bg-[#F9FAFB] p-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-[#FFF7ED] flex items-center justify-center overflow-hidden">
        {value && value.startsWith("data:image/") ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#E11D2E]">{icon}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 12, fontWeight: 600 }}>{label}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{value ? "Fichier ajouté" : "Aucun fichier"}</p>
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="px-3 py-1.5 rounded-lg bg-[#FF6A00] text-white"
        style={{ fontSize: 11, fontFamily: "Poppins", fontWeight: 700 }}
      >
        {value ? "Changer" : "Ajouter"}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="px-2 py-1.5 rounded-lg border border-border"
          style={{ fontSize: 11, fontFamily: "Poppins", fontWeight: 600 }}
        >
          Retirer
        </button>
      )}
      <input ref={ref} type="file" accept={accept} onChange={pick} className="hidden" />
    </div>
  );
}

export function RecapBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pl-3 border-l-2 border-[#E11D2E]/60">
      <p className="mb-1.5" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 11, color: "#E11D2E", letterSpacing: 0.6, textTransform: "uppercase" }}>
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function RecapRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3" style={{ fontSize: 12 }}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right truncate max-w-[60%]" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export type FieldRawProps = {
  icon: ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
};

export function FieldRaw({ icon: Icon, placeholder, value, onChange, type = "text" }: FieldRawProps) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}

export function PasswordRaw({
  value,
  onChange,
  show,
  toggle,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      />
      <button type="button" onClick={toggle} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted">
        {show ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

export function SelectRaw({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#5A5F6A", letterSpacing: 0.6 }}>{label.toUpperCase()}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none disabled:opacity-50"
        style={{ fontSize: 13 }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function TextareaRaw({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#5A5F6A", letterSpacing: 0.6 }}>{label.toUpperCase()}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none resize-none"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}
