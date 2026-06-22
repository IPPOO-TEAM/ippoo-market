/* ═══════════════════════════════════════════
   IPPOO Market - PhoneInput
   Indicatif (54 pays africains) + numéro national
   formaté selon les règles locales. Aucune emoji,
   accessibilité clavier, recherche dans le picker.
   ═══════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Phone, Search, Check } from "lucide-react";
import {
  AFRICAN_COUNTRIES,
  DEFAULT_COUNTRY,
  formatNationalDigits,
  formatFullPhone,
  parseStoredPhone,
  isValidPhone,
  type AfricanCountry,
} from "../data/african-countries";

type Props = {
  value: string;
  onChange: (fullE164ish: string) => void;
  label?: string;
  placeholder?: string;
  defaultIso?: string;
  /** Affiche le message d'erreur en dessous si le numéro ne respecte pas le NSN. */
  showValidation?: boolean;
  className?: string;
};

export function PhoneInput({
  value,
  onChange,
  label,
  placeholder,
  defaultIso = "BJ",
  showValidation = false,
  className,
}: Props) {
  // Hydrate depuis la valeur stockée (ou défaut Bénin).
  const initial = useMemo(() => {
    if (value) return parseStoredPhone(value);
    return {
      country: AFRICAN_COUNTRIES.find((c) => c.iso === defaultIso) ?? DEFAULT_COUNTRY,
      national: "",
    };
  }, [defaultIso]); // hydrate une seule fois sur défaut

  const [country, setCountry] = useState<AfricanCountry>(initial.country);
  const [national, setNational] = useState<string>(formatNationalDigits(initial.national));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Émet vers le parent à chaque modif (formaté).
  useEffect(() => {
    onChange(formatFullPhone(country, national));
    // onChange volontairement non listé : référence parent souvent inline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, national]);

  // Ferme au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AFRICAN_COUNTRIES;
    return AFRICAN_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.toLowerCase().includes(q),
    );
  }, [query]);

  const valid = !national || isValidPhone(country, national);
  const ph = placeholder ?? country.example.replace(`+${country.dial} `, "");

  return (
    <div className={className}>
      {label && (
        <label className="block mb-1" style={{ fontSize: 11, color: "#5A5F6A", letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </label>
      )}
      <div ref={wrapRef} className="relative">
        <div className="flex items-stretch rounded-xl bg-[#F3F4F6] focus-within:ring-2 focus-within:ring-[#E11D2E]/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-1.5 pl-3 pr-2 border-r border-border/60 hover:bg-[#ECEEF3] transition-colors"
            style={{ fontSize: 13 }}
          >
            <span
              className="inline-flex items-center justify-center rounded-md bg-white px-1.5 py-0.5 border border-border"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}
            >
              {country.iso}
            </span>
            <span style={{ fontFamily: "Poppins", fontWeight: 700 }}>+{country.dial}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="relative flex-1">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={ph}
              value={national}
              onChange={(e) => setNational(formatNationalDigits(e.target.value))}
              className="w-full pl-8 pr-3 py-2.5 bg-transparent focus:outline-none"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {open && (
          <div className="absolute z-50 mt-1 left-0 right-0 max-h-72 rounded-xl bg-white border border-border shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un pays…"
                  className="w-full pl-8 pr-2 py-2 rounded-lg bg-[#F3F4F6] focus:outline-none"
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>
            <ul role="listbox" className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {list.map((c) => {
                const active = c.iso === country.iso;
                return (
                  <li key={c.iso}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setCountry(c);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FFF7ED] ${active ? "bg-[#FFF7ED]" : ""}`}
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-md bg-white px-1.5 py-0.5 border border-border"
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}
                      >
                        {c.iso}
                      </span>
                      <span className="flex-1 truncate" style={{ fontSize: 13 }}>{c.name}</span>
                      <span className="text-muted-foreground" style={{ fontSize: 12 }}>+{c.dial}</span>
                      {active && <Check className="w-4 h-4 text-[#E11D2E]" />}
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-3 py-3 text-center text-muted-foreground" style={{ fontSize: 12 }}>
                  Aucun pays trouvé
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {showValidation && !valid && (
        <p className="mt-1 text-[#E11D2E]" style={{ fontSize: 11 }}>
          Numéro invalide pour {country.name}. Exemple : {country.example}
        </p>
      )}
    </div>
  );
}

export { isValidPhone, parseStoredPhone };
