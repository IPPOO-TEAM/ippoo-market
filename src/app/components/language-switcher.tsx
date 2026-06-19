import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  getCurrentLangLabel,
  setCurrentLanguage,
  getLangCode,
} from "../i18n";

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(() => getCurrentLangLabel());
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCurrent(detail);
    };
    window.addEventListener("ippoo:lang", onLang);
    return () => window.removeEventListener("ippoo:lang", onLang);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (label: string) => {
    setCurrent(label);
    setCurrentLanguage(label);
    setOpen(false);
  };

  const short = getLangCode(current).toUpperCase();

  return (
    <div ref={ref} data-no-translate="true" className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Langue actuelle : ${current}. Changer de langue`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/40"
        style={{ fontSize: 12, fontFamily: "Poppins", fontWeight: 600 }}
      >
        <span
          className="px-2 py-0.5 rounded-md bg-muted text-foreground tabular-nums"
          style={{ fontSize: 11, fontWeight: 800, fontFamily: "Poppins", letterSpacing: 0.5 }}
        >
          {short}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sélecteur de langue"
          className="absolute right-0 mt-2 w-56 max-h-[60vh] overflow-y-auto bg-white border border-border rounded-xl shadow-lg z-[80] py-1"
        >
          {SUPPORTED_LANGUAGES.map((label) => {
            const active = label === current;
            const code = getLangCode(label).toUpperCase();
            return (
              <button
                key={label}
                role="option"
                aria-selected={active}
                onClick={() => pick(label)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#FFF7ED] transition-colors ${
                  active ? "bg-[#FFF7ED]" : ""
                }`}
                style={{ fontSize: 13, fontFamily: "Inter" }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 tabular-nums"
                    style={{ fontSize: 10, fontWeight: 700, fontFamily: "Poppins", letterSpacing: 0.5 }}
                  >
                    {code}
                  </span>
                  <span className={`truncate ${active ? "text-[#E11D2E]" : "text-foreground"}`}>
                    {label}
                  </span>
                </span>
                {active && <Check className="w-4 h-4 text-[#E11D2E] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
