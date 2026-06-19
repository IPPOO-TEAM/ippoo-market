/* ═══════════════════════════════════════════
   IPPOO — Validateurs centralisés
   Règles communes à l'inscription, profil pro et formulaires.
   Renvoient `null` si OK, sinon un message d'erreur FR prêt
   à afficher (toast / inline).
   ═══════════════════════════════════════════ */

export type Validator<T = string> = (v: T) => string | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Téléphone Afrique de l'Ouest : autorise +, espaces, tirets, parenthèses
// Doit contenir au moins 8 chiffres
const PHONE_RE = /^[\s+\-().\d]{8,}$/;
// RCCM Bénin/CI : RB-COT-2024-B-12345 ou format libre alphanumérique
const RCCM_RE = /^[A-Z0-9\-\/]{6,30}$/i;
// IFU Bénin : 13 chiffres
const IFU_RE = /^\d{10,13}$/;

export const validateEmail: Validator = (v) => {
  const s = (v ?? "").trim();
  if (!s) return "L'email est requis.";
  if (!EMAIL_RE.test(s)) return "Format d'email invalide.";
  return null;
};

export const validatePhone: Validator = (v) => {
  const s = (v ?? "").trim();
  if (!s) return "Le numéro de téléphone est requis.";
  if (!PHONE_RE.test(s)) return "Numéro invalide (ex: +229 01 97 00 00 00).";
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8) return "Au moins 8 chiffres requis.";
  return null;
};

export const validatePassword: Validator = (v) => {
  const s = v ?? "";
  if (s.length < 8) return "Au moins 8 caractères.";
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return "Doit contenir lettres et chiffres.";
  return null;
};

export const validateRequired = (label: string): Validator => (v) => {
  const s = (v ?? "").toString().trim();
  return s ? null : `${label} est requis.`;
};

export const validateMinLen = (n: number, label: string): Validator => (v) => {
  const s = (v ?? "").toString().trim();
  return s.length >= n ? null : `${label} doit faire au moins ${n} caractères.`;
};

export const validateRCCM: Validator = (v) => {
  const s = (v ?? "").trim();
  if (!s) return null; // optionnel
  if (!RCCM_RE.test(s)) return "Format RCCM invalide.";
  return null;
};

export const validateIFU: Validator = (v) => {
  const s = (v ?? "").replace(/\s/g, "");
  if (!s) return null; // optionnel
  if (!IFU_RE.test(s)) return "L'IFU doit contenir 10 à 13 chiffres.";
  return null;
};

export const validateURL: Validator = (v) => {
  const s = (v ?? "").trim();
  if (!s) return null;
  try { new URL(s); return null; } catch { return "URL invalide."; }
};

export const validateDateRange = (start: string, end: string): string | null => {
  if (!start || !end) return null;
  if (end < start) return "La date de fin doit être après la date de début.";
  return null;
};

/** Compose plusieurs validateurs, retourne la première erreur. */
export function compose<T>(...vs: Validator<T>[]): Validator<T> {
  return (v) => {
    for (const fn of vs) {
      const err = fn(v);
      if (err) return err;
    }
    return null;
  };
}

/** Valide un objet champ par champ, retourne `{ champ: erreur }`. */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: Partial<{ [K in keyof T]: Validator<T[K]> }>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const rule = rules[key];
    if (!rule) continue;
    const err = (rule as Validator<T[typeof key]>)(values[key]);
    if (err) errors[key] = err;
  }
  return errors;
}
