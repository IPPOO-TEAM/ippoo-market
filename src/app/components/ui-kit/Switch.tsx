type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
  tone?: "success" | "brand" | "primary";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  success: "#16A34A",
  brand: "#E11D2E",
  primary: "#0F172A",
};

export function Switch({ checked, onChange, disabled, label, size = "md", tone = "success" }: Props) {
  const dims = size === "sm"
    ? { w: 36, h: 20, t: 16 }
    : { w: 44, h: 24, t: 20 };
  const pad = (dims.h - dims.t) / 2;
  const tx = checked ? dims.w - dims.t - pad : pad;

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-block shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/30 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        width: dims.w,
        height: dims.h,
        backgroundColor: checked ? TONE[tone] : "#E5E7EB",
        transition: "background-color 200ms ease",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full bg-white pointer-events-none"
        style={{
          width: dims.t,
          height: dims.t,
          top: pad,
          left: 0,
          transform: `translateX(${tx}px)`,
          transition: "transform 200ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12)",
        }}
      />
    </button>
  );
}

type SegmentedProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  size?: "sm" | "md";
  ariaLabel?: string;
};

export function Segmented<T extends string>({ value, onChange, options, size = "md", ariaLabel }: SegmentedProps<T>) {
  const padY = size === "sm" ? 4 : 6;
  const padX = size === "sm" ? 10 : 14;
  const fs = size === "sm" ? 11 : 12;
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex p-1 rounded-xl bg-[#F3F4F6] border border-border"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#E11D2E]/40 ${active ? "bg-white text-[#0F172A]" : "text-muted-foreground hover:text-[#0F172A]"}`}
            style={{
              padding: `${padY}px ${padX}px`,
              fontSize: fs,
              fontWeight: active ? 700 : 600,
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
